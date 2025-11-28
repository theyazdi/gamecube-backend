import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { Prisma } from '../../generated/client';
import { Logger } from '../../shared/utils/logger.util';

/**
 * Optimized service for searching reservations
 * This service uses optimized Raw SQL to solve N+1 Problem
 */
@Injectable()
export class ReservationSearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Optimized search for organizations with stations and reservations in one query
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
    } = params;


    // Unified query that fetches everything in one go
    const query = Prisma.sql`
      WITH orgs_with_distance AS (
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
          c.category as console_category,
          -- Mark if station matches console filter (for availability check)
          CASE WHEN ${consoleId ? Prisma.sql`s."consoleId" = ${consoleId}` : Prisma.sql`true`} THEN true ELSE false END as matches_console_filter
        FROM stations s
        INNER JOIN nearby_orgs no ON s."organizationId" = no.id
        INNER JOIN consoles c ON s."consoleId" = c.id
        WHERE s."isActive" = true
          AND s."isAccepted" = true
          AND s."deletedAt" IS NULL
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
        no.username,
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
              'matchesConsoleFilter', os.matches_console_filter,
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
      GROUP BY no.id, no.uuid, no.name, no.username, no.address, no."phoneNumber",
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
   * Get working hours for multiple organizations at once (batch)
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

    // Convert to Map for fast access
    const map = new Map();
    workingHours.forEach((wh) => {
      map.set(wh.organizationId, wh);
    });

    return map;
  }

  /**
   * Get all working hours for multiple organizations
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

    // Convert to Map: organizationId -> array of working hours
    const map = new Map<number, any[]>();
    allWorkingHours.forEach((wh) => {
      if (!map.has(wh.organizationId)) {
        map.set(wh.organizationId, []);
      }
      map.get(wh.organizationId)!.push(wh);
    });

    return map;
  }

  /**
   * Optimized search for available stations with a single query
   * This method is designed for high-traffic endpoint and uses a highly optimized Raw SQL
   *
   * @param params Search parameters including consoleId, gameId, playerCount and reservation time
   * @returns List of available stations with pricing and game information
   */
  async searchAvailableStationsOptimized(params: {
    username: string;
    consoleId: number;
    gameId?: number;
    playerCount?: number;
    reservedDate: Date;
    startTime: string;
    endTime: string;
  }) {
    const {
      username,
      consoleId,
      gameId,
      playerCount,
      reservedDate,
      startTime: reqStartTime,
      endTime: reqEndTime,
    } = params;

    // Highly optimized query that fetches all data at once using CTEs and JSON aggregation
    const query = Prisma.sql`
      WITH eligible_stations AS (
        -- Filter suitable stations with initial conditions
        SELECT
          s.id as station_id,
          s."organizationId",
          s.title as station_title,
          s."consoleId",
          s.capacity,
          s.status,
          c.id as console_id,
          c.name as console_name,
          c.category as console_category
        FROM stations s
        INNER JOIN consoles c ON s."consoleId" = c.id
        INNER JOIN organizations o ON s."organizationId" = o.id
        WHERE o.username = ${username}
          AND s."consoleId" = ${consoleId}
          AND s."isActive" = true
          AND s."isAccepted" = true
          AND s."deletedAt" IS NULL
          ${playerCount ? Prisma.sql`AND s.capacity >= ${playerCount}` : Prisma.empty}
          ${gameId ? Prisma.sql`AND EXISTS (
            SELECT 1
            FROM station_games sg
            WHERE sg."stationId" = s.id
            AND sg."gameId" = ${gameId}
          )` : Prisma.empty}
      ),
      -- Get existing reservations for specified date
      station_reservations AS (
        SELECT
          r."stationId" as station_id,
          json_agg(
            json_build_object(
              'startTime', to_char(r."startTime", 'HH24:MI'),
              'endTime', to_char(r."endTime", 'HH24:MI')
            )
            ORDER BY r."startTime"
          ) as reservations
        FROM reservations r
        INNER JOIN eligible_stations es ON r."stationId" = es.station_id
        WHERE r."reservedDate" = ${reservedDate}
          -- Check that reservation overlaps with requested time range
          AND (
            to_char(r."startTime", 'HH24:MI') < ${reqEndTime}
            AND to_char(r."endTime", 'HH24:MI') > ${reqStartTime}
          )
        GROUP BY r."stationId"
      ),
      -- Get station pricing
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
        INNER JOIN eligible_stations es ON sp."stationId" = es.station_id
        ${playerCount ? Prisma.sql`WHERE sp."playerCount" = ${playerCount}` : Prisma.empty}
        GROUP BY sp."stationId"
      ),
      -- Get games available in station
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
        INNER JOIN eligible_stations es ON sg."stationId" = es.station_id
        INNER JOIN games g ON sg."gameId" = g.id
        ${gameId ? Prisma.sql`WHERE sg."gameId" = ${gameId}` : Prisma.empty}
        GROUP BY sg."stationId"
      ),
      -- Get organization information
      org_info AS (
        SELECT
          o.id as org_id,
          o.uuid as org_uuid,
          o.name as org_name,
          o.username as org_username,
          o.address as org_address,
          o."phoneNumber" as org_phone,
          o.province as org_province,
          o.city as org_city,
          o.latitude as org_latitude,
          o.longitude as org_longitude,
          o."indexImage" as org_index_image,
          o."logoImage" as org_logo_image
        FROM organizations o
        WHERE EXISTS (
          SELECT 1 FROM eligible_stations es WHERE es."organizationId" = o.id
        )
      )
      -- Final data combination
      SELECT
        es.station_id,
        es.station_title,
        es."consoleId",
        es.console_name,
        es.console_category,
        es.capacity,
        es.status,
        -- Organization information
        oi.org_id,
        oi.org_uuid,
        oi.org_name,
        oi.org_username,
        oi.org_address,
        oi.org_phone,
        oi.org_province,
        oi.org_city,
        oi.org_latitude,
        oi.org_longitude,
        oi.org_index_image,
        oi.org_logo_image,
        -- JSON aggregated data
        COALESCE(sp.pricings, '[]'::json) as pricings,
        COALESCE(sg.games, '[]'::json) as games,
        COALESCE(sr.reservations, '[]'::json) as reservations,
        -- Availability flag (if no reservation, it's available)
        CASE WHEN sr.station_id IS NULL THEN true ELSE false END as is_available
      FROM eligible_stations es
      INNER JOIN org_info oi ON es."organizationId" = oi.org_id
      LEFT JOIN station_pricings sp ON sp.station_id = es.station_id
      LEFT JOIN station_games sg ON sg.station_id = es.station_id
      LEFT JOIN station_reservations sr ON sr.station_id = es.station_id
      -- Only return available stations
      WHERE sr.station_id IS NULL
      ORDER BY oi.org_name, es.station_title
    `;

    const perfStartTime = Date.now();
    const results = await this.prisma.$queryRaw<any[]>(query);
    const queryTime = Date.now() - perfStartTime;

    console.log(
      `[PERFORMANCE] searchAvailableStationsOptimized executed in ${queryTime}ms - Found ${results.length} available stations`,
    );

    return results;
  }
}
