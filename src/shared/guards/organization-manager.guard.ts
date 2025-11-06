import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { UserRole } from '../decorators/roles.enum';

@Injectable()
export class OrganizationManagerGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userRoles = user.roles || [];

    // Super admin has access to all organizations
    if (userRoles.includes(UserRole.SUPER_ADMIN)) {
      return true;
    }

    // Check if user is organization manager
    if (!userRoles.includes(UserRole.ORGANIZATION_MANAGER)) {
      throw new ForbiddenException('Access denied. Organization manager role required.');
    }

    // Get organization ID from request (can be from params, body, or query)
    const organizationId = 
      request.params?.id || 
      request.params?.organizationId || 
      request.body?.organizationId ||
      request.query?.organizationId;

    if (!organizationId) {
      // If no organization ID in request, allow access (for listing endpoints)
      return true;
    }

    // Check if user manages this organization
    const userOrganization = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: parseInt(organizationId, 10),
        },
      },
    });

    if (!userOrganization) {
      throw new ForbiddenException('Access denied. You do not manage this organization.');
    }

    return true;
  }
}

