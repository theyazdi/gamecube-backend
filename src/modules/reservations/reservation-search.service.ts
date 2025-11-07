import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Prisma } from '../../generated/client';
import { Logger } from '../../shared/utils/logger.util';

/**
 * Service بهینه‌شده برای جستجوی reservations
 * این service از Raw SQL بهینه استفاده می‌کند تا N+1 Problem را حل کند
 */
@Injectable()
export class ReservationSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * جستجوی بهینه‌شده organizations با استیشن‌ها و رزروها در یک query
   */
  async searchOrganizationsWithStationsAndReservations(params: {
    bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number };
    latitude: number;
    longitude: number;
    radiusKm: number;
    consoleId?: number;
    gameId?: number;
    playerCount?: number;
    reservedDate?: Date;
    limit: number;
  }) {
    const {
      bbox,
      latitude,
      longitude,
      radiusKm,
      consoleId,
      gameId,
      playerCount,
      reservedDate,
      limit,
    } = params;


    // Query یکپارچه که همه چیز را در یک بار دریافت می‌کند
    const query = Prisma.sql`
      WITH orgs_with_distance AS (
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
          (
            6371 * acos(
              cos(radians(${latitude})) *
              cos(radians(o.latitude::float)) *
              cos(radians(o.longitude::float) - radians(${longitude})) +
              sin(radians(${latitude})) *
              sin(radians(o.latitude::float))
            )
          ) AS distance
        FROM organizations o
        WHERE o.latitude BETWEEN ${bbox.minLat} AND ${bbox.maxLat}
          AND o.longitude BETWEEN ${bbox.minLon} AND ${bbox.maxLon}
          AND o.latitude IS NOT NULL
          AND o.longitude IS NOT NULL
      ),
      nearby_orgs AS (
        SELECT *
        FROM orgs_with_distance
        WHERE distance < ${radiusKm}
        ORDER BY distance
        LIMIT ${limit}
      ),
      org_stations AS (
        SELECT
          s.id as station_id,
          s."organizationId" as organization_id,
          s.title as station_title,
          s."consoleId",
          s.capacity,
          s.status,
          c.id as console_id,
          c.name as console_name,
          c.category as console_category
        FROM stations s
        INNER JOIN nearby_orgs no ON s."organizationId" = no.id
        INNER JOIN consoles c ON s."consoleId" = c.id
        WHERE s."isActive" = true
          AND s."isAccepted" = true
          AND s."deletedAt" IS NULL
          ${consoleId ? Prisma.sql`AND s."consoleId" = ${consoleId}` : Prisma.empty}
          ${playerCount ? Prisma.sql`AND s.capacity >= ${playerCount}` : Prisma.empty}
          ${gameId ? Prisma.sql`AND EXISTS (
            SELECT 1 
            FROM station_games sg 
            WHERE sg."stationId" = s.id 
            AND sg."gameId" = ${gameId}
          )` : Prisma.empty}
      ),
      station_pricings AS (
        SELECT
          sp."stationId" as station_id,
          json_agg(
            json_build_object(
              'playerCount', sp."playerCount",
              'price', sp.price
            )
            ORDER BY sp."playerCount"
          ) as pricings
        FROM station_pricings sp
        INNER JOIN org_stations os ON sp."stationId" = os.station_id
        ${playerCount ? Prisma.sql`WHERE sp."playerCount" = ${playerCount}` : Prisma.empty}
        GROUP BY sp."stationId"
      ),
      station_games AS (
        SELECT
          sg."stationId" as station_id,
          json_agg(
            json_build_object(
              'id', g.id,
              'title', g.title,
              'coverImage', g."coverImage"
            )
          ) as games
        FROM station_games sg
        INNER JOIN org_stations os ON sg."stationId" = os.station_id
        INNER JOIN games g ON sg."gameId" = g.id
          ${gameId ? Prisma.sql`WHERE sg."gameId" = ${gameId}` : Prisma.empty}
        GROUP BY sg."stationId"
      ),
      station_reservations AS (
        SELECT
          r."stationId" as station_id,
          json_agg(
            json_build_object(
              'startTime', r."startTime",
              'endTime', r."endTime"
            )
            ORDER BY r."startTime"
          ) as reservations
        FROM reservations r
        INNER JOIN org_stations os ON r."stationId" = os.station_id
        WHERE r."reservedDate" = ${reservedDate || new Date()}
        GROUP BY r."stationId"
      )
      SELECT
        no.id,
        no.uuid,
        no.name,
        no.address,
        no."phoneNumber",
        no.province,
        no.city,
        no.latitude,
        no.longitude,
        no."indexImage",
        no."logoImage",
        no.distance,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', os.station_id,
              'title', os.station_title,
              'consoleId', os."consoleId",
              'consoleName', os.console_name,
              'consoleCategory', os.console_category,
              'capacity', os.capacity,
              'status', os.status,
              'pricings', COALESCE(sp.pricings, '[]'::json),
              'games', COALESCE(sg.games, '[]'::json),
              'reservations', COALESCE(sr.reservations, '[]'::json)
            )
          ) FILTER (WHERE os.station_id IS NOT NULL),
          '[]'::json
        ) as stations
      FROM nearby_orgs no
      LEFT JOIN org_stations os ON os.organization_id = no.id
      LEFT JOIN station_pricings sp ON sp.station_id = os.station_id
      LEFT JOIN station_games sg ON sg.station_id = os.station_id
      LEFT JOIN station_reservations sr ON sr.station_id = os.station_id
      GROUP BY no.id, no.uuid, no.name, no.address, no."phoneNumber",
               no.province, no.city, no.latitude, no.longitude,
               no."indexImage", no."logoImage", no.distance
      ORDER BY no.distance
    `;

    const startTime = Date.now();
    const results = await this.prisma.$queryRaw<any[]>(query);
    const queryTime = Date.now() - startTime;


    return results;
  }

  /**
   * دریافت working hours برای چندین organization به صورت یکجا (batch)
   */
  async getWorkingHoursBatch(organizationIds: number[], dayOfWeek: number) {
    if (organizationIds.length === 0) return new Map();

    const workingHours = await this.prisma.organizationWorkingHours.findMany({
      where: {
        organizationId: { in: organizationIds },
        dayOfWeek,
      },
      select: {
        organizationId: true,
        dayOfWeek: true,
        isClosed: true,
        is24Hours: true,
        startTime: true,
        endTime: true,
      },
    });

    // تبدیل به Map برای دسترسی سریع
    const map = new Map();
    workingHours.forEach((wh) => {
      map.set(wh.organizationId, wh);
    });

    return map;
  }

  /**
   * دریافت تمام working hours برای چندین organization
   */
  async getAllWorkingHoursBatch(organizationIds: number[]) {
    if (organizationIds.length === 0) return new Map();

    const allWorkingHours = await this.prisma.organizationWorkingHours.findMany({
      where: {
        organizationId: { in: organizationIds },
      },
      select: {
        organizationId: true,
        dayOfWeek: true,
        isClosed: true,
        is24Hours: true,
        startTime: true,
        endTime: true,
      },
      orderBy: {
        dayOfWeek: 'asc',
      },
    });

    // تبدیل به Map: organizationId -> array of working hours
    const map = new Map<number, any[]>();
    allWorkingHours.forEach((wh) => {
      if (!map.has(wh.organizationId)) {
        map.set(wh.organizationId, []);
      }
      map.get(wh.organizationId)!.push(wh);
    });

    return map;
  }
}
