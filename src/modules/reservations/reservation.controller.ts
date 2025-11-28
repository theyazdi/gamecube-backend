import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  SearchAvailableGamenetDto,
  SearchAvailableGamenetQueryDto,
  CheckAvailabilityDto,
  SearchAvailableStationsDto,
} from './dto';
import { CreateSessionDto, CreateSessionResponseDto } from './dto/create-session.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';
import { AuthenticatedRequest } from '../../shared/interfaces/authenticated-request.interface';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) { }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({
    status: 201,
    description: 'Reservation created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'Station not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Time slot is already reserved',
  })
  create(@Body() dto: CreateReservationDto) {
    return this.reservationService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a reservation by ID' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation found',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reservations for a user' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of reservations',
  })
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.reservationService.findByUser(userId, page, limit);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'Get reservations for a gaming cafe' })
  @ApiParam({ name: 'organizationId', description: 'Gaming cafe ID' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of reservations',
  })
  findByOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.reservationService.findByOrganization(
      organizationId,
      page,
      limit,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a reservation' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  @ApiResponse({
    status: 409,
    description: 'New time slot is not available',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a reservation' })
  @ApiParam({ name: 'id', description: 'Reservation ID' })
  @ApiResponse({
    status: 200,
    description: 'Reservation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Reservation not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.remove(id);
  }

  @Post('check-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check availability of a time slot' })
  @ApiResponse({
    status: 200,
    description: 'Availability result',
    schema: {
      type: 'object',
      properties: {
        isAvailable: { type: 'boolean' },
      },
    },
  })
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    const isAvailable = await this.reservationService.checkAvailability(dto);
    return { isAvailable };
  }

  @Post('search-available')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Search available gaming cafes based on geographical coordinates and various filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available gaming cafes',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  searchAvailableGamenets(@Body() dto: SearchAvailableGamenetDto) {
    return this.reservationService.searchAvailableGamenets(dto);
  }

  @Get('available-slots/:stationId')
  @ApiOperation({ summary: 'Get available time slots for a station' })
  @ApiParam({ name: 'stationId', description: 'Station ID' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'Date (ISO 8601 format)',
    example: '2025-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'List of available time slots',
  })
  getAvailableTimeSlots(
    @Param('stationId', ParseIntPipe) stationId: number,
    @Query('date') date: string,
  ) {
    return this.reservationService.getAvailableTimeSlots(stationId, date);
  }

  @Post('search/open')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search open gaming cafes (frontend compatible)',
    description: `
This endpoint is designed for searching open gaming cafes.

**Required parameters:**
- latitude: User's latitude
- longitude: User's longitude
- radiusKm: Search radius (5, 10, 15, 20, 25, 30)

**Optional parameters:**
- date: Jalali date (format: YYYY/MM/DD e.g. 1403/09/15)
- startTime: Start time (format: HH:mm e.g. 14:30)
- endTime: End time (format: HH:mm e.g. 18:00)
- province: Province name
- city: City name
- consoleId: Console ID
- gameId: Game ID
- playerCount: Number of players (1-20)

**Important note:** Date and time are sent in Jalali format and 24-hour format.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'List of open gaming cafes with available stations and availableSlots',
    schema: {
      type: 'object',
      properties: {
        organizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uuid: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              phoneNumber: { type: 'string' },
              province: { type: 'string' },
              city: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              distance: { type: 'number', description: 'Distance in kilometers' },
              isOpen: { type: 'boolean', description: 'Whether it is open at the selected time' },
              indexImage: { type: 'string', nullable: true },
              logoImage: { type: 'string', nullable: true },
              stations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    title: { type: 'string' },
                    consoleId: { type: 'number' },
                    consoleName: { type: 'string' },
                    consoleCategory: { type: 'string' },
                    capacity: { type: 'number' },
                    status: { type: 'boolean' },
                    pricings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          playerCount: { type: 'number' },
                          price: { type: 'number' },
                        },
                      },
                    },
                    games: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          title: { type: 'string' },
                          coverImage: { type: 'string', nullable: true },
                        },
                      },
                    },
                    availableSlots: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          startTime: { type: 'string', example: '14:30' },
                          endTime: { type: 'string', example: '15:00' },
                          label: { type: 'string', example: '14:30 - 15:00' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            searchParams: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date or time format, or required parameters are missing',
  })
  searchOpenGamenets(@Body() body: SearchAvailableGamenetQueryDto) {
    return this.reservationService.searchOpenGamenets(body);
  }

  @Post('search/available-stations')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search available stations - Optimized endpoint for High-Traffic',
    description: `
