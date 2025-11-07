import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database';
import { Organization } from '../../generated/client';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto/organization.dto';
import { CreateWorkingHoursDto, UpdateWorkingHoursDto, WorkingHoursDto } from './dto/working-hours.dto';
import { UserRole } from '../../shared';

@Injectable()
export class OrganizationService {
  constructor(private prisma: PrismaService) {}

  async createOrganization(data: CreateOrganizationDto): Promise<Organization> {
    return this.prisma.organization.create({
      data,
    });
  }

  /**
   * Get all organizations (filtered by user role)
   * @param userId - Optional user ID to filter organizations for organization managers
   * @param userRoles - User roles to determine access level
   */
  async findAllOrganizations(userId?: number, userRoles?: string[]): Promise<Organization[]> {
    // Super admin can see all organizations
    if (userRoles?.includes(UserRole.SUPER_ADMIN)) {
      return this.prisma.organization.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Organization managers can only see their assigned organizations
    if (userRoles?.includes(UserRole.ORGANIZATION_MANAGER) && userId) {
      return this.prisma.organization.findMany({
        where: {
          managers: {
            some: {
              userId,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // Default: return all (for other roles or no role specified)
    return this.prisma.organization.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrganizationById(id: number): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  async findOrganizationByUuid(uuid: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { uuid },
    });
  }

  async findOrganizationByUsername(username: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { username },
    });
  }

  /**
   * Get organization by username with all stations and their details
   * Returns complete organization information including all stations with console, pricings, and games
   */
  async getOrganizationByUsernameWithStations(username: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { username },
      include: {
        stations: {
          where: {
            deletedAt: null,
          },
          include: {
            console: true,
            pricings: {
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
        },
      },
    });
  }

  async findOrganizationsByProvince(province: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { province },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrganizationsByCity(city: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { city },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOrganizationsByProvinceAndCity(province: string, city: string): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: { province, city },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Update organization (with access control)
   * @param id - Organization ID
   * @param data - Update data
   * @param userId - Optional user ID for access control
   * @param userRoles - User roles for access control
   */
  async updateOrganization(
    id: number,
    data: UpdateOrganizationDto,
    userId?: number,
    userRoles?: string[],
  ): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    // Check access: Super admin can update any, organization manager can only update their assigned
    if (userRoles?.includes(UserRole.ORGANIZATION_MANAGER) && !userRoles?.includes(UserRole.SUPER_ADMIN)) {
      if (!userId) {
        throw new ForbiddenException('User ID required for organization manager');
      }

      const userOrg = await this.prisma.userOrganization.findUnique({
        where: {
          userId_organizationId: {
            userId,
            organizationId: id,
          },
        },
      });

      if (!userOrg) {
        throw new ForbiddenException('You do not have permission to update this organization');
      }
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  async updateOrganizationByUuid(uuid: string, data: UpdateOrganizationDto): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { uuid },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with UUID ${uuid} not found`);
    }

    return this.prisma.organization.update({
      where: { uuid },
      data,
    });
  }

  async deleteOrganization(id: number): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return this.prisma.organization.delete({
      where: { id },
    });
  }

  async deleteOrganizationByUuid(uuid: string): Promise<Organization> {
    // Check if organization exists
    const organization = await this.prisma.organization.findUnique({
      where: { uuid },
    });

    if (!organization) {
      throw new NotFoundException(`Organization with UUID ${uuid} not found`);
    }

    return this.prisma.organization.delete({
      where: { uuid },
    });
  }

  /**
   * Find organizations near a given location within a specified radius
   * Uses optimized SQL query with Haversine formula for maximum performance
   * Returns organizations sorted by distance (closest first)
   */
  async findNearbyOrganizations(
    latitude: number,
    longitude: number,
    radiusKm: number,
  ): Promise<(Organization & { distance: number })[]> {
    // Calculate bounding box for pre-filtering
    const latDiff = radiusKm / 111.0;
    const lonDiff = radiusKm / (111.0 * Math.cos(latitude * Math.PI / 180));
    
    // Use raw SQL query with subquery to filter by calculated distance
    // This ensures we can filter by the computed distance column
    const organizations = await this.prisma.$queryRaw<(Organization & { distance: number })[]>`
      SELECT * FROM (
        SELECT 
          id,
          uuid,
          name,
          province,
          city,
          "indexImage",
          "logoImage",
          address,
          latitude,
          longitude,
          "tfHour",
          "isCube",
          "createdAt",
          "updatedAt",
          (
            6371 * acos(
              GREATEST(-1, LEAST(1,
                cos(radians(${latitude})) * 
                cos(radians(CAST(latitude AS DECIMAL))) * 
                cos(radians(CAST(longitude AS DECIMAL)) - radians(${longitude})) + 
                sin(radians(${latitude})) * 
                sin(radians(CAST(latitude AS DECIMAL)))
              ))
            )
          ) AS distance
        FROM organizations
        WHERE 
          latitude IS NOT NULL 
          AND longitude IS NOT NULL
          -- Bounding box pre-filter for better performance (approximate)
          AND CAST(latitude AS DECIMAL) BETWEEN ${latitude - latDiff} AND ${latitude + latDiff}
          AND CAST(longitude AS DECIMAL) BETWEEN ${longitude - lonDiff} AND ${longitude + lonDiff}
      ) AS nearby_orgs
      WHERE distance <= ${radiusKm}
      ORDER BY distance ASC
    `;

    return organizations;
  }

  /**
   * Get organization IDs managed by a user (for filtering)
   */
  async getUserOrganizationIds(userId: number): Promise<number[]> {
    const userOrgs = await this.prisma.userOrganization.findMany({
      where: { userId },
      select: { organizationId: true },
    });
    return userOrgs.map(uo => uo.organizationId);
  }

  /**
   * Get manager's organizations and their stations
   * Returns organizations with id and name, and all stations from those organizations
   */
  async getManagerOrganizationsAndStations(userId: number): Promise<{
    organizations: { id: number; name: string }[];
    stations: any[];
  }> {
    // Get all organizations managed by this user
    const userOrganizations = await this.prisma.userOrganization.findMany({
      where: { userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const organizationIds = userOrganizations.map(uo => uo.organizationId);
    const organizations = userOrganizations.map(uo => ({
      id: uo.organization.id,
      name: uo.organization.name,
    }));

    // Get all stations from these organizations
    const stations = await this.prisma.station.findMany({
      where: {
        organizationId: {
          in: organizationIds,
        },
        deletedAt: null,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        console: true,
        pricings: {
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

    return {
      organizations,
      stations,
    };
  }

  /**
   * Create or update working hours for an organization
   * Validates that all 7 days are provided and handles upsert logic
   */
  async setWorkingHours(organizationId: number, data: CreateWorkingHoursDto): Promise<any[]> {
    // Validate that all 7 days are provided
    if (!data.workingHours || data.workingHours.length !== 7) {
      throw new BadRequestException('Exactly 7 working hours entries (one for each day) are required');
    }

    // Validate dayOfWeek values (0-6)
    const dayOfWeeks = data.workingHours.map(wh => wh.dayOfWeek).sort();
    const expectedDays = [0, 1, 2, 3, 4, 5, 6];
    if (JSON.stringify(dayOfWeeks) !== JSON.stringify(expectedDays)) {
      throw new BadRequestException('All days of week (0-6) must be provided exactly once');
    }

    // Validate each working hours entry
    for (const wh of data.workingHours) {
      if (wh.isClosed && wh.is24Hours) {
        throw new BadRequestException('A day cannot be both closed and 24 hours');
      }

      if (!wh.isClosed && !wh.is24Hours) {
        if (!wh.startTime || !wh.endTime) {
          throw new BadRequestException('startTime and endTime are required when day is not closed and not 24 hours');
        }

        // Validate time format and logic
        const start = this.parseTime(wh.startTime);
        const end = this.parseTime(wh.endTime);
        if (start >= end) {
          throw new BadRequestException('startTime must be before endTime');
        }
      }
    }

    // Upsert working hours for each day
    const results = await Promise.all(
      data.workingHours.map(wh =>
        (this.prisma as any).organizationWorkingHours.upsert({
          where: {
            organizationId_dayOfWeek: {
              organizationId,
              dayOfWeek: wh.dayOfWeek,
            },
          },
          update: {
            isClosed: wh.isClosed,
            is24Hours: wh.is24Hours,
            startTime: wh.isClosed || wh.is24Hours ? null : wh.startTime,
            endTime: wh.isClosed || wh.is24Hours ? null : wh.endTime,
          },
          create: {
            organizationId,
            dayOfWeek: wh.dayOfWeek,
            isClosed: wh.isClosed,
            is24Hours: wh.is24Hours,
            startTime: wh.isClosed || wh.is24Hours ? null : wh.startTime,
            endTime: wh.isClosed || wh.is24Hours ? null : wh.endTime,
          },
        }),
      ),
    );

    return results;
  }

  /**
   * Get working hours for an organization
   */
  async getWorkingHours(organizationId: number): Promise<any[]> {
    return (this.prisma as any).organizationWorkingHours.findMany({
      where: { organizationId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  /**
   * Check if organization is open at a specific date and time
   * Optimized for performance with proper indexes
   */
  async isOrganizationOpen(organizationId: number, date: Date): Promise<boolean> {
    // Get day of week (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
    const dayOfWeek = this.getDayOfWeek(date);

    // Get working hours for this day
    const workingHours = await (this.prisma as any).organizationWorkingHours.findUnique({
      where: {
        organizationId_dayOfWeek: {
          organizationId,
          dayOfWeek,
        },
      },
    });

    if (!workingHours) {
      return false; // No working hours defined, consider closed
    }

    if (workingHours.isClosed) {
      return false;
    }

    if (workingHours.is24Hours) {
      return true;
    }

    // Check if current time is within working hours
    const currentTime = this.getTimeString(date);
    const startTime = workingHours.startTime;
    const endTime = workingHours.endTime;

    if (!startTime || !endTime) {
      return false;
    }

    return this.isTimeInRange(currentTime, startTime, endTime);
  }

  /**
   * Find organizations open at a specific date and time
   * Optimized query with proper indexes for high performance
   */
  async findOpenOrganizations(date: Date, filters?: {
    province?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
  }): Promise<Organization[]> {
    const dayOfWeek = this.getDayOfWeek(date);
    const currentTime = this.getTimeString(date);

    // Build base where clause
    const where: any = {
      workingHours: {
        some: {
          dayOfWeek,
          OR: [
            { is24Hours: true },
            {
              isClosed: false,
              is24Hours: false,
              AND: [
                { startTime: { lte: currentTime } },
                { endTime: { gte: currentTime } },
              ],
            },
          ],
        },
      },
    };

    // Add location filters if provided
    if (filters?.province) {
      where.province = filters.province;
    }

    if (filters?.city) {
      where.city = filters.city;
    }

    // If location and radius provided, use nearby organizations query
    if (filters?.latitude && filters?.longitude && filters?.radiusKm) {
      const nearbyOrgs = await this.findNearbyOrganizations(
        filters.latitude,
        filters.longitude,
        filters.radiusKm,
      );

      const nearbyOrgIds = nearbyOrgs.map(org => org.id);
      where.id = { in: nearbyOrgIds };
    }

    return this.prisma.organization.findMany({
      where,
      include: {
        workingHours: {
          where: { dayOfWeek },
        } as any,
        stations: {
          where: {
            deletedAt: null,
            isAccepted: true,
            isActive: true,
          },
          take: 1, // Just to check if organization has stations
        },
      } as any,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Helper: Parse time string (HH:MM) to minutes for comparison
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper: Get day of week (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
   */
  private getDayOfWeek(date: Date): number {
    // JavaScript: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // We need: 0 = Saturday, 1 = Sunday, ..., 6 = Friday
    const jsDay = date.getDay();
    return (jsDay + 1) % 7;
  }

  /**
   * Helper: Get time string in HH:MM format
   */
  private getTimeString(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Helper: Check if time is within range (handles overnight hours)
   */
  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    const current = this.parseTime(currentTime);
    const start = this.parseTime(startTime);
    const end = this.parseTime(endTime);

    // Normal case: start < end (e.g., 09:00 - 22:00)
    if (start < end) {
      return current >= start && current <= end;
    }

    // Overnight case: start > end (e.g., 22:00 - 06:00)
    // This means it spans midnight
    return current >= start || current <= end;
  }
}
