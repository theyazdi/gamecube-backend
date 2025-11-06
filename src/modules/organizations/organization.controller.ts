import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrganizationService } from './organization.service';
import { Organization } from '../../generated/client';
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationResponseDto } from './dto/organization.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole, OrganizationManagerGuard } from '../../shared';
import { AuthenticatedRequest } from '../../shared/interfaces/authenticated-request.interface';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new organization',
    description: 'Creates a new gaming cafe/organization',
  })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiCreatedResponse({
    description: 'Organization successfully created',
    type: OrganizationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async createOrganization(@Body() createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    return this.organizationService.createOrganization(createOrganizationDto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @ApiOperation({
    summary: 'Get all organizations',
    description: 'Retrieves a list of all organizations. Organization managers only see their assigned organizations.',
  })
  @ApiQuery({
    name: 'province',
    required: false,
    description: 'Filter by province',
    example: 'Tehran',
  })
  @ApiQuery({
    name: 'city',
    required: false,
    description: 'Filter by city',
    example: 'Tehran',
  })
  @ApiOkResponse({
    description: 'List of organizations retrieved successfully',
    type: [OrganizationResponseDto],
  })
  async findAllOrganizations(
    @Query('province') province?: string,
    @Query('city') city?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<Organization[]> {
    const user = req?.user;
    const userRoles = user?.roles || [];
    const userId = user?.id;

    if (province && city) {
      // For province/city filtering, we still need to respect organization manager access
      const orgs = await this.organizationService.findOrganizationsByProvinceAndCity(province, city);
      if (userRoles.includes(UserRole.ORGANIZATION_MANAGER) && !userRoles.includes(UserRole.SUPER_ADMIN) && userId) {
        const userOrgIds = await this.organizationService.getUserOrganizationIds(userId);
        return orgs.filter(org => userOrgIds.includes(org.id));
      }
      return orgs;
    }
    if (province) {
      const orgs = await this.organizationService.findOrganizationsByProvince(province);
      if (userRoles.includes(UserRole.ORGANIZATION_MANAGER) && !userRoles.includes(UserRole.SUPER_ADMIN) && userId) {
        const userOrgIds = await this.organizationService.getUserOrganizationIds(userId);
        return orgs.filter(org => userOrgIds.includes(org.id));
      }
      return orgs;
    }
    if (city) {
      const orgs = await this.organizationService.findOrganizationsByCity(city);
      if (userRoles.includes(UserRole.ORGANIZATION_MANAGER) && !userRoles.includes(UserRole.SUPER_ADMIN) && userId) {
        const userOrgIds = await this.organizationService.getUserOrganizationIds(userId);
        return orgs.filter(org => userOrgIds.includes(org.id));
      }
      return orgs;
    }
    return this.organizationService.findAllOrganizations(userId, userRoles);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get organization by ID',
    description: 'Retrieves a specific organization by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Organization found successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async findOrganizationById(@Param('id', ParseIntPipe) id: number): Promise<Organization | null> {
    return this.organizationService.findOrganizationById(id);
  }

  @Get('uuid/:uuid')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get organization by UUID',
    description: 'Retrieves a specific organization by their UUID',
  })
  @ApiParam({
    name: 'uuid',
    description: 'Organization UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Organization found successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async findOrganizationByUuid(@Param('uuid') uuid: string): Promise<Organization | null> {
    return this.organizationService.findOrganizationByUuid(uuid);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @UseGuards(OrganizationManagerGuard)
  @ApiOperation({
    summary: 'Update organization by ID',
    description: 'Updates organization information. Organization managers can only update their assigned organizations.',
  })
  @ApiParam({
    name: 'id',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiOkResponse({
    description: 'Organization updated successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async updateOrganization(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Organization> {
    const user = req.user;
    return this.organizationService.updateOrganization(
      id,
      updateOrganizationDto,
      user.id,
      user.roles,
    );
  }

  @Put('uuid/:uuid')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update organization by UUID',
    description: 'Updates organization information by their UUID',
  })
  @ApiParam({
    name: 'uuid',
    description: 'Organization UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiOkResponse({
    description: 'Organization updated successfully',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async updateOrganizationByUuid(
    @Param('uuid') uuid: string,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return this.organizationService.updateOrganizationByUuid(uuid, updateOrganizationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete organization by ID',
    description: 'Permanently deletes an organization by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Organization deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async deleteOrganization(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.organizationService.deleteOrganization(id);
  }

  @Delete('uuid/:uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete organization by UUID',
    description: 'Permanently deletes an organization by their UUID',
  })
  @ApiParam({
    name: 'uuid',
    description: 'Organization UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Organization deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async deleteOrganizationByUuid(@Param('uuid') uuid: string): Promise<void> {
    await this.organizationService.deleteOrganizationByUuid(uuid);
  }
}
