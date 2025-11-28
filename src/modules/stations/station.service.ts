import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Station } from '../../generated/client';
import {
  CreateStationDto,
  UpdateStationDto,
  SearchStationsDto,
  StationAvailabilityResponseDto,
  TimeSlotResponseDto
} from './dto/station.dto';
import { jalaliToGregorian } from '../../shared/utils/date-converter.util';
import { parseTimeString, isPastTime } from '../../shared/utils/time-slot.util';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate pricing array against capacity
   */
  private validatePricings(pricings: { playerCount: number; price: number }[], capacity: number): void {
    if (!pricings || pricings.length === 0) {
      throw new BadRequestException('At least one pricing is required');
    }

    if (pricings.length > capacity) {
      throw new BadRequestException(`Number of pricings (${pricings.length}) cannot exceed capacity (${capacity})`);
    }

    // Check for duplicate playerCount
    const playerCounts = pricings.map(p => p.playerCount);
    const uniquePlayerCounts = new Set(playerCounts);
    if (playerCounts.length !== uniquePlayerCounts.size) {
      throw new BadRequestException('Duplicate playerCount found in pricings');
    }

    // Check that all playerCount values are within valid range (1 to capacity)
    for (const pricing of pricings) {
      if (pricing.playerCount < 1 || pricing.playerCount > capacity) {
        throw new BadRequestException(
          `PlayerCount ${pricing.playerCount} must be between 1 and capacity (${capacity})`
        );
      }
      if (pricing.price < 0) {
        throw new BadRequestException('Price cannot be negative');
      }
    }
  }

  async createStation(data: CreateStationDto): Promise<Station> {
    const { gameIds, pricings, ...stationData } = data;

    // Validate pricings
    this.validatePricings(pricings, stationData.capacity);

    // Create station with pricings and games
    const station = await this.prisma.station.create({
      data: {
        ...stationData,
        pricings: {
          create: pricings.map(p => ({
            playerCount: p.playerCount,
            price: p.price,
          })),
        },
        stationGames: gameIds && gameIds.length > 0 ? {
          create: gameIds.map(gameId => ({ gameId })),
        } : undefined,
      },
    });

    const result = await this.findStationById(station.id);
    if (!result) {
      throw new NotFoundException(`Failed to create station`);
    }
    return result;
  }

  /**
   * Create station by organization manager
   * Checks if user manages the organization before creating the station
   */
  async createStationByManager(data: CreateStationDto, userId: number): Promise<Station> {
    const { organizationId, gameIds, pricings, ...stationData } = data;

    // Check if user manages this organization
    const userOrganization = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!userOrganization) {
      throw new ForbiddenException('You do not have permission to add stations to this organization.');
    }

    // Validate pricings
    this.validatePricings(pricings, stationData.capacity);

    // Create station with pricings and games
    const station = await this.prisma.station.create({
      data: {
        ...stationData,
        organizationId,
        pricings: {
          create: pricings.map(p => ({
            playerCount: p.playerCount,
            price: p.price,
          })),
        },
        stationGames: gameIds && gameIds.length > 0 ? {
          create: gameIds.map(gameId => ({ gameId })),
        } : undefined,
      },
    });

    const result = await this.findStationById(station.id);
    if (!result) {
      throw new NotFoundException(`Failed to create station`);
    }
    return result;
  }

  async findAllStations(): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        organization: true,
        console: true,
        pricings: {
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAcceptedStations(): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: { 
        isAccepted: true, 
        isActive: true,
        deletedAt: null,
      },
      include: {
        organization: true,
        console: true,
        pricings: {
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findStationById(id: number): Promise<Station | null> {
    return this.prisma.station.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
      include: {
        organization: true,
        console: true,
        pricings: {
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: true,
          },
        },
      },
    });
  }

  async findStationsByOrganization(organizationId: number): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: { 
        organizationId,
        deletedAt: null,
      },
      include: {
        organization: true,
        console: true,
        pricings: {
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findStationsByConsole(consoleId: number): Promise<Station[]> {
    return this.prisma.station.findMany({
      where: { 
        consoleId,
        deletedAt: null,
      },
      include: {
        organization: true,
        console: true,
        pricings: {
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Search stations with filters (optimized for performance)
   * Supports filtering by playerCount, consoleId, gameId, organizationId
   */
  async searchStations(filters: SearchStationsDto): Promise<Station[]> {
    const { playerCount, consoleId, gameId, organizationId, accepted } = filters;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    if (accepted !== false) {
      where.isAccepted = true;
      where.isActive = true;
    }

    if (consoleId) {
      where.consoleId = consoleId;
    }

    if (organizationId) {
      where.organizationId = organizationId;
    }

    // If gameId is provided, filter by stationGames
    if (gameId) {
      where.stationGames = {
        some: {
          gameId: gameId,
        },
      };
    }

    // If playerCount is provided, filter by pricings
    if (playerCount) {
      where.pricings = {
        some: {
          playerCount: playerCount,
        },
      };
    }

    // Filter out stations with deleted consoles
    where.console = {
      deletedAt: null,
    };

    return this.prisma.station.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            uuid: true,
            name: true,
            province: true,
            city: true,
            address: true,
            latitude: true,
            longitude: true,
            indexImage: true,
            logoImage: true,
            tfHour: true,
            isCube: true,
          },
        },
        console: true,
        pricings: {
          // Always return all pricings, but if playerCount is provided,
          // the station will only be included if it has pricing for that playerCount
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateStation(id: number, data: UpdateStationDto): Promise<Station> {
    // Check if station exists and is not deleted
    const station = await this.prisma.station.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    const { gameIds, pricings, capacity, ...stationData } = data;

    // Filter pricings to only include playerCount and price (remove id, stationId, createdAt, updatedAt)
    const cleanPricings = pricings?.map(p => ({
      playerCount: p.playerCount,
      price: p.price,
    }));

    // If pricings are provided, validate them
    const finalCapacity = capacity || station.capacity;
    if (cleanPricings) {
      this.validatePricings(cleanPricings, finalCapacity);
    }

    // Update station
    await this.prisma.station.update({
      where: { id },
      data: {
        ...stationData,
        // Update pricings if provided
        ...(cleanPricings && {
          pricings: {
            deleteMany: {}, // Delete all existing pricings
            create: cleanPricings,
          },
        }),
        // Update games if provided
        ...(gameIds !== undefined && {
          stationGames: {
            deleteMany: {},
            create: gameIds.map(gameId => ({ gameId })),
          },
        }),
      },
    });

    const result = await this.findStationById(id);
    if (!result) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return result;
  }

  /**
   * Update station by organization manager
   * Checks if user manages the organization before updating the station
   */
  async updateStationByManager(id: number, data: UpdateStationDto, userId: number): Promise<Station> {
    // Check if station exists and is not deleted
    const station = await this.prisma.station.findFirst({
      where: { 
        id,
        deletedAt: null,
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    // Check if user manages this organization
    const userOrganization = await this.prisma.userOrganization.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId: station.organizationId,
        },
      },
    });

    if (!userOrganization) {
      throw new ForbiddenException('You do not have permission to update this station.');
    }

    const { gameIds, pricings, capacity, organizationId, ...stationData } = data;

    // Prevent changing organizationId
    if (organizationId && organizationId !== station.organizationId) {
      throw new ForbiddenException('You cannot change the organization of a station.');
    }

    // Filter pricings to only include playerCount and price (remove id, stationId, createdAt, updatedAt)
    const cleanPricings = pricings?.map(p => ({
      playerCount: p.playerCount,
      price: p.price,
    }));

    // If pricings are provided, validate them
    const finalCapacity = capacity || station.capacity;
    if (cleanPricings) {
      this.validatePricings(cleanPricings, finalCapacity);
    }

    // Update station
    await this.prisma.station.update({
      where: { id },
      data: {
        ...stationData,
        // Update pricings if provided
        ...(cleanPricings && {
          pricings: {
            deleteMany: {}, // Delete all existing pricings
            create: cleanPricings,
          },
        }),
        // Update games if provided
        ...(gameIds !== undefined && {
          stationGames: {
            deleteMany: {},
            create: gameIds.map(gameId => ({ gameId })),
          },
        }),
      },
    });

    const result = await this.findStationById(id);
    if (!result) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }
    return result;
  }

  async deleteStation(id: number): Promise<Station> {
    // Check if station exists and is not already deleted
    const station = await this.prisma.station.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    // Soft delete: set deletedAt timestamp
    return this.prisma.station.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get station availability with time slots for a specific date
   * Returns all time slots within organization working hours, marking reserved and past slots
   */
  async getStationAvailability(stationId: number, jalaliDate: string): Promise<StationAvailabilityResponseDto> {
    // 1. Find station with full details
    const station = await this.prisma.station.findFirst({
      where: {
        id: stationId,
        deletedAt: null,
      },
      include: {
        console: {
          select: {
            id: true,
            name: true,
            manufacturer: true,
            category: true,
          },
        },
        pricings: {
          select: {
            playerCount: true,
            price: true,
          },
          orderBy: {
            playerCount: 'asc',
          },
        },
        stationGames: {
          include: {
            game: {
              select: {
                id: true,
                title: true,
                coverImage: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            workingHours: true,
          },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${stationId} not found`);
    }

    // 2. Convert Jalali date to Gregorian
    let gregorianDate: Date;
    try {
      gregorianDate = jalaliToGregorian(jalaliDate);
    } catch (error) {
      throw new BadRequestException(`Invalid Jalali date format: ${jalaliDate}. Use YYYY/MM/DD format.`);
    }

    // 3. Get day of week (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
    const dayOfWeek = this.getIranianDayOfWeek(gregorianDate);

    // 4. Get working hours for this day
    const workingHours = station.organization.workingHours.find((wh) => wh.dayOfWeek === dayOfWeek);

    if (!workingHours) {
      throw new NotFoundException(
        `Working hours not found for this day of week (${dayOfWeek})`,
      );
    }

    if (workingHours.isClosed) {
      // Organization is closed on this day
      return {
        station: {
          id: station.id,
          title: station.title,
          consoleId: station.consoleId,
          capacity: station.capacity,
          status: station.status,
          isActive: station.isActive,
          isAccepted: station.isAccepted,
          console: station.console,
          pricings: station.pricings,
          stationGames: station.stationGames,
        },
        workingHours: {
          dayOfWeek: workingHours.dayOfWeek,
          isClosed: workingHours.isClosed,
          is24Hours: workingHours.is24Hours,
          startTime: workingHours.startTime,
          endTime: workingHours.endTime,
        },
        timeSlots: [], // No time slots available if closed
      };
    }

    // 5. Generate time slots based on working hours
    let startTime: Date;
    let endTime: Date;

    if (workingHours.is24Hours) {
      // 24 hours operation
      startTime = new Date(gregorianDate);
      startTime.setHours(0, 0, 0, 0);
      endTime = new Date(gregorianDate);
      endTime.setHours(23, 59, 59, 999);
    } else {
      // Parse start and end times
      if (!workingHours.startTime || !workingHours.endTime) {
        throw new BadRequestException(
          'Working hours start and end times must be defined for non-24-hour operation',
        );
      }

      try {
        startTime = parseTimeString(gregorianDate, workingHours.startTime);
        endTime = parseTimeString(gregorianDate, workingHours.endTime);
      } catch (error) {
        throw new BadRequestException(
          `Invalid working hours time format: ${error.message}`,
        );
      }
    }

    // 6. Generate 30-minute time slots
    const timeSlots: TimeSlotResponseDto[] = [];
    const currentSlotTime = new Date(startTime);

    while (currentSlotTime < endTime) {
      const slotStart = new Date(currentSlotTime);
      const slotEnd = new Date(currentSlotTime);
      slotEnd.setMinutes(slotEnd.getMinutes() + 30);

      // Don't add slots that go beyond end time
      if (slotEnd > endTime) {
        break;
      }

      // Format label
      const label = `${this.formatTime(slotStart)} - ${this.formatTime(slotEnd)}`;

      timeSlots.push({
        startTime: slotStart,
        endTime: slotEnd,
        label,
        isReserved: false,
        isAvailable: true,
      });

      currentSlotTime.setMinutes(currentSlotTime.getMinutes() + 30);
    }

    // 7. Get all reservations AND sessions for this station on this date
    const reservedDate = new Date(gregorianDate);
    reservedDate.setHours(0, 0, 0, 0);

    // Get reservations from old Reservation table
    const reservations = await this.prisma.reservation.findMany({
      where: {
        stationId: stationId,
        reservedDate: reservedDate,
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Get sessions from new Session table (pending, reserved, inprogress)
    // Using optimized index: [stationId, date, startTimeMinutes, endTimeMinutes]
    const sessions = await this.prisma.session.findMany({
      where: {
        stationId: stationId,
        date: reservedDate,
        status: {
          in: ['pending', 'reserved', 'inprogress'], // Active sessions that block time slots
        },
      },
      select: {
        startTimeMinutes: true,
        endTimeMinutes: true,
        status: true,
      },
    });

    // 8. Mark reserved slots and check if past
    const now = new Date();

    for (const slot of timeSlots) {
      // Check if slot is in the past
      if (isPastTime(slot.endTime)) {
        slot.isAvailable = false;
      }

      // Calculate slot time in minutes for efficient comparison
      const slotStartMinutes = slot.startTime.getHours() * 60 + slot.startTime.getMinutes();
      const slotEndMinutes = slot.endTime.getHours() * 60 + slot.endTime.getMinutes();

      // Check if slot overlaps with any old reservation
      const hasReservation = reservations.some((r) => {
        return (
          (slot.startTime >= r.startTime && slot.startTime < r.endTime) ||
          (slot.endTime > r.startTime && slot.endTime <= r.endTime) ||
          (slot.startTime <= r.startTime && slot.endTime >= r.endTime)
        );
      });

      // Check if slot overlaps with any active session (optimized integer comparison)
      const hasSession = sessions.some((s) => {
        if (!s.endTimeMinutes) return false;
        return (
          (slotStartMinutes >= s.startTimeMinutes && slotStartMinutes < s.endTimeMinutes) ||
          (slotEndMinutes > s.startTimeMinutes && slotEndMinutes <= s.endTimeMinutes) ||
          (slotStartMinutes <= s.startTimeMinutes && slotEndMinutes >= s.endTimeMinutes)
        );
      });

      if (hasReservation || hasSession) {
        slot.isReserved = true;
        slot.isAvailable = false;
      }
    }

    // 9. Return response
    return {
      station: {
        id: station.id,
        title: station.title,
        consoleId: station.consoleId,
        capacity: station.capacity,
        status: station.status,
        isActive: station.isActive,
        isAccepted: station.isAccepted,
        console: station.console,
        pricings: station.pricings,
        stationGames: station.stationGames,
      },
      workingHours: {
        dayOfWeek: workingHours.dayOfWeek,
        isClosed: workingHours.isClosed,
        is24Hours: workingHours.is24Hours,
        startTime: workingHours.startTime,
        endTime: workingHours.endTime,
      },
      timeSlots,
    };
  }

  /**
   * Get Iranian day of week (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
   * JavaScript: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
   */
  private getIranianDayOfWeek(date: Date): number {
    const jsDay = date.getDay(); // 0 = Sunday
    // Convert to Iranian week: Saturday = 0, Sunday = 1, ..., Friday = 6
    return (jsDay + 1) % 7;
  }

  /**
   * Format time as HH:MM
   */
  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Get games for a specific station
   * Returns list of games available on the station
   */
  async getStationGames(stationId: number) {
    // Check if station exists and is not deleted
    const station = await this.prisma.station.findFirst({
      where: {
        id: stationId,
        deletedAt: null,
      },
      include: {
        stationGames: {
          include: {
            game: true,
          },
        },
      },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${stationId} not found`);
    }

    // Return only accepted games
    return station.stationGames
      .map(sg => sg.game)
      .filter(game => game.isAccepted)
      .sort((a, b) => {
        // Sort by displayPriority first, then by createdAt
        if (a.displayPriority !== b.displayPriority) {
          return a.displayPriority - b.displayPriority;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
}
