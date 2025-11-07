import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Station } from '../../generated/client';
import { CreateStationDto, UpdateStationDto, SearchStationsDto } from './dto/station.dto';

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
}
