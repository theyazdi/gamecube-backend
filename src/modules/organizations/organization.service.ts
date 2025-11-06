import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Organization } from '../../generated/client';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { UserRole } from '../../shared';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(data: CreateOrganizationDto): Promise<Organization> {
    return this.prisma.organization.create({
      data,
    });
  }

  /**
   * Get all organizations (filtered by user role)
   * @param userId - Optional user ID to filter organizations for organization managers
   * @param userRoles - User roles to determine access level
   */
  async findAllOrganizations(userId?: number, userRoles?: string[]): Promise<Organization[]> {
    // Super admin can see all organizations
    if (userRoles?.includes(UserRole.SUPER_ADMIN)) {
      return this.prisma.organization.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Organization managers can only see their assigned organizations
    if (userRoles?.includes(UserRole.ORGANIZATION_MANAGER) && userId) {
      return this.prisma.organization.findMany({
        where: {
          managers: {
            some: {
              userId,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Default: return all (for other roles or no role specified)
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrganizationById(id: number): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  async findOrganizationByUuid(uuid: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { uuid },
    });
  }

  async findOrganizationsByProvince(province: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { province },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrganizationsByCity(city: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { city },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrganizationsByProvinceAndCity(province: string, city: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { province, city },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update organization (with access control)
   * @param id - Organization ID
   * @param data - Update data
   * @param userId - Optional user ID for access control
   * @param userRoles - User roles for access control
   */
  async updateOrganization(
    id: number,
    data: UpdateOrganizationDto,
    userId?: number,
    userRoles?: string[],
  ): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Check access: Super admin can update any, organization manager can only update their assigned
    if (userRoles?.includes(UserRole.ORGANIZATION_MANAGER) && !userRoles?.includes(UserRole.SUPER_ADMIN)) {
      if (!userId) {
        throw new ForbiddenException('User ID required for organization manager');
      }

      const userOrg = await this.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: id,
          },
        },
      });

      if (!userOrg) {
        throw new ForbiddenException('You do not have permission to update this organization');
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async updateOrganizationByUuid(uuid: string, data: UpdateOrganizationDto): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { uuid },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with UUID ${uuid} not found`);
    }

    return this.prisma.organization.update({
      where: { uuid },
      data,
    });
  }

  async deleteOrganization(id: number): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async deleteOrganizationByUuid(uuid: string): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { uuid },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with UUID ${uuid} not found`);
    }

    return this.prisma.organization.delete({
      where: { uuid },
    });
  }

  /**
   * Find organizations near a given location within a specified radius
   * Uses optimized SQL query with Haversine formula for maximum performance
   * Returns organizations sorted by distance (closest first)
   */
  async findNearbyOrganizations(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<(Organization & { distance: number })[]> {
    // Calculate bounding box for pre-filtering
    const latDiff = radiusKm / 111.0;
    const lonDiff = radiusKm / (111.0 * Math.cos(latitude * Math.PI / 180));
    
    // Use raw SQL query with subquery to filter by calculated distance
    // This ensures we can filter by the computed distance column
    const organizations = await this.prisma.$queryRaw<(Organization & { distance: number })[]>`
      SELECT * FROM (
        SELECT 
          id,
          uuid,
          name,
          province,
          city,
          "indexImage",
          "logoImage",
          address,
          latitude,
          longitude,
          "tfHour",
          "isCube",
          "createdAt",
          "updatedAt",
          (
            6371 * acos(
              GREATEST(-1, LEAST(1,
                cos(radians(${latitude})) * 
                cos(radians(CAST(latitude AS DECIMAL))) * 
                cos(radians(CAST(longitude AS DECIMAL)) - radians(${longitude})) + 
                sin(radians(${latitude})) * 
                sin(radians(CAST(latitude AS DECIMAL)))
              ))
            )
          ) AS distance
        FROM organizations
        WHERE 
          latitude IS NOT NULL 
          AND longitude IS NOT NULL
          -- Bounding box pre-filter for better performance (approximate)
          AND CAST(latitude AS DECIMAL) BETWEEN ${latitude - latDiff} AND ${latitude + latDiff}
          AND CAST(longitude AS DECIMAL) BETWEEN ${longitude - lonDiff} AND ${longitude + lonDiff}
      ) AS nearby_orgs
      WHERE distance <= ${radiusKm}
      ORDER BY distance ASC
    `;

    return organizations;
  }

  /**
   * Get organization IDs managed by a user (for filtering)
   */
  async getUserOrganizationIds(userId: number): Promise<number[]> {
    const userOrgs = await this.prisma.userOrganization.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    return userOrgs.map(uo => uo.organizationId);
  }
}
