import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Game } from '../../generated/client';
import { CreateGameDto, UpdateGameDto } from './dto/game.dto';
import axios from 'axios';

@Injectable()
export class GameService {
  constructor(private prisma: PrismaService) {}

  async createGame(data: CreateGameDto): Promise<Game> {
    const { consoleIds, ...gameData } = data;
    
    return this.prisma.game.create({
      data: {
        ...gameData,
        consoles: consoleIds
          ? {
              connect: consoleIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        consoles: true,
      },
    });
  }

  async findAllGames(): Promise<Game[]> {
    return this.prisma.game.findMany({
      include: {
        consoles: true,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findAcceptedGames(): Promise<Game[]> {
    return this.prisma.game.findMany({
      where: { isAccepted: true },
      include: {
        consoles: true,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findGameById(id: number): Promise<Game | null> {
    return this.prisma.game.findUnique({
      where: { id },
      include: {
        consoles: true,
      },
    });
  }

  async findGamesByPlatform(consoleId: number): Promise<Game[]> {
    return this.prisma.game.findMany({
      where: {
        consoles: {
          some: {
            id: consoleId,
          },
        },
      },
      include: {
        consoles: true,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findGamesByCategory(category: string): Promise<Game[]> {
    return this.prisma.game.findMany({
      where: {
        category: {
          has: category,
        },
      },
      include: {
        consoles: true,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async updateGame(id: number, data: UpdateGameDto): Promise<Game> {
    // Check if game exists
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    const { consoleIds, ...gameData } = data;

    return this.prisma.game.update({
      where: { id },
      data: {
        ...gameData,
        consoles: consoleIds
          ? {
              set: consoleIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: {
        consoles: true,
      },
    });
  }

  async deleteGame(id: number): Promise<Game> {
    // Check if game exists
    const game = await this.prisma.game.findUnique({
      where: { id },
    });

    if (!game) {
      throw new NotFoundException(`Game with ID ${id} not found`);
    }

    return this.prisma.game.delete({
      where: { id },
    });
  }

  /**
   * Search for games using RAWG.io API
   * @param gameName - Name of the game to search for
   * @returns Game data from RAWG.io API
   */
  async searchGameFromRawg(gameName: string): Promise<any> {
    if (!gameName || gameName.trim().length === 0) {
      throw new HttpException('Game name is required', HttpStatus.BAD_REQUEST);
    }

    try {
      const apiKey = 'e09b62ec88394696ac98bf49cc97f15c';
      const apiUrl = 'https://api.rawg.io/api/games';
      
      const response = await axios.get(apiUrl, {
        params: {
          key: apiKey,
          search: gameName.trim(),
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error?.response?.data || 'Failed to fetch game data from RAWG.io',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
