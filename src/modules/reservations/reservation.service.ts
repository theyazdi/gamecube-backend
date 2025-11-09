import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  SearchAvailableGamenetDto,
  CheckAvailabilityDto,
  SearchAvailableStationsDto,
} from './dto';
import { SearchAvailableGamenetQueryDto } from './dto/search-available-gamenet-query.dto';
import {
  isValidTimeSlot,
  isPastTime,
  getDateOnly,
} from '../../shared/utils/time-slot.util';
import { calculateBoundingBox } from '../../shared/utils/geo.util';
import {
  jalaliToGregorian,
  jalaliDateTimeToGregorian,
  isValidJalaliDateFormat,
  isValidTimeFormat,
} from '../../shared/utils/date-converter.util';
import { Prisma } from '../../generated/client';
import { Logger } from '../../shared/utils/logger.util';
import { ReservationSearchService } from './reservation-search.service';

@Injectable()
export class ReservationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly searchService: ReservationSearchService,
  ) {}

  /**
   * Create a new reservation
   */
  async create(dto: CreateReservationDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const reservedDate = new Date(dto.reservedDate);

    // Validation 1: Check time slot validity
    if (!isValidTimeSlot(startTime, endTime)) {
      throw new BadRequestException(
        'Invalid time slot. Reservations must be 30-minute intervals starting on the hour.',
      );
    }

    // Validation 2: Check that time is not in the past
    if (isPastTime(startTime)) {
      throw new BadRequestException('Cannot create reservation for past time.');
    }

    // Validation 3: Check station existence
    const station = await this.prisma.station.findFirst({
      where: {
        id: dto.stationId,
        organizationId: dto.organizationId,
        consoleId: dto.consoleId,
        isActive: true,
        isAccepted: true,
        deletedAt: null,
      },
      include: {
        pricings: {
          where: { playerCount: dto.playerCount },
        },
      },
    });

    if (!station) {
      throw new NotFoundException('Station not found or inactive.');
    }

    // Validation 4: Check capacity
    if (dto.playerCount > station.capacity) {
      throw new BadRequestException(
        `Number of players exceeds station capacity. Capacity: ${station.capacity}`,
      );
    }

    // Validation 5: Check availability
    const isAvailable = await this.checkAvailability({
      stationId: dto.stationId,
      reservedDate: dto.reservedDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    if (!isAvailable) {
      throw new ConflictException(
        'This time slot is already reserved or not available.',
      );
    }

    // Calculate price
    let price = dto.price;
    if (!price) {
      if (station.pricings.length > 0) {
        price = station.pricings[0].price;
      } else {
        throw new BadRequestException(
          'Price is not defined for this number of players.',
        );
      }
    }

    // Create reservation
    const reservation = await this.prisma.reservation.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        stationId: dto.stationId,
        consoleId: dto.consoleId,
        playerCount: dto.playerCount,
        price,
        invoiceId: dto.invoiceId,
        isBlockedByOrg: dto.isBlockedByOrg || false,
        isPaid: dto.isBlockedByOrg || false, // If blocked, usually paid
        isAccepted: dto.isBlockedByOrg || false, // If blocked, usually accepted
        startTime,
        endTime,
        reservedDate: getDateOnly(reservedDate),
        notes: dto.notes,
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            phone: true,
            profile: {
              select: {
                fName: true,
                lName: true,
              },
            },
          },
        },
        organization: {
          select: {
            id: true,
            uuid: true,
            name: true,
            address: true,
            phoneNumber: true,
          },
        },
        station: {
          select: {
            id: true,
            title: true,
            capacity: true,
          },
        },
        console: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return reservation;
  }

  /**
   * Update a reservation
   */
  async update(id: number, dto: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    // If time is changing, availability must be checked
    if (dto.startTime || dto.endTime) {
      const startTime = dto.startTime
        ? new Date(dto.startTime)
        : reservation.startTime;
      const endTime = dto.endTime ? new Date(dto.endTime) : reservation.endTime;

      if (!isValidTimeSlot(startTime, endTime)) {
        throw new BadRequestException('Invalid time slot.');
      }

      if (isPastTime(startTime)) {
        throw new BadRequestException(
          'Cannot change reservation to past time.',
        );
      }

      // Check availability (excluding this reservation)
      const conflictingReservations = await this.prisma.reservation.count({
        where: {
          stationId: reservation.stationId,
          reservedDate: reservation.reservedDate,
          id: { not: id },
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } },
              ],
            },
          ],
        },
      });

      if (conflictingReservations > 0) {
        throw new ConflictException('New time slot is not available.');
      }
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        ...(dto.userId !== undefined && { userId: dto.userId }),
        ...(dto.organizationId && { organizationId: dto.organizationId }),
        ...(dto.stationId && { stationId: dto.stationId }),
        ...(dto.consoleId && { consoleId: dto.consoleId }),
        ...(dto.playerCount && { playerCount: dto.playerCount }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.invoiceId !== undefined && { invoiceId: dto.invoiceId }),
        ...(dto.isPaid !== undefined && { isPaid: dto.isPaid }),
        ...(dto.isAccepted !== undefined && { isAccepted: dto.isAccepted }),
        ...(dto.isBlockedByOrg !== undefined && {
          isBlockedByOrg: dto.isBlockedByOrg,
        }),
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            phone: true,
            profile: { select: { fName: true, lName: true } },
          },
        },
        organization: {
          select: {
            id: true,
            uuid: true,
            name: true,
          },
        },
        station: { select: { id: true, title: true } },
        console: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Delete a reservation
   */
  async remove(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    await this.prisma.reservation.delete({ where: { id } });

    return { message: 'Reservation deleted successfully.' };
  }

  /**
   * Get a single reservation
   */
  async findOne(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            phone: true,
            profile: { select: { fName: true, lName: true } },
          },
        },
        organization: {
          select: {
            id: true,
            uuid: true,
            name: true,
            address: true,
            phoneNumber: true,
            latitude: true,
            longitude: true,
          },
        },
        station: {
          select: {
            id: true,
            title: true,
            capacity: true,
          },
        },
        console: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    return reservation;
  }

  /**
   * Get reservations for a user
   */
  async findByUser(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          organization: {
            select: { id: true, uuid: true, name: true },
          },
          station: {
            select: { id: true, title: true },
          },
          console: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.reservation.count({ where: { userId } }),
    ]);

    return {
      data: reservations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get reservations for a gaming cafe
   */
  async findByOrganization(organizationId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { startTime: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              phone: true,
              profile: { select: { fName: true, lName: true } },
            },
          },
          station: {
            select: { id: true, title: true },
          },
          console: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.reservation.count({ where: { organizationId } }),
    ]);

    return {
      data: reservations,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check availability of a time slot
   */
  async checkAvailability(dto: CheckAvailabilityDto): Promise<boolean> {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const reservedDate = getDateOnly(new Date(dto.reservedDate));

    const conflictingReservations = await this.prisma.reservation.count({
      where: {
        stationId: dto.stationId,
        reservedDate,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    return conflictingReservations === 0;
  }

  /**
   * Search available gaming cafes based on geographical coordinates
   */
  async searchAvailableGamenets(dto: SearchAvailableGamenetDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const reservedDate = getDateOnly(new Date(dto.reservedDate));
    const limit = dto.limit || 20;

    // Validation
    if (!isValidTimeSlot(startTime, endTime)) {
      throw new BadRequestException('Invalid time slot.');
    }

    if (isPastTime(startTime)) {
      throw new BadRequestException('Cannot search for past time.');
    }

    // Calculate bounding box
    const bbox = calculateBoundingBox(
      { latitude: dto.latitude, longitude: dto.longitude },
      dto.radiusKm,
    );

    // Query with Prisma (Raw SQL for better optimization)
    const query = Prisma.sql`
      WITH nearby_orgs AS (
        SELECT 
          o.id,
          o.uuid,
          o.name,
          o.address,
          o.phone_number as "phoneNumber",
          o.latitude,
          o.longitude,
          (
            6371 * acos(
              cos(radians(${dto.latitude})) * 
              cos(radians(o.latitude::float)) * 
              cos(radians(o.longitude::float) - radians(${dto.longitude})) + 
              sin(radians(${dto.latitude})) * 
              sin(radians(o.latitude::float))
            )
          ) AS distance
        FROM organizations o
        WHERE o.latitude BETWEEN ${bbox.minLat} AND ${bbox.maxLat}
          AND o.longitude BETWEEN ${bbox.minLon} AND ${bbox.maxLon}
          AND o.latitude IS NOT NULL
          AND o.longitude IS NOT NULL
        HAVING distance < ${dto.radiusKm}
      ),
      available_stations AS (
        SELECT DISTINCT 
          s.id,
          s.organization_id as "organizationId",
          s.title,
          s.console_id as "consoleId",
          s.capacity
        FROM stations s
        INNER JOIN nearby_orgs no ON s.organization_id = no.id
        WHERE s.console_id = ${dto.consoleId}
          AND s.capacity >= ${dto.playerCount}
          AND s.is_active = true
          AND s.is_accepted = true
          AND s.deleted_at IS NULL
          AND NOT EXISTS (
            SELECT 1 
            FROM reservations r
            WHERE r.station_id = s.id
              AND r.reserved_date = ${reservedDate}
              AND r.start_time < ${endTime}
              AND r.end_time > ${startTime}
          )
          ${
            dto.gameId
              ? Prisma.sql`AND EXISTS (
            SELECT 1
            FROM station_games sg
            WHERE sg.station_id = s.id
              AND sg.game_id = ${dto.gameId}
          )`
              : Prisma.empty
          }
      )
      SELECT 
        no.id,
        no.uuid,
        no.name,
        no.address,
        no."phoneNumber",
        no.latitude,
        no.longitude,
        no.distance,
        COUNT(ast.id) as "availableStationsCount",
        json_agg(
          json_build_object(
            'stationId', ast.id,
            'title', ast.title,
            'capacity', ast.capacity
          )
        ) as stations
      FROM nearby_orgs no
      INNER JOIN available_stations ast ON ast."organizationId" = no.id
      GROUP BY no.id, no.uuid, no.name, no.address, no."phoneNumber", no.latitude, no.longitude, no.distance
      HAVING COUNT(ast.id) > 0
      ORDER BY no.distance, "availableStationsCount" DESC
      LIMIT ${limit}
    `;

    const results = await this.prisma.$queryRaw<any[]>(query);

    // Get prices for each station
    for (const org of results) {
      if (org.stations && Array.isArray(org.stations)) {
        for (const station of org.stations) {
          const pricing = await this.prisma.stationPricing.findFirst({
            where: {
              stationId: station.stationId,
              playerCount: dto.playerCount,
            },
            select: { price: true },
          });

          station.price = pricing?.price || null;
        }
      }
    }

    return results;
  }

  /**
   * Get available time slots for a station in a day
   */
  async getAvailableTimeSlots(
    stationId: number,
    date: string,
  ): Promise<
    Array<{
      startTime: Date;
      endTime: Date;
      label: string;
    }>
  > {
    const reservedDate = getDateOnly(new Date(date));

    // Get all reservations for this station on this day
    const reservations = await this.prisma.reservation.findMany({
      where: {
        stationId,
        reservedDate,
      },
      select: {
        startTime: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Generate all time slots for the day
    const allSlots = this.generateDayTimeSlots(reservedDate);

    // Filter available slots
    const availableSlots = allSlots.filter((slot) => {
      return !reservations.some((reservation) => {
        return (
          slot.startTime < reservation.endTime &&
          slot.endTime > reservation.startTime
        );
      });
    });

    return availableSlots;
  }

  /**
   * Helper: Generate all time slots for a day
   * Uses Tehran timezone (UTC+3:30)
   */
  private generateDayTimeSlots(date: Date): Array<{
    startTime: Date;
    endTime: Date;
    label: string;
  }> {
    const slots: Array<{
      startTime: Date;
      endTime: Date;
      label: string;
    }> = [];
    const baseDate = getDateOnly(date); // Use getDateOnly which uses Tehran timezone

    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const startTime = new Date(baseDate);
        startTime.setHours(hour, minute, 0, 0);

        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + 30);

        const formatTime = (d: Date) => {
          return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        };

        slots.push({
          startTime,
          endTime,
          label: `${formatTime(startTime)} - ${formatTime(endTime)}`,
        });
      }
    }

    return slots;
  }

  /**
   * Search open gaming cafes based on query parameters (frontend compatible)
   * Optimized version using optimized query
   */
  async searchOpenGamenets(query: SearchAvailableGamenetQueryDto) {
    // Use optimized version
    const useOptimizedVersion = process.env.USE_OPTIMIZED_SEARCH !== 'false';

    if (useOptimizedVersion) {
      return this.searchOpenGamenetsOptimized(query);
    }

    // Legacy version (for comparison)
    return this.searchOpenGamenetsLegacy(query);
  }

  /**
   * Optimized version of searching open gaming cafes
   * This version uses unified Raw SQL and avoids N+1 Problem
   */
  private async searchOpenGamenetsOptimized(query: SearchAvailableGamenetQueryDto) {

    // Validate date and time (similar to previous version)
    if (query.date && !isValidJalaliDateFormat(query.date)) {
      throw new BadRequestException(
        'Invalid date format. Correct format: YYYY/MM/DD',
      );
    }

    if (query.startTime && !isValidTimeFormat(query.startTime)) {
      throw new BadRequestException(
        'Invalid start time format. Correct format: HH:mm',
      );
    }

    if (query.endTime && !isValidTimeFormat(query.endTime)) {
      throw new BadRequestException(
        'Invalid end time format. Correct format: HH:mm',
      );
    }

    if ((query.startTime || query.endTime) && !query.date) {
      throw new BadRequestException(
        'To specify time range, date must also be specified.',
      );
    }

    // Convert date and time
    let reservedDate: Date;
    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (query.date) {
      try {
        reservedDate = jalaliToGregorian(query.date);

        if (query.startTime) {
          startDateTime = jalaliDateTimeToGregorian(query.date, query.startTime);
        }

        if (query.endTime) {
          endDateTime = jalaliDateTimeToGregorian(query.date, query.endTime);
        }
      } catch (error) {
        Logger.error('Error converting date:', error);
        throw new BadRequestException(`Error converting date: ${error.message}`);
      }
    } else {
      reservedDate = new Date();
    }

    // Calculate bounding box
    const bbox = calculateBoundingBox(
      { latitude: query.latitude, longitude: query.longitude },
      query.radiusKm,
    );

    // Use optimized query
    const organizations = await this.searchService.searchOrganizationsWithStationsAndReservations({
      bbox,
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: query.radiusKm,
      consoleId: query.consoleId,
      gameId: query.gameId,
      playerCount: query.playerCount,
      reservedDate: getDateOnly(reservedDate),
    });

    // Calculate Iranian day of week once
    const jsDayOfWeek = reservedDate.getDay();
    const iranianDayOfWeek = (jsDayOfWeek + 1) % 7;

    // Get working hours for all organizations at once (batch)
    const orgIds = organizations.map((o) => o.id);
    const workingHoursMap = await this.searchService.getWorkingHoursBatch(
      orgIds,
      iranianDayOfWeek,
    );
    const allWorkingHoursMap = await this.searchService.getAllWorkingHoursBatch(orgIds);

        // Process results
    const results = await Promise.all(
      organizations.map(async (org) => {

        // Parse stations (JSON from query)
        let stations = Array.isArray(org.stations) ? org.stations : [];

        // Filter empty stations
        stations = stations.filter((s: any) => s.id);

        if (stations.length === 0) {
          return null;
        }

        // Calculate available slots for each station
        const stationsWithSlots = stations.map((station: any) => {
          let availableSlots: any[] = [];

          if (reservedDate) {
            // Parse reservations from JSON
            const reservations = Array.isArray(station.reservations) ? station.reservations : [];

            // Convert string dates to Date objects
            const parsedReservations = reservations.map((r: any) => ({
              startTime: new Date(r.startTime),
              endTime: new Date(r.endTime),
            }));

            // Generate all time slots
            const allSlots = this.generateDayTimeSlots(reservedDate);

            // Filter available slots
            const available = allSlots.filter((slot) => {
              return !parsedReservations.some((reservation: any) => {
                return (
                  slot.startTime < reservation.endTime &&
                  slot.endTime > reservation.startTime
                );
              });
            });

            // Check specified time range
            if (startDateTime && endDateTime) {
              const reqStart = startDateTime.getTime();
              const reqEnd = endDateTime.getTime();
              const slotDuration = 30 * 60 * 1000;
              const requiredSlots = Math.floor((reqEnd - reqStart) / slotDuration);

              let allSlotsAvailable = true;
              for (let i = 0; i < requiredSlots; i++) {
                const slotStart = new Date(reqStart + i * slotDuration);
                const slotEnd = new Date(slotStart.getTime() + slotDuration);

                const isSlotAvailable = available.some((slot) => {
                  return (
                    slot.startTime.getTime() === slotStart.getTime() &&
                    slot.endTime.getTime() === slotEnd.getTime()
                  );
                });

                if (!isSlotAvailable) {
                  allSlotsAvailable = false;
                  break;
                }
              }

              if (!allSlotsAvailable) {
                return null; // Station not available in the specified time range
              }
            }

            // Format slots
            availableSlots = available.map((slot) => {
              const formatTime = (d: Date) =>
                `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
              return {
                startTime: formatTime(slot.startTime),
                endTime: formatTime(slot.endTime),
                label: slot.label,
              };
            });
          }

          return {
            id: station.id,
            title: station.title,
            consoleId: station.consoleId,
            capacity: station.capacity,
            pricings: Array.isArray(station.pricings) ? station.pricings : [],
            availableSlots,
          };
        }).filter((s: any) => s !== null);

        if (stationsWithSlots.length === 0) {
          return null;
        }

        // Check working hours
        const todayWorkingHours = workingHoursMap.get(org.id);
        let isOpen = true;

        if (startDateTime && todayWorkingHours) {
          if (todayWorkingHours.isClosed) {
            isOpen = false;
          } else if (!todayWorkingHours.is24Hours && todayWorkingHours.startTime && todayWorkingHours.endTime) {
            const [startHour, startMinute] = todayWorkingHours.startTime.split(':').map(Number);
            const [endHour, endMinute] = todayWorkingHours.endTime.split(':').map(Number);
            const requestHour = startDateTime.getHours();
            const requestMinute = startDateTime.getMinutes();
            const requestTimeInMinutes = requestHour * 60 + requestMinute;
            const startTimeInMinutes = startHour * 60 + startMinute;
            const endTimeInMinutes = endHour * 60 + endMinute;

            isOpen = requestTimeInMinutes >= startTimeInMinutes && requestTimeInMinutes < endTimeInMinutes;
          }
        } else if (todayWorkingHours && todayWorkingHours.isClosed) {
          isOpen = false;
        }

        // Build workingHours and workingDays
        const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const allWorkingHours = allWorkingHoursMap.get(org.id) || [];

        const workingDays = dayNames.map((name, index) => {
          const wh = allWorkingHours.find((w: any) => w.dayOfWeek === index);
          return {
            dayOfWeek: index,
            dayName: name,
            isWorking: wh ? !wh.isClosed : true,
          };
        });

        let summary = '';
        let todayHours: any = null;
        if (todayWorkingHours) {
          if (todayWorkingHours.isClosed) {
            summary = 'Closed';
            todayHours = { startTime: null, endTime: null, is24Hours: false, isClosed: true };
          } else if (todayWorkingHours.is24Hours) {
            summary = '24 Hours';
            todayHours = { startTime: '00:00', endTime: '24:00', is24Hours: true, isClosed: false };
          } else if (todayWorkingHours.startTime && todayWorkingHours.endTime) {
            summary = `${todayWorkingHours.startTime} - ${todayWorkingHours.endTime}`;
            todayHours = {
              startTime: todayWorkingHours.startTime,
              endTime: todayWorkingHours.endTime,
              is24Hours: false,
              isClosed: false,
            };
          }
        } else {
          summary = '24 Hours';
          todayHours = { startTime: '00:00', endTime: '24:00', is24Hours: true, isClosed: false };
        }

        // Extract consoles
        const consoleMap = new Map();
        stations.forEach((s: any) => {
          if (s.consoleId && s.consoleName) {
            consoleMap.set(s.consoleId, { id: s.consoleId, name: s.consoleName });
          }
        });
        const uniqueConsoles = Array.from(consoleMap.values()).sort((a, b) => a.id - b.id);

        // Convert distance to meters
        const distanceInMeters = Math.round(org.distance * 1000);

        return {
          id: org.id,
          username: org.username || null,
          name: org.name,
          logoImage: org.logoImage || null,
          indexImage: org.indexImage || null,
          rating: null,
          distance: distanceInMeters,
          distanceUnit: 'm',
          isOpen,
          workingHours: { today: todayHours, summary },
          workingDays,
          consoles: uniqueConsoles,
          stations: stationsWithSlots,
        };
      }),
    );

    // Remove nulls
    let validResults = results.filter((r) => r !== null);


    // Filter or sort by isOpen
    if (startDateTime && endDateTime) {
      const beforeFilter = validResults.length;
      validResults = validResults.filter((org) => org.isOpen === true);
    } else {
      validResults.sort((a, b) => {
        if (a.isOpen !== b.isOpen) {
          return a.isOpen ? -1 : 1;
        }
        return a.distance - b.distance;
      });
    }


    return {
      organizations: validResults,
      meta: {
        total: validResults.length,
        page: 1,
      },
    };
  }

  /**
   * Legacy version of searching open gaming cafes (for comparison and fallback)
   */
  private async searchOpenGamenetsLegacy(query: SearchAvailableGamenetQueryDto) {

    // Validate date and time
    if (query.date && !isValidJalaliDateFormat(query.date)) {
      throw new BadRequestException(
        'Invalid date format. Correct format: YYYY/MM/DD',
      );
    }

    if (query.startTime && !isValidTimeFormat(query.startTime)) {
      throw new BadRequestException(
        'Invalid start time format. Correct format: HH:mm',
      );
    }

    if (query.endTime && !isValidTimeFormat(query.endTime)) {
      throw new BadRequestException(
        'Invalid end time format. Correct format: HH:mm',
      );
    }

    // If startTime or endTime is provided, date must also be provided
    // (because we cannot check time without date)
    if ((query.startTime || query.endTime) && !query.date) {
      throw new BadRequestException(
        'To specify time range, date must also be specified.',
      );
    }

    // Convert Jalali date to Gregorian
    // If date is not sent, use today
    let reservedDate: Date;
    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (query.date) {
      try {
        reservedDate = jalaliToGregorian(query.date);

        if (query.startTime) {
          startDateTime = jalaliDateTimeToGregorian(
            query.date,
            query.startTime,
          );
        }

        if (query.endTime) {
          endDateTime = jalaliDateTimeToGregorian(query.date, query.endTime);
        }
      } catch (error) {
        Logger.error('Error converting date:', error);
        throw new BadRequestException(
          `Error converting date: ${error.message}`,
        );
      }
    } else {
      // If date is not sent, use today
      reservedDate = new Date();
    }

    // Calculate bounding box
    const bbox = calculateBoundingBox(
      { latitude: query.latitude, longitude: query.longitude },
      query.radiusKm,
    );

    // Search gaming cafes
    const queryConditions: any[] = [
      Prisma.sql`o.latitude BETWEEN ${bbox.minLat} AND ${bbox.maxLat}`,
      Prisma.sql`o.longitude BETWEEN ${bbox.minLon} AND ${bbox.maxLon}`,
      Prisma.sql`o.latitude IS NOT NULL`,
      Prisma.sql`o.longitude IS NOT NULL`,
    ];

    // Calculate distance
    const distanceCalc = Prisma.sql`(
      6371 * acos(
        cos(radians(${query.latitude})) * 
        cos(radians(o.latitude::float)) * 
        cos(radians(o.longitude::float) - radians(${query.longitude})) + 
        sin(radians(${query.latitude})) * 
        sin(radians(o.latitude::float))
      )
    )`;

    const baseQuery = Prisma.sql`
      SELECT * FROM (
        SELECT 
          o.id,
          o.uuid,
          o.name,
          o.username,
          o.address,
          o."phoneNumber",
          o.province,
          o.city,
          o.latitude,
          o.longitude,
          o."indexImage",
          o."logoImage",
          ${distanceCalc} AS distance
        FROM organizations o
        WHERE ${Prisma.join(queryConditions, ' AND ')}
      ) AS orgs
      WHERE distance < ${query.radiusKm}
      ORDER BY distance
    `;

    const organizations = await this.prisma.$queryRaw<any[]>(baseQuery);

    // For each organization, get stations and availableSlots
    const results = await Promise.all(
      organizations.map(async (org) => {
        // Station filter conditions
        const stationWhere: any = {
          organizationId: org.id,
          isActive: true,
          isAccepted: true,
          deletedAt: null,
        };

        if (query.consoleId) {
          stationWhere.consoleId = query.consoleId;
        }

        if (query.playerCount) {
          stationWhere.capacity = { gte: query.playerCount };
        }

        // Get stations
        let stations = await this.prisma.station.findMany({
          where: stationWhere,
          include: {
            console: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            pricings: query.playerCount
              ? {
                  where: { playerCount: query.playerCount },
                }
              : true,
            stationGames: query.gameId
              ? {
                  where: { gameId: query.gameId },
                  include: {
                    game: {
                      select: {
                        id: true,
                        title: true,
                        coverImage: true,
                      },
                    },
                  },
                }
              : {
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
          },
        });

        // If gameId is specified, only stations that have this game
        if (query.gameId) {
          const beforeFilter = stations.length;
          stations = stations.filter(
            (station) => station.stationGames.length > 0,
          );
        }


        // For each station, get availableSlots (if date is specified)
        const stationsWithSlots = await Promise.all(
          stations.map(async (station) => {
            let availableSlots: any[] = [];

            if (reservedDate) {
              const dateOnly = getDateOnly(reservedDate);

              // Get all reservations
              const reservations = await this.prisma.reservation.findMany({
                where: {
                  stationId: station.id,
                  reservedDate: dateOnly,
                },
                select: {
                  startTime: true,
                  endTime: true,
                },
                orderBy: { startTime: 'asc' },
              });


              // Generate all time slots
              const allSlots = this.generateDayTimeSlots(reservedDate);

              // Filter available slots
              const available = allSlots.filter((slot) => {
                return !reservations.some((reservation) => {
                  return (
                    slot.startTime < reservation.endTime &&
                    slot.endTime > reservation.startTime
                  );
                });
              });


              // If time range is specified, check that all slots in this range are available
              if (startDateTime && endDateTime) {
                
                // Calculate number of required slots (each slot is 30 minutes)
                const reqStart = startDateTime.getTime();
                const reqEnd = endDateTime.getTime();
                const slotDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
                const requiredSlots = Math.floor((reqEnd - reqStart) / slotDuration);


                // Check if all slots in this range are available
                let allSlotsAvailable = true;
                const requiredSlotTimes: Date[] = [];

                for (let i = 0; i < requiredSlots; i++) {
                  const slotStart = new Date(reqStart + i * slotDuration);
                  const slotEnd = new Date(slotStart.getTime() + slotDuration);
                  requiredSlotTimes.push(slotStart);

                  const isSlotAvailable = available.some((slot) => {
                    return (
                      slot.startTime.getTime() === slotStart.getTime() &&
                      slot.endTime.getTime() === slotEnd.getTime()
                    );
                  });

                  if (!isSlotAvailable) {
                    allSlotsAvailable = false;
                    break;
                  } else {
                  }
                }


                // If all slots in the time range are not available, we don't keep this station
                if (!allSlotsAvailable) {
                  return null;
                }
              }

              // Format slots (with Tehran timezone)
              availableSlots = available.map((slot) => {
                const formatTime = (d: Date) =>
                  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
                return {
                  startTime: formatTime(slot.startTime),
                  endTime: formatTime(slot.endTime),
                  label: slot.label,
                };
              });
            }

            // Format pricings
            const pricings = station.pricings.map((pricing) => ({
              playerCount: pricing.playerCount,
              price: pricing.price,
            }));

            return {
              id: station.id,
              title: station.title,
              consoleId: station.consoleId,
              consoleName: station.console.name,
              consoleCategory: station.console.category,
              capacity: station.capacity,
              status: station.status,
              pricings,
              games: station.stationGames.map((sg) => ({
                id: sg.game.id,
                title: sg.game.title,
                coverImage: sg.game.coverImage,
              })),
              availableSlots,
            };
          }),
        );

        // Remove null stations (that were not available)
        const validStations = stationsWithSlots.filter(
          (station) => station !== null,
        );


        // If no stations are available, don't return this organization
        if (validStations.length === 0) {
          return null;
        }

        // Get working hours and working days
        const workingHoursData = await this.getOrganizationWorkingHours(
          org.id,
          reservedDate,
        );

        // Check working hours to determine isOpen
        // If startTime is specified, use it (check day + time)
        // Otherwise, only check day of week (check day only)
        let isOpen = true;


        if (startDateTime) {
          // If time is specified, check both day and time
          isOpen = await this.checkOrganizationWorkingHours(
            org.id,
            reservedDate,
            startDateTime,
          );
        } else {
          // If time is not specified, only check day of week
          isOpen = await this.checkOrganizationWorkingHoursByDayOnly(
            org.id,
            reservedDate,
          );
        }


        // Extract consoles from stations
        // Must use original stations, not validStations (because validStations may be filtered)
        const uniqueConsoles = this.extractConsolesFromStations(stations);


        // Convert distance from kilometers to meters
        const distanceInMeters = Math.round(org.distance * 1000);

        return {
          id: org.id,
          username: org.username || null,
          name: org.name,
          logoImage: org.logoImage || null,
          indexImage: org.indexImage || null,
          rating: null, // Currently null - will be calculated from reviews later
          distance: distanceInMeters, // Distance in meters
          distanceUnit: 'm', // meters
          isOpen,
          workingHours: workingHoursData.workingHours,
          workingDays: workingHoursData.workingDays,
          consoles: uniqueConsoles,
          stations: validStations.map((station) => ({
            id: station.id,
            title: station.title,
            consoleId: station.consoleId,
            capacity: station.capacity,
            pricings: station.pricings,
          })),
        };
      }),
    );

    // Remove null organizations
    let validResults = results.filter((result) => result !== null);


    // If date and time are given, only show open gaming cafes
    if (startDateTime && endDateTime) {
      const beforeFilter = validResults.length;
      validResults = validResults.filter((org) => org.isOpen === true);
    } else {
      // If date and time are not given, show all but sort
      // First open ones (closest first), then closed ones

      validResults.sort((a, b) => {
        // First by isOpen (open ones first)
        if (a.isOpen !== b.isOpen) {
          return a.isOpen ? -1 : 1; // true (open) comes first
        }
        // If both are open or both are closed, sort by distance
        return a.distance - b.distance;
      });
    }


    return {
      organizations: validResults,
      meta: {
        total: validResults.length,
        page: 1, // Currently no pagination
      },
    };
  }

  /**
   * Check working hours of an organization
   */
  private async checkOrganizationWorkingHours(
    organizationId: number,
    date: Date,
    time: Date,
  ): Promise<boolean> {
    // Get day of week
    // In JS: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // In Iranian system: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
    const jsDayOfWeek = date.getDay();
    // Convert: JS 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→0
    const iranianDayOfWeek = (jsDayOfWeek + 1) % 7;

    const workingHours =
      await this.prisma.organizationWorkingHours.findUnique({
        where: {
          organizationId_dayOfWeek: {
            organizationId,
            dayOfWeek: iranianDayOfWeek,
          },
        },
      });

    if (!workingHours) {
      return true; // If not defined, assume it's open
    }

    if (workingHours.isClosed) {
      return false; // Closed
    }

    if (workingHours.is24Hours) {
      return true; // Open 24 hours
    }

    // Check time range
    if (workingHours.startTime && workingHours.endTime) {
      const [startHour, startMinute] = workingHours.startTime
        .split(':')
        .map(Number);
      const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);

      const requestHour = time.getHours();
      const requestMinute = time.getMinutes();

      const requestTimeInMinutes = requestHour * 60 + requestMinute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      if (
        requestTimeInMinutes >= startTimeInMinutes &&
        requestTimeInMinutes < endTimeInMinutes
      ) {
        return true;
      }

      return false;
    }

    return true;
  }

  /**
   * Check working hours of an organization only based on day of week (without time)
   */
  private async checkOrganizationWorkingHoursByDayOnly(
    organizationId: number,
    date: Date,
  ): Promise<boolean> {
    // Get day of week
    // In JS: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // In Iranian system: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
    const jsDayOfWeek = date.getDay();
    // Convert: JS 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→0
    const iranianDayOfWeek = (jsDayOfWeek + 1) % 7;

    const workingHours =
      await this.prisma.organizationWorkingHours.findUnique({
        where: {
          organizationId_dayOfWeek: {
            organizationId,
            dayOfWeek: iranianDayOfWeek,
          },
        },
      });

    if (!workingHours) {
      return true; // If not defined, assume it's open
    }

    if (workingHours.isClosed) {
      return false; // Closed
    }

    // If not closed, it's open (without checking time)
    return true;
  }

  /**
   * Get working hours and working days of an organization
   */
  private async getOrganizationWorkingHours(organizationId: number, date: Date) {
    // Get day of week
    // In JS: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // In Iranian system: 0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday
    const jsDayOfWeek = date.getDay();
    // Convert: JS 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→0
    const iranianDayOfWeek = (jsDayOfWeek + 1) % 7;

    // Get working hours for today
    const todayWorkingHours =
      await this.prisma.organizationWorkingHours.findUnique({
        where: {
          organizationId_dayOfWeek: {
            organizationId,
            dayOfWeek: iranianDayOfWeek,
          },
        },
      });

    // Get all working hours
    const allWorkingHours =
      await this.prisma.organizationWorkingHours.findMany({
        where: { organizationId },
        orderBy: { dayOfWeek: 'asc' },
      });

    // Day names of week
        const dayNames = [
      'Saturday',
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
    ];

    // Build working days (7 days of week)
    const workingDays: Array<{
      dayOfWeek: number;
      dayName: string;
      isWorking: boolean;
    }> = [];
    for (let i = 0; i < 7; i++) {
      const wh = allWorkingHours.find((w) => w.dayOfWeek === i);
      workingDays.push({
        dayOfWeek: i,
        dayName: dayNames[i],
        isWorking: wh ? !wh.isClosed : true, // If not defined, assume it's open
      });
    }

    // Build working hours for today
    let todayHours: {
      startTime: string | null;
      endTime: string | null;
      is24Hours: boolean;
      isClosed: boolean;
    } | null = null;
    let summary = '';

    if (todayWorkingHours) {
      if (todayWorkingHours.isClosed) {
        summary = 'Closed';
        todayHours = {
          startTime: null,
          endTime: null,
          is24Hours: false,
          isClosed: true,
        };
      } else if (todayWorkingHours.is24Hours) {
        summary = '24 Hours';
        todayHours = {
          startTime: '00:00',
          endTime: '24:00',
          is24Hours: true,
          isClosed: false,
        };
      } else if (
        todayWorkingHours.startTime &&
        todayWorkingHours.endTime
      ) {
        summary = `${todayWorkingHours.startTime} - ${todayWorkingHours.endTime}`;
        todayHours = {
          startTime: todayWorkingHours.startTime,
          endTime: todayWorkingHours.endTime,
          is24Hours: false,
          isClosed: false,
        };
      }
    } else {
      // If not defined, assume it's open 24 hours
      summary = '24 Hours';
      todayHours = {
        startTime: '00:00',
        endTime: '24:00',
        is24Hours: true,
        isClosed: false,
      };
    }

    return {
      workingHours: {
        today: todayHours,
        summary,
      },
      workingDays,
    };
  }

  /**
   * Extract unique consoles from stations
   */
  private extractConsolesFromStations(stations: any[]): Array<{
    id: number;
    name: string;
  }> {
    const consoleMap = new Map<number, { id: number; name: string }>();

    stations.forEach((station) => {
      if (station.console) {
        if (!consoleMap.has(station.console.id)) {
          consoleMap.set(station.console.id, {
            id: station.console.id,
            name: station.console.name,
          });
        }
      }
    });

    const result = Array.from(consoleMap.values()).sort((a, b) => a.id - b.id);

    return result;
  }

  /**
   * Search available stations - optimized endpoint for high-traffic
   * This method directly returns available stations without requiring geographical coordinates
   *
   * @param dto Search data including Jalali date, time and filters
   * @returns List of available stations with complete organization information
   */
  async searchAvailableStations(dto: any) {
    // Validation 1: Validate Jalali date format
    if (!isValidJalaliDateFormat(dto.date)) {
      throw new BadRequestException(
        'Invalid date format. Correct format: YYYY/MM/DD (e.g. 1403/09/15)',
      );
    }

    // Validation 2: Validate time format
    if (!isValidTimeFormat(dto.startTime)) {
      throw new BadRequestException(
        'Invalid start time format. Correct format: HH:mm (e.g. 14:30)',
      );
    }

    if (!isValidTimeFormat(dto.endTime)) {
      throw new BadRequestException(
        'Invalid end time format. Correct format: HH:mm (e.g. 18:00)',
      );
    }

    // Validation 3: Check logical time range
    if (dto.startTime >= dto.endTime) {
      throw new BadRequestException(
        'Start time must be before end time.',
      );
    }

    // Convert Jalali date to Gregorian
    let gregorianDate: Date;
    try {
      gregorianDate = jalaliToGregorian(dto.date);
    } catch (error) {
      throw new BadRequestException('Invalid date entered.');
    }

    // Combine date and start time to check it's not in the past
    const startDateTime = jalaliDateTimeToGregorian(
      dto.date,
      dto.startTime,
    );

    // Validation 4: Check that time is not in the past (with 10-minute tolerance)
    if (isPastTime(startDateTime, 10)) {
      throw new BadRequestException(
        'Cannot search for past time.',
      );
    }

    // Call optimized method for search
    const perfStartTime = Date.now();
    const rawResults = await this.searchService.searchAvailableStationsOptimized(
      {
        username: dto.username,
        consoleId: dto.consoleId,
        gameId: dto.gameId,
        playerCount: dto.playerCount,
        reservedDate: gregorianDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
    );
    const searchTime = Date.now() - perfStartTime;

    // Transform raw results to stations array
    const stations = rawResults.map((row: any) => ({
      id: row.station_id,
      title: row.station_title,
      consoleId: row.consoleId,
      consoleName: row.console_name,
      consoleCategory: row.console_category,
      capacity: row.capacity,
      status: row.status,
      isAvailable: row.is_available,
      pricings: row.pricings,
      games: row.games,
    }));

    console.log(
      `[PERFORMANCE] searchAvailableStations completed in ${searchTime}ms - Found ${stations.length} available stations`,
    );

    return {
      stations,
      meta: {
        total: stations.length,
        searchParams: {
          username: dto.username,
          date: dto.date,
          startTime: dto.startTime,
          endTime: dto.endTime,
          consoleId: dto.consoleId,
          gameId: dto.gameId,
          playerCount: dto.playerCount,
        },
      },
    };
  }
}

