import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { UserOrganization } from '../../generated/client';
import { UserRole } from '../../shared';

@Injectable()
export class UserOrganizationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Assign one or more organizations to a user
   */
  async assignOrganizationsToUser(
    userId: number,
    organizationIds: number[],
  ): Promise<UserOrganization[]> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if all organizations exist
    const organizations = await this.prisma.organization.findMany({
      where: {
        id: { in: organizationIds },
      },
    });

    if (organizations.length !== organizationIds.length) {
      const foundIds = organizations.map((org) => org.id);
      const missingIds = organizationIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Organizations with IDs ${missingIds.join(', ')} not found`,
      );
    }

    // Create user-organization relationships (skip if already exists)
    const results: UserOrganization[] = [];
    let hasNewAssignment = false;

    for (const organizationId of organizationIds) {
      try {
        const userOrg = await this.prisma.userOrganization.create({
          data: {
            userId,
            organizationId,
          },
        });
        results.push(userOrg);
        hasNewAssignment = true;
      } catch (error) {
        // Ignore unique constraint violations (already assigned)
        if (error?.code !== 'P2002') {
          throw error;
        }
      }
    }

    // If at least one new assignment was created, add ORGANIZATION_MANAGER role
    if (hasNewAssignment) {
      await this.ensureOrganizationManagerRole(userId);
    }

    return results;
  }

  /**
   * Assign one or more users to an organization
   */
  async assignUsersToOrganization(
    organizationId: number,
    userIds: number[],
  ): Promise<UserOrganization[]> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${organizationId} not found`);
    }

    // Check if all users exist
    const users = await this.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
    });

    if (users.length !== userIds.length) {
      const foundIds = users.map((user) => user.id);
      const missingIds = userIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Users with IDs ${missingIds.join(', ')} not found`);
    }

    // Create user-organization relationships (skip if already exists)
    const results: UserOrganization[] = [];
    const usersWithNewAssignment: number[] = [];

    for (const userId of userIds) {
      try {
        const userOrg = await this.prisma.userOrganization.create({
          data: {
            userId,
            organizationId,
          },
        });
        results.push(userOrg);
        usersWithNewAssignment.push(userId);
      } catch (error) {
        // Ignore unique constraint violations (already assigned)
        if (error?.code !== 'P2002') {
          throw error;
        }
      }
    }

    // Add ORGANIZATION_MANAGER role to users with new assignments
    for (const userId of usersWithNewAssignment) {
      await this.ensureOrganizationManagerRole(userId);
    }

    return results;
  }

  /**
   * Remove organization assignment from user
   */
  async unassignOrganizationFromUser(
    userId: number,
    organizationId: number,
  ): Promise<void> {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!userOrg) {
      throw new NotFoundException(
        `User ${userId} is not assigned to organization ${organizationId}`,
      );
    }

    // Delete the assignment
    await this.prisma.userOrganization.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    // Check if user has any other organization assignments
    const remainingAssignments = await this.prisma.userOrganization.findMany({
      where: { userId },
    });

    // If this was the last organization, remove ORGANIZATION_MANAGER role
    if (remainingAssignments.length === 0) {
      await this.removeOrganizationManagerRole(userId);
    }
  }

  /**
   * Remove user assignment from organization
   */
  async unassignUserFromOrganization(
    organizationId: number,
    userId: number,
  ): Promise<void> {
    await this.unassignOrganizationFromUser(userId, organizationId);
  }

  /**
   * Get all organizations managed by a user
   */
  async getOrganizationsByUserId(userId: number) {
    return this.prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get all users managing an organization
   */
  async getUsersByOrganizationId(organizationId: number) {
    return this.prisma.userOrganization.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            phone: true,
            roles: true,
            isPhoneVerified: true,
            isEmailVerified: true,
            isVerified: true,
            createdAt: true,
            updatedAt: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Check if user manages an organization
   */
  async userManagesOrganization(userId: number, organizationId: number): Promise<boolean> {
    const userOrg = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    return !!userOrg;
  }

  /**
   * Ensure user has ORGANIZATION_MANAGER role
   * Adds the role if user doesn't have it
   */
  private async ensureOrganizationManagerRole(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      return;
    }

    const roles = user.roles || [];
    const roleName = UserRole.ORGANIZATION_MANAGER;

    // If user doesn't have the role, add it
    if (!roles.includes(roleName)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          roles: [...roles, roleName],
        },
      });
    }
  }

  /**
   * Remove ORGANIZATION_MANAGER role from user
   * Only removes if user has no organization assignments
   */
  private async removeOrganizationManagerRole(userId: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });

    if (!user) {
      return;
    }

    const roles = user.roles || [];
    const roleName = UserRole.ORGANIZATION_MANAGER;

    // If user has the role, remove it
    if (roles.includes(roleName)) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          roles: roles.filter((role) => role !== roleName),
        },
      });
    }
  }
}

