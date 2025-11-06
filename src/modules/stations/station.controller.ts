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
import { Station } from '../../generated/client';
import { CreateStationDto, UpdateStationDto, StationResponseDto } from './dto/station.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete station by ID',
    description: 'Permanently deletes a station by their ID',
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
}