This endpoint is designed for searching available stations of a specific gaming cafe based on console, game, and desired time.
This is one of the most frequently used endpoints in the system and uses optimized Raw SQL for minimal resource consumption.

**Required parameters:**
- username: Gaming cafe username (unique identifier)
- date: Jalali date (format: YYYY/MM/DD e.g. 1403/09/15)
- startTime: Start time (format: HH:mm e.g. 14:30)
- endTime: End time (format: HH:mm e.g. 18:00)
- consoleId: Console ID

**Optional parameters:**
- gameId: Game ID (only stations that have this game will be returned)
- playerCount: Number of players (1-20) (only stations with sufficient capacity will be returned)

**Optimization features:**
- Uses a single Raw SQL Query with CTEs (Common Table Expressions)
- JSON Aggregation to reduce number of queries
- Database-level filtering to reduce data transfer
- Performance logging for monitoring

**Output:**
List of available stations for the specified gaming cafe in the specified time range
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'List of available stations with complete information',
    schema: {
      type: 'object',
      properties: {
        stations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              consoleId: { type: 'number' },
              consoleName: { type: 'string' },
              consoleCategory: { type: 'string' },
              capacity: { type: 'number' },
              status: { type: 'boolean' },
              isAvailable: { type: 'boolean' },
              pricings: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    playerCount: { type: 'number' },
                    price: { type: 'number' },
                  },
                },
              },
              games: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    title: { type: 'string' },
                    coverImage: { type: 'string', nullable: true },
                  },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: {
              type: 'number',
              description: 'Total number of available stations',
            },
            searchParams: {
              type: 'object',
              description: 'Search parameters',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid date or time format, or required parameters are missing',
  })
  searchAvailableStations(@Body() dto: SearchAvailableStationsDto) {
    return this.reservationService.searchAvailableStations(dto);
  }

  @Post('preview-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Preview session details before creating (validation + pricing)',
    description: `Validates session request and returns pricing information WITHOUT creating session or invoice.

**Purpose:**
- Show user the total price before they confirm
- Validate that the time slot is available
- Check all business rules without side effects

**Process:**
1. Validates station availability and time slot
2. Calculates pricing (base price + 9% tax)
3. Returns preview data for user confirmation
4. Does NOT create session or invoice

**Next Step:**
After user confirms, call POST /create-session with same data`,
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 200,
    description: 'Session preview data (pricing and validation)',
    schema: {
      type: 'object',
      properties: {
        isAvailable: { type: 'boolean' },
        stationTitle: { type: 'string' },
        organizationName: { type: 'string' },
        date: { type: 'string' },
        startTime: { type: 'string' },
        endTime: { type: 'string' },
        duration: { type: 'number' },
        playersCount: { type: 'number' },
        priceBeforeTax: { type: 'number' },
        tax: { type: 'number' },
        totalPrice: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input: bad time format, time in past, duration too long, or player count exceeds capacity',
  })
  @ApiResponse({
    status: 404,
    description: 'Station not found or inactive',
  })
  @ApiResponse({
    status: 409,
    description: 'Time slot not available',
  })
  async previewSession(@Body() dto: CreateSessionDto) {
    return this.reservationService.previewSession(dto);
  }

  @Post('create-session')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.USER, UserRole.ORGANIZATION_MANAGER, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new gaming session with invoice',
    description: `Creates a new gaming session with pending status and generates an invoice.

**Concurrency Protection:**
- Uses database-level row locking (SELECT FOR UPDATE) to prevent race conditions
- Multiple users cannot book the same time slot simultaneously
- Transaction isolation level: SERIALIZABLE

**Process:**
1. Validates station availability and time slot
2. Creates invoice content with session details
3. Generates invoice with 10-minute due date
4. Creates session with 10-minute expiration
5. Returns session and invoice details for payment

**Expiration:**
- Session expires 10 minutes after creation
- Invoice due in 10 minutes (same as session)
- Expired sessions will be automatically revoked and invoice soft-deleted`,
  })
  @ApiBody({ type: CreateSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Session and invoice created successfully',
    type: CreateSessionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input: bad time format, time in past, duration too long, player count exceeds capacity, or no pricing available',
  })
  @ApiResponse({
    status: 404,
    description: 'Station not found or inactive',
  })
  @ApiResponse({
    status: 409,
    description: 'Time slot conflict: already reserved or being processed by another user',
  })
  async createSession(
    @Body() dto: CreateSessionDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<CreateSessionResponseDto> {
    return this.reservationService.createSession(dto, req.user.id);
  }
}

