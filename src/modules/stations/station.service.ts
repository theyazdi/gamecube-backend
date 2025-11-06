import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Station } from '../../generated/client';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';

@Injectable()
export class StationService {
  constructor(private prisma: PrismaService) {}

  async createStation(data: CreateStationDto): Promise<Station> {
    const { gameIds, ...stationData } = data;
    
    // Create station with games if provided
    const station = await this.prisma.station.create({
      data: {
        ...stationData,
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
      include: {
        organization: true,
        console: true,
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
      where: { isAccepted: true, isActive: true },
      include: {
        organization: true,
        console: true,
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
    return this.prisma.station.findUnique({
      where: { id },
      include: {
        organization: true,
        console: true,
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
      where: { organizationId },
      include: {
        organization: true,
        console: true,
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
      where: { consoleId },
      include: {
        organization: true,
        console: true,
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

  async updateStation(id: number, data: UpdateStationDto): Promise<Station> {
    // Check if station exists
    const station = await this.prisma.station.findUnique({
      where: { id },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    const { gameIds, ...stationData } = data;

    // Update station and handle games
    await this.prisma.station.update({
      where: { id },
      data: {
        ...stationData,
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
    // Check if station exists
    const station = await this.prisma.station.findUnique({
      where: { id },
    });

    if (!station) {
      throw new NotFoundException(`Station with ID ${id} not found`);
    }

    return this.prisma.station.delete({
      where: { id },
    });
  }
}
