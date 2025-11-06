import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserOrganizationService } from './user-organization.service';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';
import { OrganizationManagerGuard } from '../../shared/guards/organization-manager.guard';
import { AuthenticatedRequest } from '../../shared/interfaces/authenticated-request.interface';

@ApiTags('user-organizations')
@Controller('user-organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserOrganizationController {
  constructor(private readonly userOrganizationService: UserOrganizationService) {}

  @Post('assign-organizations-to-user')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Assign organizations to a user',
    description: 'Assigns one or more organizations to a user (only SUPER_ADMIN)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'number', example: 1 },
        organizationIds: { type: 'array', items: { type: 'number' }, example: [1, 2, 3] },
      },
      required: ['userId', 'organizationIds'],
    },
  })
  @ApiCreatedResponse({
    description: 'Organizations assigned successfully',
  })
  @ApiNotFoundResponse({
    description: 'User or organization not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async assignOrganizationsToUser(
    @Body('userId', ParseIntPipe) userId: number,
    @Body('organizationIds') organizationIds: number[],
  ) {
    return this.userOrganizationService.assignOrganizationsToUser(userId, organizationIds);
  }

  @Post('assign-users-to-organization')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Assign users to an organization',
    description: 'Assigns one or more users to an organization (only SUPER_ADMIN)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        organizationId: { type: 'number', example: 1 },
        userIds: { type: 'array', items: { type: 'number' }, example: [1, 2, 3] },
      },
      required: ['organizationId', 'userIds'],
    },
  })
  @ApiCreatedResponse({
    description: 'Users assigned successfully',
  })
  @ApiNotFoundResponse({
    description: 'User or organization not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async assignUsersToOrganization(
    @Body('organizationId', ParseIntPipe) organizationId: number,
    @Body('userIds') userIds: number[],
  ) {
    return this.userOrganizationService.assignUsersToOrganization(organizationId, userIds);
  }

  @Delete('user/:userId/organization/:organizationId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Unassign organization from user',
    description: 'Removes organization assignment from a user (only SUPER_ADMIN)',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: 'number',
    example: 1,
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Organization unassigned successfully',
  })
  @ApiNotFoundResponse({
    description: 'Assignment not found',
  })
  async unassignOrganizationFromUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ): Promise<void> {
    await this.userOrganizationService.unassignOrganizationFromUser(userId, organizationId);
  }

  @Get('user/:userId/organizations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @ApiOperation({
    summary: 'Get organizations managed by a user',
    description: 'Returns all organizations assigned to a user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Organizations retrieved successfully',
  })
  async getOrganizationsByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.userOrganizationService.getOrganizationsByUserId(userId);
  }

  @Get('organization/:organizationId/users')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @UseGuards(OrganizationManagerGuard)
  @ApiOperation({
    summary: 'Get users managing an organization',
    description: 'Returns all users assigned to manage an organization',
  })
  @ApiParam({
    name: 'organizationId',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Users retrieved successfully',
  })
  async getUsersByOrganizationId(
    @Param('organizationId', ParseIntPipe) organizationId: number,
  ) {
    return this.userOrganizationService.getUsersByOrganizationId(organizationId);
  }

  @Get('my-organizations')
  @Roles(UserRole.ORGANIZATION_MANAGER)
  @ApiOperation({
    summary: 'Get current user organizations',
    description: 'Returns all organizations managed by the authenticated user',
  })
  @ApiOkResponse({
    description: 'Organizations retrieved successfully',
  })
  async getMyOrganizations(@Req() req: AuthenticatedRequest) {
    return this.userOrganizationService.getOrganizationsByUserId(req.user.id);
  }
}

