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
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
import { CreateOrganizationDto, UpdateOrganizationDto, OrganizationResponseDto, ManagerOrganizationsResponseDto, GetOrganizationDetailsDto, OrganizationDetailsResponseDto } from './dto/organization.dto';
import { CreateWorkingHoursDto, UpdateWorkingHoursDto, WorkingHoursResponseDto } from './dto/working-hours.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole, OrganizationManagerGuard } from '../../shared';
import { AuthenticatedRequest } from '../../shared/interfaces/authenticated-request.interface';
import { PrismaService } from '../../shared/database';

@ApiTags('organizations')
@Controller('organizations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class OrganizationController {
  constructor(
    private readonly organizationService: OrganizationService,
    private readonly prisma: PrismaService,
  ) {}

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

  @Get('username/:username')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @ApiOperation({
    summary: 'Get organization by username with all stations',
    description: 'Retrieves complete organization information including all stations with console, pricings, and games by username',
  })
  @ApiParam({
    name: 'username',
    description: 'Organization username',
    type: 'string',
    example: 'gamingcafe_tehran',
  })
  @ApiOkResponse({
    description: 'Organization found successfully with all stations',
    type: OrganizationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async getOrganizationByUsernameWithStations(
    @Param('username') username: string,
  ): Promise<Organization | null> {
    const organization = await this.organizationService.getOrganizationByUsernameWithStations(username);
    if (!organization) {
      throw new NotFoundException(`Organization with username ${username} not found`);
    }
    return organization;
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

  @Get('manager/my-organizations')
  @Roles(UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get manager organizations and stations',
    description: 'Retrieves list of organizations managed by the user (id and name) and all stations from those organizations',
  })
  @ApiOkResponse({
    description: 'Manager organizations and stations retrieved successfully',
    type: ManagerOrganizationsResponseDto,
  })
  async getManagerOrganizationsAndStations(
    @Req() req: AuthenticatedRequest,
  ): Promise<ManagerOrganizationsResponseDto> {
    const user = req.user;
    return this.organizationService.getManagerOrganizationsAndStations(user.id);
  }

  @Post(':id/working-hours')
  @Roles(UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @UseGuards(OrganizationManagerGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Set working hours for organization',
    description: 'Creates or updates working hours for an organization. Requires exactly 7 entries (one for each day of week).',
  })
  @ApiParam({
    name: 'id',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: CreateWorkingHoursDto })
  @ApiCreatedResponse({
    description: 'Working hours set successfully',
    type: [WorkingHoursResponseDto],
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async setWorkingHours(
    @Param('id', ParseIntPipe) id: number,
    @Body() createWorkingHoursDto: CreateWorkingHoursDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any[]> {
    const user = req.user;
    // Check if user manages this organization (for organization managers)
    if (user.roles.includes(UserRole.ORGANIZATION_MANAGER) && !user.roles.includes(UserRole.SUPER_ADMIN)) {
      const userOrg = await this.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: id,
          },
        },
      });
      if (!userOrg) {
        throw new ForbiddenException('You do not have permission to set working hours for this organization.');
      }
    }
    return this.organizationService.setWorkingHours(id, createWorkingHoursDto);
  }

  @Get(':id/working-hours')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @ApiOperation({
    summary: 'Get working hours for organization',
    description: 'Retrieves working hours for an organization',
  })
  @ApiParam({
    name: 'id',
    description: 'Organization ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Working hours retrieved successfully',
    type: [WorkingHoursResponseDto],
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  async getWorkingHours(@Param('id', ParseIntPipe) id: number): Promise<any[]> {
    return this.organizationService.getWorkingHours(id);
  }

  @Get('search/open')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find open organizations',
    description: 'Finds organizations that are open at a specific date and time. Optimized for high performance.',
  })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date and time to check (ISO 8601 format)',
    example: '2025-11-07T15:30:00Z',
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
  @ApiQuery({
    name: 'latitude',
    required: false,
    description: 'Latitude for location-based search',
    type: Number,
    example: 35.6892,
  })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'Longitude for location-based search',
    type: Number,
    example: 51.3890,
  })
  @ApiQuery({
    name: 'radiusKm',
    required: false,
    description: 'Radius in kilometers for location-based search',
    type: Number,
    example: 5,
  })
  @ApiOkResponse({
    description: 'Open organizations found successfully',
    type: [OrganizationResponseDto],
  })
  async findOpenOrganizations(
    @Query('date') dateString: string,
    @Query('province') province?: string,
    @Query('city') city?: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radiusKm') radiusKm?: string,
  ): Promise<Organization[]> {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Invalid date format. Use ISO 8601 format (e.g., 2025-11-07T15:30:00Z)');
    }

    const filters: any = {};
    if (province) filters.province = province;
    if (city) filters.city = city;
    if (latitude) filters.latitude = parseFloat(latitude);
    if (longitude) filters.longitude = parseFloat(longitude);
    if (radiusKm) filters.radiusKm = parseFloat(radiusKm);

    return this.organizationService.findOpenOrganizations(date, filters);
  }

  @Post('details')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN, UserRole.ORGANIZATION_MANAGER)
  @ApiOperation({
    summary: 'Get organization details by username',
    description: 'Retrieves complete organization information including unique consoles and all stations. Optionally calculates distance if user coordinates are provided.',
  })
  @ApiBody({ type: GetOrganizationDetailsDto })
  @ApiOkResponse({
    description: 'Organization details retrieved successfully',
    type: OrganizationDetailsResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Organization not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async getOrganizationDetails(
    @Body() dto: GetOrganizationDetailsDto,
  ): Promise<OrganizationDetailsResponseDto> {
    return this.organizationService.getOrganizationDetailsByUsername(
      dto.username,
      dto.latitude,
      dto.longitude,
    );
  }
}
