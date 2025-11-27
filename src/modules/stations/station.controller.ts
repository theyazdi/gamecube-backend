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
  UsePipes,
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
import { StationService } from './station.service';
import { Station, Game } from '../../generated/client';
import {
  CreateStationDto,
  UpdateStationDto,
  StationResponseDto,
  SearchStationsDto,
  StationAvailabilityResponseDto
} from './dto/station.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole, OrganizationManagerGuard } from '../../shared';
import { AuthenticatedRequest } from '../../shared/interfaces/authenticated-request.interface';
import { CleanPricingsPipe } from './pipes/clean-pricings.pipe';

@ApiTags('stations')
@Controller('stations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StationController {
  constructor(private readonly stationService: StationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new station',
    description: 'Creates a new gaming station with console and games',
  })
  @ApiBody({ type: CreateStationDto })
  @ApiCreatedResponse({
    description: 'Station successfully created',
    type: StationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async createStation(@Body() createStationDto: CreateStationDto): Promise<Station> {
    return this.stationService.createStation(createStationDto);
  }

  @Post('manager')
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @UseGuards(OrganizationManagerGuard)
  @ApiOperation({
    summary: 'Create a new station by organization manager',
    description: 'Creates a new gaming station for an organization. The user must be a manager of the specified organization.',
  })
  @ApiBody({ type: CreateStationDto })
  @ApiCreatedResponse({
    description: 'Station successfully created',
    type: StationResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiBadRequestResponse({
    description: 'You do not have permission to add stations to this organization',
  })
  async createStationByManager(
    @Body() createStationDto: CreateStationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Station> {
    const user = req.user;
    return this.stationService.createStationByManager(createStationDto, user.id);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all stations',
    description: 'Retrieves a list of all stations, with optional filtering',
  })
  @ApiQuery({
    name: 'accepted',
    required: false,
    description: 'Filter by accepted and active stations',
    type: Boolean,
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Filter by organization ID',
    type: Number,
  })
  @ApiQuery({
    name: 'consoleId',
    required: false,
    description: 'Filter by console ID',
    type: Number,
  })
  @ApiOkResponse({
    description: 'List of stations retrieved successfully',
  })
  async findAllStations(
    @Query('accepted') accepted?: string,
    @Query('organizationId') organizationId?: string,
    @Query('consoleId') consoleId?: string,
  ): Promise<Station[]> {
    if (accepted === 'true') {
      return this.stationService.findAcceptedStations();
    }
    if (organizationId) {
      return this.stationService.findStationsByOrganization(parseInt(organizationId));
    }
    if (consoleId) {
      return this.stationService.findStationsByConsole(parseInt(consoleId));
    }
    return this.stationService.findAllStations();
  }

  @Get('search')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Search stations with filters',
    description: 'Search stations by playerCount, consoleId, gameId, organizationId. Optimized for performance with proper indexes.',
  })
  @ApiQuery({
    name: 'playerCount',
    required: false,
    description: 'Number of players',
    type: Number,
    example: 2,
  })
  @ApiQuery({
    name: 'consoleId',
    required: false,
    description: 'Console ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'gameId',
    required: false,
    description: 'Game ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Organization ID',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'accepted',
    required: false,
    description: 'Only accepted and active stations',
    type: Boolean,
    example: true,
  })
  @ApiOkResponse({
    description: 'Stations found successfully',
    type: [StationResponseDto],
  })
  async searchStations(
    @Query('playerCount') playerCount?: string,
    @Query('consoleId') consoleId?: string,
    @Query('gameId') gameId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('accepted') accepted?: string,
  ): Promise<Station[]> {
    const filters: SearchStationsDto = {};
    
    if (playerCount) {
      filters.playerCount = parseInt(playerCount, 10);
    }
    if (consoleId) {
      filters.consoleId = parseInt(consoleId, 10);
    }
    if (gameId) {
      filters.gameId = parseInt(gameId, 10);
    }
    if (organizationId) {
      filters.organizationId = parseInt(organizationId, 10);
    }
    if (accepted !== undefined) {
      filters.accepted = accepted === 'true';
    }

    return this.stationService.searchStations(filters);
  }

  @Get(':id/games')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get games available on a station',
    description: 'Retrieves the list of games available on a specific gaming station (device)',
  })
  @ApiParam({
    name: 'id',
    description: 'Station ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Games retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          coverImage: { type: 'string', nullable: true },
          category: { type: 'array', items: { type: 'string' } },
          releaseYear: { type: 'number' },
          displayPriority: { type: 'number' },
          isAccepted: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Station not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'Station with ID 1 not found',
        error: 'Not Found',
      },
    },
  })
  async getStationGames(
    @Param('id', ParseIntPipe) stationId: number,
  ): Promise<Game[]> {
    return this.stationService.getStationGames(stationId);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get station by ID',
    description: 'Retrieves a specific station by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Station ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Station found successfully',
  })
  @ApiNotFoundResponse({
    description: 'Station not found',
  })
  async findStationById(@Param('id', ParseIntPipe) id: number): Promise<Station | null> {
    return this.stationService.findStationById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @UsePipes(CleanPricingsPipe)
  @ApiOperation({
    summary: 'Update station by ID',
    description: 'Updates station information by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Station ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: UpdateStationDto })
  @ApiOkResponse({
    description: 'Station updated successfully',
  })
  @ApiNotFoundResponse({
    description: 'Station not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async updateStation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStationDto: UpdateStationDto,
  ): Promise<Station> {
    return this.stationService.updateStation(id, updateStationDto);
  }

  @Put('manager/:id')
  @Roles(UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @UsePipes(CleanPricingsPipe)
  @ApiOperation({
    summary: 'Update station by organization manager',
    description: 'Updates station information. The user must be a manager of the organization that owns this station.',
  })
  @ApiParam({
    name: 'id',
    description: 'Station ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: UpdateStationDto })
  @ApiOkResponse({
    description: 'Station updated successfully',
    type: StationResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Station not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  @ApiBadRequestResponse({
    description: 'You do not have permission to update this station',
  })
  async updateStationByManager(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStationDto: UpdateStationDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Station> {
    const user = req.user;
    return this.stationService.updateStationByManager(id, updateStationDto, user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete station by ID',
    description: 'Soft deletes a station by their ID (sets deletedAt timestamp)',
  })
  @ApiParam({
    name: 'id',
    description: 'Station ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Station deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Station not found',
  })
  async deleteStation(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.stationService.deleteStation(id);
  }

  @Post('availability')
  @Roles(UserRole.USER, UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get station availability for a specific date',
    description: 'Returns all time slots (30-minute intervals) within organization working hours for the specified date. Shows which slots are reserved, which are available, and which are in the past.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        stationId: {
          type: 'number',
          example: 1,
          description: 'Station ID',
        },
        date: {
          type: 'string',
          example: '1404/08/18',
          description: 'Jalali date in format YYYY/MM/DD',
        },
      },
      required: ['stationId', 'date'],
    },
  })
  @ApiOkResponse({
    description: 'Station availability retrieved successfully',
    type: StationAvailabilityResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Station not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid date format',
  })
  async getStationAvailability(
    @Body('stationId', ParseIntPipe) stationId: number,
    @Body('date') date: string,
  ): Promise<StationAvailabilityResponseDto> {
    return this.stationService.getStationAvailability(stationId, date);
  }
}
