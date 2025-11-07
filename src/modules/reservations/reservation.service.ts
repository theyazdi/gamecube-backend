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
   * ایجاد رزرو جدید
   */
  async create(dto: CreateReservationDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const reservedDate = new Date(dto.reservedDate);

    // Validation 1: چک کردن اعتبار time slot
    if (!isValidTimeSlot(startTime, endTime)) {
      throw new BadRequestException(
        'بازه زمانی نامعتبر است. رزروها باید نیم ساعته و راس ساعت باشند.',
      );
    }

    // Validation 2: چک کردن گذشته نبودن زمان
    if (isPastTime(startTime)) {
      throw new BadRequestException('نمی‌توان برای زمان گذشته رزرو ایجاد کرد.');
    }

    // Validation 3: چک کردن وجود station
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
      throw new NotFoundException('استیشن یافت نشد یا غیرفعال است.');
    }

    // Validation 4: چک کردن ظرفیت
    if (dto.playerCount > station.capacity) {
      throw new BadRequestException(
        `تعداد نفرات بیشتر از ظرفیت استیشن است. ظرفیت: ${station.capacity}`,
      );
    }

    // Validation 5: چک کردن availability
    const isAvailable = await this.checkAvailability({
      stationId: dto.stationId,
      reservedDate: dto.reservedDate,
      startTime: dto.startTime,
      endTime: dto.endTime,
    });

    if (!isAvailable) {
      throw new ConflictException(
        'این بازه زمانی قبلاً رزرو شده است یا در دسترس نیست.',
      );
    }

    // محاسبه قیمت
    let price = dto.price;
    if (!price) {
      if (station.pricings.length > 0) {
        price = station.pricings[0].price;
      } else {
        throw new BadRequestException(
          'قیمت برای این تعداد نفرات تعریف نشده است.',
        );
      }
    }

    // ایجاد رزرو
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
        isPaid: dto.isBlockedByOrg || false, // اگر block باشد، معمولاً paid هست
        isAccepted: dto.isBlockedByOrg || false, // اگر block باشد، معمولاً accepted هست
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
   * بروزرسانی رزرو
   */
  async update(id: number, dto: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('رزرو یافت نشد.');
    }

    // اگر زمان تغییر می‌کند، باید availability چک شود
    if (dto.startTime || dto.endTime) {
      const startTime = dto.startTime
        ? new Date(dto.startTime)
        : reservation.startTime;
      const endTime = dto.endTime ? new Date(dto.endTime) : reservation.endTime;

      if (!isValidTimeSlot(startTime, endTime)) {
        throw new BadRequestException('بازه زمانی نامعتبر است.');
      }

      if (isPastTime(startTime)) {
        throw new BadRequestException(
          'نمی‌توان رزرو را به زمان گذشته تغییر داد.',
        );
      }

      // چک availability (به جز رزرو خود این)
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
        throw new ConflictException('بازه زمانی جدید در دسترس نیست.');
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
   * حذف رزرو
   */
  async remove(id: number) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('رزرو یافت نشد.');
    }

    await this.prisma.reservation.delete({ where: { id } });

    return { message: 'رزرو با موفقیت حذف شد.' };
  }

  /**
   * دریافت تک رزرو
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
      throw new NotFoundException('رزرو یافت نشد.');
    }

    return reservation;
  }

  /**
   * دریافت رزروهای یک کاربر
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
   * دریافت رزروهای یک گیم‌نت
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
   * چک کردن در دسترس بودن یک بازه زمانی
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
   * جستجوی گیم‌نت‌های قابل رزرو بر اساس مختصات جغرافیایی
   */
  async searchAvailableGamenets(dto: SearchAvailableGamenetDto) {
    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const reservedDate = getDateOnly(new Date(dto.reservedDate));
    const limit = dto.limit || 20;

    // Validation
    if (!isValidTimeSlot(startTime, endTime)) {
      throw new BadRequestException('بازه زمانی نامعتبر است.');
    }

    if (isPastTime(startTime)) {
      throw new BadRequestException('نمی‌توان برای زمان گذشته جستجو کرد.');
    }

    // محاسبه bounding box
    const bbox = calculateBoundingBox(
      { latitude: dto.latitude, longitude: dto.longitude },
      dto.radiusKm,
    );

    // Query با Prisma (Raw SQL برای بهینه‌سازی بیشتر)
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

    // دریافت قیمت‌ها برای هر استیشن
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
   * دریافت time slot های موجود برای یک استیشن در یک روز
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

    // دریافت تمام رزروهای این استیشن در این روز
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

    // تولید تمام time slot های روز
    const allSlots = this.generateDayTimeSlots(reservedDate);

    // فیلتر کردن slot های موجود
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
   * Helper: تولید تمام time slot های یک روز
   * استفاده از timezone تهران (UTC+3:30)
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
    const baseDate = getDateOnly(date); // استفاده از getDateOnly که timezone تهران استفاده می‌کنه

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
   * جستجوی گیم‌نت‌های باز بر اساس query parameters (سازگار با فرانت)
   * نسخه بهینه‌شده با استفاده از optimized query
   */
  async searchOpenGamenets(query: SearchAvailableGamenetQueryDto) {
    // استفاده از نسخه بهینه‌شده
    const useOptimizedVersion = process.env.USE_OPTIMIZED_SEARCH !== 'false';

    if (useOptimizedVersion) {
      return this.searchOpenGamenetsOptimized(query);
    }

    // نسخه قدیمی (برای مقایسه)
    return this.searchOpenGamenetsLegacy(query);
  }

  /**
   * نسخه بهینه‌شده جستجوی گیم‌نت‌های باز
   * این نسخه از Raw SQL یکپارچه استفاده می‌کند و N+1 Problem ندارد
   */
  private async searchOpenGamenetsOptimized(query: SearchAvailableGamenetQueryDto) {

    // Validation تاریخ و زمان (مشابه نسخه قبلی)
    if (query.date && !isValidJalaliDateFormat(query.date)) {
      throw new BadRequestException(
        'فرمت تاریخ نامعتبر است. فرمت صحیح: YYYY/MM/DD',
      );
    }

    if (query.startTime && !isValidTimeFormat(query.startTime)) {
      throw new BadRequestException(
        'فرمت ساعت شروع نامعتبر است. فرمت صحیح: HH:mm',
      );
    }

    if (query.endTime && !isValidTimeFormat(query.endTime)) {
      throw new BadRequestException(
        'فرمت ساعت پایان نامعتبر است. فرمت صحیح: HH:mm',
      );
    }

    if ((query.startTime || query.endTime) && !query.date) {
      throw new BadRequestException(
        'برای تعیین بازه زمانی، باید تاریخ نیز مشخص شود.',
      );
    }

    // تبدیل تاریخ و زمان
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
        Logger.error('خطا در تبدیل تاریخ:', error);
        throw new BadRequestException(`خطا در تبدیل تاریخ: ${error.message}`);
      }
    } else {
      reservedDate = new Date();
    }

    // محاسبه bounding box
    const bbox = calculateBoundingBox(
      { latitude: query.latitude, longitude: query.longitude },
      query.radiusKm,
    );

    const limit = query.limit || 20;

    // استفاده از query بهینه‌شده
    const organizations = await this.searchService.searchOrganizationsWithStationsAndReservations({
      bbox,
      latitude: query.latitude,
      longitude: query.longitude,
      radiusKm: query.radiusKm,
      consoleId: query.consoleId,
      gameId: query.gameId,
      playerCount: query.playerCount,
      reservedDate: getDateOnly(reservedDate),
      limit,
    });

    // محاسبه Iranian day of week یکبار
    const jsDayOfWeek = reservedDate.getDay();
    const iranianDayOfWeek = (jsDayOfWeek + 1) % 7;

    // دریافت working hours برای همه organizations یکجا (batch)
    const orgIds = organizations.map((o) => o.id);
    const workingHoursMap = await this.searchService.getWorkingHoursBatch(
      orgIds,
      iranianDayOfWeek,
    );
    const allWorkingHoursMap = await this.searchService.getAllWorkingHoursBatch(orgIds);

    // پردازش نتایج
    const results = await Promise.all(
      organizations.map(async (org) => {

        // Parse stations (JSON از query)
        let stations = Array.isArray(org.stations) ? org.stations : [];

        // فیلتر استیشن‌های خالی
        stations = stations.filter((s: any) => s.id);

        if (stations.length === 0) {
          return null;
        }

        // محاسبه available slots برای هر استیشن
        const stationsWithSlots = stations.map((station: any) => {
          let availableSlots: any[] = [];

          if (reservedDate) {
            // Parse reservations از JSON
            const reservations = Array.isArray(station.reservations) ? station.reservations : [];

            // تبدیل string dates به Date objects
            const parsedReservations = reservations.map((r: any) => ({
              startTime: new Date(r.startTime),
              endTime: new Date(r.endTime),
            }));

            // تولید تمام time slots
            const allSlots = this.generateDayTimeSlots(reservedDate);

            // فیلتر slot های موجود
            const available = allSlots.filter((slot) => {
              return !parsedReservations.some((reservation: any) => {
                return (
                  slot.startTime < reservation.endTime &&
                  slot.endTime > reservation.startTime
                );
              });
            });

            // چک کردن بازه زمانی مشخص شده
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
                return null; // استیشن در بازه زمانی موجود نیست
              }
            }

            // فرمت کردن slots
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

        // چک کردن working hours
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

        // ساخت workingHours و workingDays
        const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
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
            summary = 'تعطیل';
            todayHours = { startTime: null, endTime: null, is24Hours: false, isClosed: true };
          } else if (todayWorkingHours.is24Hours) {
            summary = '24 ساعته';
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
          summary = '24 ساعته';
          todayHours = { startTime: '00:00', endTime: '24:00', is24Hours: true, isClosed: false };
        }

        // استخراج consoles
        const consoleMap = new Map();
        stations.forEach((s: any) => {
          if (s.consoleId && s.consoleName) {
            consoleMap.set(s.consoleId, { id: s.consoleId, name: s.consoleName });
          }
        });
        const uniqueConsoles = Array.from(consoleMap.values()).sort((a, b) => a.id - b.id);

        // تبدیل فاصله به متر
        const distanceInMeters = Math.round(org.distance * 1000);

        return {
          id: org.id,
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

    // حذف null ها
    let validResults = results.filter((r) => r !== null);


    // فیلتر یا مرتب‌سازی بر اساس isOpen
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
        limit: query.limit || 20,
      },
    };
  }

  /**
   * نسخه قدیمی جستجوی گیم‌نت‌های باز (برای مقایسه و fallback)
   */
  private async searchOpenGamenetsLegacy(query: SearchAvailableGamenetQueryDto) {

    // Validation تاریخ و زمان
    if (query.date && !isValidJalaliDateFormat(query.date)) {
      throw new BadRequestException(
        'فرمت تاریخ نامعتبر است. فرمت صحیح: YYYY/MM/DD',
      );
    }

    if (query.startTime && !isValidTimeFormat(query.startTime)) {
      throw new BadRequestException(
        'فرمت ساعت شروع نامعتبر است. فرمت صحیح: HH:mm',
      );
    }

    if (query.endTime && !isValidTimeFormat(query.endTime)) {
      throw new BadRequestException(
        'فرمت ساعت پایان نامعتبر است. فرمت صحیح: HH:mm',
      );
    }

    // اگر startTime یا endTime داده شده، date هم باید داده شده باشد
    // (چون نمی‌تونیم زمان رو بدون تاریخ چک کنیم)
    if ((query.startTime || query.endTime) && !query.date) {
      throw new BadRequestException(
        'برای تعیین بازه زمانی، باید تاریخ نیز مشخص شود.',
      );
    }

    // تبدیل تاریخ شمسی به میلادی
    // اگر تاریخ ارسال نشده، از امروز استفاده می‌کنیم
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
        Logger.error('خطا در تبدیل تاریخ:', error);
        throw new BadRequestException(
          `خطا در تبدیل تاریخ: ${error.message}`,
        );
      }
    } else {
      // اگر تاریخ ارسال نشده، از امروز استفاده می‌کنیم
      reservedDate = new Date();
    }

    // محاسبه bounding box
    const bbox = calculateBoundingBox(
      { latitude: query.latitude, longitude: query.longitude },
      query.radiusKm,
    );

    const limit = query.limit || 20;

    // جستجوی گیم‌نت‌ها
    const queryConditions: any[] = [
      Prisma.sql`o.latitude BETWEEN ${bbox.minLat} AND ${bbox.maxLat}`,
      Prisma.sql`o.longitude BETWEEN ${bbox.minLon} AND ${bbox.maxLon}`,
      Prisma.sql`o.latitude IS NOT NULL`,
      Prisma.sql`o.longitude IS NOT NULL`,
    ];

    // محاسبه فاصله
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
      LIMIT ${limit}
    `;

    const organizations = await this.prisma.$queryRaw<any[]>(baseQuery);

    // برای هر organization، دریافت استیشن‌ها و availableSlots
    const results = await Promise.all(
      organizations.map(async (org) => {
        // شرایط فیلتر استیشن‌ها
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

        // دریافت استیشن‌ها
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

        // اگر gameId مشخص شده، فقط استیشن‌هایی که این بازی رو دارند
        if (query.gameId) {
          const beforeFilter = stations.length;
          stations = stations.filter(
            (station) => station.stationGames.length > 0,
          );
        }


        // برای هر استیشن، دریافت availableSlots (اگر date مشخص شده)
        const stationsWithSlots = await Promise.all(
          stations.map(async (station) => {
            let availableSlots: any[] = [];

            if (reservedDate) {
              const dateOnly = getDateOnly(reservedDate);

              // دریافت تمام رزروها
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


              // تولید تمام time slots
              const allSlots = this.generateDayTimeSlots(reservedDate);

              // فیلتر slot های موجود
              const available = allSlots.filter((slot) => {
                return !reservations.some((reservation) => {
                  return (
                    slot.startTime < reservation.endTime &&
                    slot.endTime > reservation.startTime
                  );
                });
              });


              // اگر بازه زمانی مشخص شده، چک کنیم که تمام slot های این بازه available باشند
              if (startDateTime && endDateTime) {
                
                // محاسبه تعداد slot های مورد نیاز (هر slot 30 دقیقه است)
                const reqStart = startDateTime.getTime();
                const reqEnd = endDateTime.getTime();
                const slotDuration = 30 * 60 * 1000; // 30 دقیقه به میلی‌ثانیه
                const requiredSlots = Math.floor((reqEnd - reqStart) / slotDuration);


                // چک کردن که آیا تمام slot های این بازه موجود هستند
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


                // اگر تمام slot های بازه زمانی موجود نیستند، این استیشن رو نگه نمی‌داریم
                if (!allSlotsAvailable) {
                  return null;
                }
              }

              // فرمت کردن slots (با timezone تهران)
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

            // فرمت pricings
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

        // حذف استیشن‌های null (که available نبودند)
        const validStations = stationsWithSlots.filter(
          (station) => station !== null,
        );


        // اگر هیچ استیشنی موجود نیست، این organization رو برنمی‌گردونیم
        if (validStations.length === 0) {
          return null;
        }

        // دریافت working hours و working days
        const workingHoursData = await this.getOrganizationWorkingHours(
          org.id,
          reservedDate,
        );

        // چک کردن working hours برای تعیین isOpen
        // اگر startTime مشخص شده، از اون استفاده می‌کنیم (چک روز + ساعت)
        // در غیر این صورت، فقط روز هفته رو چک می‌کنیم (چک روز فقط)
        let isOpen = true;


        if (startDateTime) {
          // اگر زمان مشخص شده، هم روز و هم ساعت رو چک می‌کنیم
          isOpen = await this.checkOrganizationWorkingHours(
            org.id,
            reservedDate,
            startDateTime,
          );
        } else {
          // اگر زمان مشخص نشده، فقط روز هفته رو چک می‌کنیم
          isOpen = await this.checkOrganizationWorkingHoursByDayOnly(
            org.id,
            reservedDate,
          );
        }


        // استخراج consoles از stations
        // باید از stations اصلی استفاده کنیم نه validStations (چون validStations ممکنه فیلتر شده باشه)
        const uniqueConsoles = this.extractConsolesFromStations(stations);


        // تبدیل فاصله از کیلومتر به متر
        const distanceInMeters = Math.round(org.distance * 1000);

        return {
          id: org.id,
          name: org.name,
          logoImage: org.logoImage || null,
          indexImage: org.indexImage || null,
          rating: null, // فعلاً null - بعداً از reviews محاسبه می‌شه
          distance: distanceInMeters, // فاصله به متر
          distanceUnit: 'm', // متر
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

    // حذف organization های null
    let validResults = results.filter((result) => result !== null);


    // اگر تاریخ و ساعت داده شده، فقط گیم‌نت‌های باز رو نشون بده
    if (startDateTime && endDateTime) {
      const beforeFilter = validResults.length;
      validResults = validResults.filter((org) => org.isOpen === true);
    } else {
      // اگر تاریخ و ساعت داده نشده، همه رو نشون بده ولی مرتب‌سازی کن
      // اول بازها (نزدیک‌ترین اول)، بعد بسته‌ها

      validResults.sort((a, b) => {
        // اول بر اساس isOpen (بازها اول)
        if (a.isOpen !== b.isOpen) {
          return a.isOpen ? -1 : 1; // true (باز) اول میاد
        }
        // اگر هر دو باز یا هر دو بسته هستند، بر اساس فاصله مرتب کن
        return a.distance - b.distance;
      });
    }


    return {
      organizations: validResults,
      meta: {
        total: validResults.length,
        page: 1, // فعلاً pagination نداریم
        limit: query.limit || 20,
      },
    };
  }

  /**
   * چک کردن working hours یک organization
   */
  private async checkOrganizationWorkingHours(
    organizationId: number,
    date: Date,
    time: Date,
  ): Promise<boolean> {
    // دریافت روز هفته
    // در JS: 0=یکشنبه, 1=دوشنبه, 2=سه‌شنبه, 3=چهارشنبه, 4=پنج‌شنبه, 5=جمعه, 6=شنبه
    // در سیستم ایرانی: 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
    const jsDayOfWeek = date.getDay();
    // تبدیل: JS 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→0
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
      return true; // اگر تعریف نشده، فرض می‌کنیم باز است
    }

    if (workingHours.isClosed) {
      return false; // تعطیل است
    }

    if (workingHours.is24Hours) {
      return true; // 24 ساعته باز است
    }

    // چک کردن بازه زمانی
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
   * چک کردن working hours یک organization فقط بر اساس روز هفته (بدون ساعت)
   */
  private async checkOrganizationWorkingHoursByDayOnly(
    organizationId: number,
    date: Date,
  ): Promise<boolean> {
    // دریافت روز هفته
    // در JS: 0=یکشنبه, 1=دوشنبه, 2=سه‌شنبه, 3=چهارشنبه, 4=پنج‌شنبه, 5=جمعه, 6=شنبه
    // در سیستم ایرانی: 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
    const jsDayOfWeek = date.getDay();
    // تبدیل: JS 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→0
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
      return true; // اگر تعریف نشده، فرض می‌کنیم باز است
    }

    if (workingHours.isClosed) {
      return false; // تعطیل است
    }

    // اگر تعطیل نیست، باز است (بدون چک ساعت)
    return true;
  }

  /**
   * دریافت working hours و working days یک organization
   */
  private async getOrganizationWorkingHours(organizationId: number, date: Date) {
    // دریافت روز هفته
    // در JS: 0=یکشنبه, 1=دوشنبه, 2=سه‌شنبه, 3=چهارشنبه, 4=پنج‌شنبه, 5=جمعه, 6=شنبه
    // در سیستم ایرانی: 0=شنبه, 1=یکشنبه, 2=دوشنبه, 3=سه‌شنبه, 4=چهارشنبه, 5=پنج‌شنبه, 6=جمعه
    const jsDayOfWeek = date.getDay();
    // تبدیل: JS 0→1, 1→2, 2→3, 3→4, 4→5, 5→6, 6→0
    const iranianDayOfWeek = (jsDayOfWeek + 1) % 7;

    // دریافت working hours برای امروز
    const todayWorkingHours =
      await this.prisma.organizationWorkingHours.findUnique({
        where: {
          organizationId_dayOfWeek: {
            organizationId,
            dayOfWeek: iranianDayOfWeek,
          },
        },
      });

    // دریافت تمام working hours
    const allWorkingHours =
      await this.prisma.organizationWorkingHours.findMany({
        where: { organizationId },
        orderBy: { dayOfWeek: 'asc' },
      });

    // نام روزهای هفته
    const dayNames = [
      'شنبه',
      'یکشنبه',
      'دوشنبه',
      'سه‌شنبه',
      'چهارشنبه',
      'پنج‌شنبه',
      'جمعه',
    ];

    // ساخت working days (7 روز هفته)
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
        isWorking: wh ? !wh.isClosed : true, // اگر تعریف نشده، فرض می‌کنیم باز است
      });
    }

    // ساخت working hours برای today
    let todayHours: {
      startTime: string | null;
      endTime: string | null;
      is24Hours: boolean;
      isClosed: boolean;
    } | null = null;
    let summary = '';

    if (todayWorkingHours) {
      if (todayWorkingHours.isClosed) {
        summary = 'تعطیل';
        todayHours = {
          startTime: null,
          endTime: null,
          is24Hours: false,
          isClosed: true,
        };
      } else if (todayWorkingHours.is24Hours) {
        summary = '24 ساعته';
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
      // اگر تعریف نشده، فرض می‌کنیم 24 ساعته باز است
      summary = '24 ساعته';
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
   * استخراج consoles منحصر به فرد از stations
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
}

