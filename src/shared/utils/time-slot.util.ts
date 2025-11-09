/**
 * ابزارهای مدیریت بازه‌های زمانی (Time Slots)
 */

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  label: string; // مثال: "16:00 - 16:30"
}

export interface TimeRange {
  start: Date;
  end: Date;
}

/**
 * تولید تمام time slot های نیم ساعته برای یک روز مشخص
 * @param date تاریخ (ساعت نادیده گرفته می‌شود)
 * @returns آرایه‌ای از time slot های نیم ساعته
 */
export function generateTimeSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const baseDate = new Date(date);
  baseDate.setHours(0, 0, 0, 0);

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const startTime = new Date(baseDate);
      startTime.setHours(hour, minute, 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);

      const label = `${formatTime(startTime)} - ${formatTime(endTime)}`;

      slots.push({ startTime, endTime, label });
    }
  }

  return slots;
}

/**
 * تولید time slot های نیم ساعته در یک بازه زمانی مشخص
 * @param date تاریخ
 * @param startHour ساعت شروع (0-23)
 * @param endHour ساعت پایان (0-24)
 * @returns آرایه‌ای از time slot ها
 */
export function generateTimeSlotsInRange(
  date: Date,
  startHour: number,
  endHour: number,
): TimeSlot[] {
  const allSlots = generateTimeSlots(date);

  return allSlots.filter((slot) => {
    const hour = slot.startTime.getHours();
    return hour >= startHour && hour < endHour;
  });
}

/**
 * فرمت کردن زمان به صورت HH:MM
 */
function formatTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * چک کردن تداخل بین دو بازه زمانی
 * @returns true اگر تداخل وجود داشته باشد
 */
export function hasTimeOverlap(range1: TimeRange, range2: TimeRange): boolean {
  return range1.start < range2.end && range1.end > range2.start;
}

/**
 * چک کردن اینکه آیا یک بازه زمانی در داخل بازه دیگری قرار دارد
 */
export function isTimeRangeWithin(
  inner: TimeRange,
  outer: TimeRange,
): boolean {
  return inner.start >= outer.start && inner.end <= outer.end;
}

/**
 * Parse کردن رشته زمان "HH:MM" و ترکیب با تاریخ
 */
export function parseTimeString(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);

  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time format: ${timeString}`);
  }

  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);

  return result;
}

/**
 * تبدیل Date به تاریخ بدون ساعت (برای reservedDate)
 * استفاده از timezone تهران (UTC+3:30)
 */
export function getDateOnly(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  result.setMilliseconds(0);
  return result;
}

/**
 * چک کردن اینکه آیا یک time slot معتبر است (نیم ساعته و راس ساعت یا نیم)
 */
export function isValidTimeSlot(start: Date, end: Date): boolean {
  // اختلاف باید 30 دقیقه باشد
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  if (diffMinutes !== 30) {
    return false;
  }

  // دقیقه شروع باید 0 یا 30 باشد
  const startMinutes = start.getMinutes();
  if (startMinutes !== 0 && startMinutes !== 30) {
    return false;
  }

  // ثانیه و میلی‌ثانیه باید 0 باشند
  if (start.getSeconds() !== 0 || start.getMilliseconds() !== 0) {
    return false;
  }

  return true;
}

/**
 * گرفتن نزدیک‌ترین time slot معتبر
 */
export function getNearestTimeSlot(date: Date): TimeSlot {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();

  // Round to nearest 30 minutes
  if (minutes < 15) {
    rounded.setMinutes(0, 0, 0);
  } else if (minutes < 45) {
    rounded.setMinutes(30, 0, 0);
  } else {
    rounded.setHours(rounded.getHours() + 1, 0, 0, 0);
  }

  const startTime = rounded;
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + 30);

  return {
    startTime,
    endTime,
    label: `${formatTime(startTime)} - ${formatTime(endTime)}`,
  };
}

/**
 * محاسبه تعداد time slot های بین دو زمان
 */
export function countTimeSlotsBetween(start: Date, end: Date): number {
  const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
  return Math.floor(diffMinutes / 30);
}

/**
 * چک کردن اینکه آیا یک تاریخ در گذشته است
 */
export function isPastDate(date: Date): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);

  return compareDate < now;
}

/**
 * چک کردن اینکه آیا یک زمان در گذشته است
 * @param dateTime زمان برای بررسی
 * @param toleranceMinutes تعداد دقیقه‌ای که اجازه می‌دهیم زمان گذشته باشد (پیش‌فرض: 0)
 */
export function isPastTime(dateTime: Date, toleranceMinutes: number = 0): boolean {
  const now = new Date();
  const thresholdTime = new Date(now.getTime() - toleranceMinutes * 60 * 1000);
  return dateTime < thresholdTime;
}

