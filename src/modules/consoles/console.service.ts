import { Injectable, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Console } from '../../generated/client';
import { CreateConsoleDto, UpdateConsoleDto } from './dto/console.dto';
import axios from 'axios';

@Injectable()
export class ConsoleService {
  constructor(private prisma: PrismaService) {}

  async createConsole(data: CreateConsoleDto): Promise<Console> {
    return this.prisma.console.create({
      data,
    });
  }

  async findAllConsoles(): Promise<Console[]> {
    return this.prisma.console.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findConsoleById(id: number): Promise<Console | null> {
    return this.prisma.console.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findConsoleByName(name: string): Promise<Console | null> {
    return this.prisma.console.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });
  }

  async findConsolesByCategory(category: string): Promise<Console[]> {
    return this.prisma.console.findMany({
      where: {
        category,
        deletedAt: null,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findConsolesByManufacturer(manufacturer: string): Promise<Console[]> {
    return this.prisma.console.findMany({
      where: {
        manufacturer,
        deletedAt: null,
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async updateConsole(id: number, data: UpdateConsoleDto): Promise<Console> {
    // Check if console exists and is not deleted
    const console = await this.prisma.console.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!console) {
      throw new NotFoundException(`Console with ID ${id} not found`);
    }

    return this.prisma.console.update({
      where: { id },
      data,
    });
  }

  async updateConsoleByName(name: string, data: UpdateConsoleDto): Promise<Console> {
    // Check if console exists and is not deleted
    const console = await this.prisma.console.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });

    if (!console) {
      throw new NotFoundException(`Console with name ${name} not found`);
    }

    return this.prisma.console.update({
      where: { name },
      data,
    });
  }

  async deleteConsole(id: number): Promise<Console> {
    // Check if console exists and is not already deleted
    const console = await this.prisma.console.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!console) {
      throw new NotFoundException(`Console with ID ${id} not found`);
    }

    // Soft delete: set deletedAt timestamp
    return this.prisma.console.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async deleteConsoleByName(name: string): Promise<Console> {
    // Check if console exists and is not already deleted
    const console = await this.prisma.console.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });

    if (!console) {
      throw new NotFoundException(`Console with name ${name} not found`);
    }

    // Soft delete: set deletedAt timestamp
    return this.prisma.console.update({
      where: { name },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get platform data from RAWG.io API by platform ID
   * @param platformId - RAWG.io platform ID
   * @returns Platform data from RAWG.io API
   */
  async getPlatformFromRawg(platformId: number): Promise<any> {
    if (!platformId || platformId <= 0) {
      throw new HttpException('Platform ID is required and must be a positive number', HttpStatus.BAD_REQUEST);
    }

    try {
      const apiKey = 'e09b62ec88394696ac98bf49cc97f15c';
      const apiUrl = `https://api.rawg.io/api/platforms/${platformId}`;
      
      const response = await axios.get(apiUrl, {
        params: {
          key: apiKey,
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error?.response?.data || 'Failed to fetch platform data from RAWG.io',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get platforms list from RAWG.io API
   * @param ordering - Which field to use when ordering the results
   * @param page - A page number within the paginated result set
   * @param pageSize - Number of results to return per page
   * @returns Platforms list from RAWG.io API
   */
  async getPlatformsListFromRawg(
    ordering?: string,
    page?: number,
    pageSize?: number,
  ): Promise<any> {
    try {
      const apiKey = 'e09b62ec88394696ac98bf49cc97f15c';
      const apiUrl = 'https://api.rawg.io/api/platforms';
      
      const params: any = {
        key: apiKey,
      };

      if (ordering) {
        params.ordering = ordering;
      }

      if (page !== undefined && page !== null) {
        params.page = page;
      }

      if (pageSize !== undefined && pageSize !== null) {
        params.page_size = pageSize;
      }

      const response = await axios.get(apiUrl, {
        params,
      });

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error?.response?.data || 'Failed to fetch platforms from RAWG.io',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Get parent platforms list from RAWG.io API
   * @param ordering - Which field to use when ordering the results
   * @param page - A page number within the paginated result set
   * @param pageSize - Number of results to return per page
   * @returns Parent platforms list from RAWG.io API
   */
  async getParentPlatformsFromRawg(
    ordering?: string,
    page?: number,
    pageSize?: number,
  ): Promise<any> {
    try {
      const apiKey = 'e09b62ec88394696ac98bf49cc97f15c';
      const apiUrl = 'https://api.rawg.io/api/platforms/lists/parents';
      
      const params: any = {
        key: apiKey,
      };

      if (ordering) {
        params.ordering = ordering;
      }

      if (page !== undefined && page !== null) {
        params.page = page;
      }

      if (pageSize !== undefined && pageSize !== null) {
        params.page_size = pageSize;
      }

      const response = await axios.get(apiUrl, {
        params,
      });

      return response.data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error?.response?.data || 'Failed to fetch parent platforms from RAWG.io',
        error?.response?.status || HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
