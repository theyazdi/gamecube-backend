/**
 * ابزارهای محاسبات جغرافیایی
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

/**
 * محاسبه فاصله بین دو نقطه با فرمول Haversine
 * @param point1 نقطه اول (latitude, longitude)
 * @param point2 نقطه دوم (latitude, longitude)
 * @returns فاصله به کیلومتر
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates,
): number {
  const R = 6371; // شعاع زمین به کیلومتر

  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) *
      Math.cos(toRadians(point2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * تبدیل درجه به رادیان
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * محاسبه مربع محدود کننده (Bounding Box) برای فیلتر اولیه
 * @param center مرکز (latitude, longitude)
 * @param radiusKm شعاع به کیلومتر
 * @returns مختصات مربع محدود کننده
 */
export function calculateBoundingBox(
  center: Coordinates,
  radiusKm: number,
): BoundingBox {
  // تقریباً 111.32 کیلومتر در هر درجه latitude
  const latDelta = radiusKm / 111.32;

  // برای longitude باید cosine عرض جغرافیایی را در نظر بگیریم
  const lonDelta =
    radiusKm / (111.32 * Math.cos(toRadians(center.latitude)));

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  };
}

/**
 * چک کردن اینکه آیا یک نقطه در محدوده bounding box قرار دارد
 */
export function isInBoundingBox(
  point: Coordinates,
  bbox: BoundingBox,
): boolean {
  return (
    point.latitude >= bbox.minLat &&
    point.latitude <= bbox.maxLat &&
    point.longitude >= bbox.minLon &&
    point.longitude <= bbox.maxLon
  );
}

/**
 * مرتب‌سازی لیست مکان‌ها بر اساس فاصله از یک نقطه
 */
export function sortByDistance<T extends Coordinates>(
  locations: T[],
  center: Coordinates,
): (T & { distance: number })[] {
  return locations
    .map((location) => ({
      ...location,
      distance: calculateDistance(center, location),
    }))
    .sort((a, b) => a.distance - b.distance);
}

/**
 * فیلتر کردن مکان‌هایی که در شعاع مشخص قرار دارند
 */
export function filterByRadius<T extends Coordinates>(
  locations: T[],
  center: Coordinates,
  radiusKm: number,
): (T & { distance: number })[] {
  return locations
    .map((location) => ({
      ...location,
      distance: calculateDistance(center, location),
    }))
    .filter((location) => location.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance);
}

