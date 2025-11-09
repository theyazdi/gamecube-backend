import * as jalaali from 'jalaali-js';

/**
 * Convert Persian numbers to English
 * @param text Text containing Persian numbers
 * @returns Text with English numbers
 */
export function convertPersianToEnglishNumbers(text: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = text;

  // Convert Persian numbers
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(
      new RegExp(persianNumbers[i], 'g'),
      englishNumbers[i],
    );
  }

  // Convert Arabic numbers
  for (let i = 0; i < arabicNumbers.length; i++) {
    result = result.replace(
      new RegExp(arabicNumbers[i], 'g'),
      englishNumbers[i],
    );
  }

  return result;
}

/**
 * Convert Jalali date to Gregorian
 * @param jalaliDate Jalali date in format YYYY/MM/DD (e.g. 1403/09/15 or ۱۴۰۳/۰۹/۱۵)
 * @returns Gregorian date (Date object)
 */
export function jalaliToGregorian(jalaliDate: string): Date {
  // Convert Persian numbers to English
  const normalizedDate = convertPersianToEnglishNumbers(jalaliDate);

  // Parse Jalali date
  const parts = normalizedDate.split('/');
  if (parts.length !== 3) {
    throw new Error('Invalid date format. Correct format: YYYY/MM/DD');
  }

  const jYear = parseInt(parts[0], 10);
  const jMonth = parseInt(parts[1], 10);
  const jDay = parseInt(parts[2], 10);

  if (isNaN(jYear) || isNaN(jMonth) || isNaN(jDay)) {
    throw new Error('Jalali date contains invalid numbers.');
  }

  if (jMonth < 1 || jMonth > 12) {
    throw new Error('Month must be between 1 and 12.');
  }

  if (jDay < 1 || jDay > 31) {
    throw new Error('Day must be between 1 and 31.');
  }

  // Convert to Gregorian
  const gregorian = jalaali.toGregorian(jYear, jMonth, jDay);

  // Create Date object with Tehran timezone (UTC+3:30)
  // First create with UTC, then apply Tehran timezone
  const date = new Date(
    Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd, 0, 0, 0, 0),
  );
  
  // Convert to Tehran timezone (UTC+3:30 = 3.5 hours)
  // To get the correct date, we need to subtract 3.5 hours from UTC
  const tehranOffset = 3.5 * 60 * 60 * 1000; // 3.5 hours in milliseconds
  const tehranDate = new Date(date.getTime() - tehranOffset);

  return tehranDate;
}

/**
 * Combine date and time
 * @param date Date (Date object)
 * @param timeString Time in format HH:mm (e.g. 14:30 or ۱۴:۳۰)
 * @returns Complete DateTime
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
  // Convert Persian numbers to English
  const normalizedTime = convertPersianToEnglishNumbers(timeString);

  // Parse time
  const parts = normalizedTime.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid time format. Correct format: HH:mm');
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('Time contains invalid numbers.');
  }

  if (hours < 0 || hours > 23) {
    throw new Error('Hours must be between 0 and 23.');
  }

  if (minutes < 0 || minutes > 59) {
    throw new Error('Minutes must be between 0 and 59.');
  }

  // Create new DateTime with Tehran timezone
  // date already has Tehran timezone, so we only set hours and minutes
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);

  return dateTime;
}

/**
 * Convert Jalali date and time to Gregorian DateTime
 * @param jalaliDate Jalali date (e.g. 1403/09/15)
 * @param timeString Time (e.g. 14:30)
 * @returns Complete Gregorian DateTime
 */
export function jalaliDateTimeToGregorian(
  jalaliDate: string,
  timeString: string,
): Date {
  const date = jalaliToGregorian(jalaliDate);
  return combineDateAndTime(date, timeString);
}

/**
 * Check validity of Jalali date format (supports Persian and English numbers)
 */
export function isValidJalaliDateFormat(dateString: string): boolean {
  // Convert Persian numbers to English for checking
  const normalized = convertPersianToEnglishNumbers(dateString);
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  return regex.test(normalized);
}

/**
 * Check validity of time format (supports Persian and English numbers)
 */
export function isValidTimeFormat(timeString: string): boolean {
  // Convert Persian numbers to English for checking
  const normalized = convertPersianToEnglishNumbers(timeString);
  const regex = /^\d{2}:\d{2}$/;
  return regex.test(normalized);
}

