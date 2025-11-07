import * as jalaali from 'jalaali-js';

/**
 * تبدیل اعداد فارسی به انگلیسی
 * @param text متن شامل اعداد فارسی
 * @returns متن با اعداد انگلیسی
 */
export function convertPersianToEnglishNumbers(text: string): string {
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const englishNumbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  let result = text;

  // تبدیل اعداد فارسی
  for (let i = 0; i < persianNumbers.length; i++) {
    result = result.replace(
      new RegExp(persianNumbers[i], 'g'),
      englishNumbers[i],
    );
  }

  // تبدیل اعداد عربی
  for (let i = 0; i < arabicNumbers.length; i++) {
    result = result.replace(
      new RegExp(arabicNumbers[i], 'g'),
      englishNumbers[i],
    );
  }

  return result;
}

/**
 * تبدیل تاریخ شمسی به میلادی
 * @param jalaliDate تاریخ شمسی به فرمت YYYY/MM/DD (مثال: 1403/09/15 یا ۱۴۰۳/۰۹/۱۵)
 * @returns تاریخ میلادی (Date object)
 */
export function jalaliToGregorian(jalaliDate: string): Date {
  // تبدیل اعداد فارسی به انگلیسی
  const normalizedDate = convertPersianToEnglishNumbers(jalaliDate);

  // Parse تاریخ شمسی
  const parts = normalizedDate.split('/');
  if (parts.length !== 3) {
    throw new Error('فرمت تاریخ نامعتبر است. فرمت صحیح: YYYY/MM/DD');
  }

  const jYear = parseInt(parts[0], 10);
  const jMonth = parseInt(parts[1], 10);
  const jDay = parseInt(parts[2], 10);

  if (isNaN(jYear) || isNaN(jMonth) || isNaN(jDay)) {
    throw new Error('تاریخ شمسی شامل اعداد نامعتبر است.');
  }

  if (jMonth < 1 || jMonth > 12) {
    throw new Error('ماه باید بین 1 تا 12 باشد.');
  }

  if (jDay < 1 || jDay > 31) {
    throw new Error('روز باید بین 1 تا 31 باشد.');
  }

  // تبدیل به میلادی
  const gregorian = jalaali.toGregorian(jYear, jMonth, jDay);

  // ساخت Date object با timezone تهران (UTC+3:30)
  // ابتدا با UTC می‌سازیم، بعد timezone تهران رو اعمال می‌کنیم
  const date = new Date(
    Date.UTC(gregorian.gy, gregorian.gm - 1, gregorian.gd, 0, 0, 0, 0),
  );
  
  // تبدیل به timezone تهران (UTC+3:30 = 3.5 ساعت)
  // برای اینکه تاریخ درست باشه، باید 3.5 ساعت از UTC کم کنیم
  const tehranOffset = 3.5 * 60 * 60 * 1000; // 3.5 ساعت به میلی‌ثانیه
  const tehranDate = new Date(date.getTime() - tehranOffset);

  return tehranDate;
}

/**
 * ترکیب تاریخ و زمان
 * @param date تاریخ (Date object)
 * @param timeString زمان به فرمت HH:mm (مثال: 14:30 یا ۱۴:۳۰)
 * @returns DateTime کامل
 */
export function combineDateAndTime(date: Date, timeString: string): Date {
  // تبدیل اعداد فارسی به انگلیسی
  const normalizedTime = convertPersianToEnglishNumbers(timeString);

  // Parse زمان
  const parts = normalizedTime.split(':');
  if (parts.length !== 2) {
    throw new Error('فرمت زمان نامعتبر است. فرمت صحیح: HH:mm');
  }

  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);

  if (isNaN(hours) || isNaN(minutes)) {
    throw new Error('زمان شامل اعداد نامعتبر است.');
  }

  if (hours < 0 || hours > 23) {
    throw new Error('ساعت باید بین 0 تا 23 باشد.');
  }

  if (minutes < 0 || minutes > 59) {
    throw new Error('دقیقه باید بین 0 تا 59 باشد.');
  }

  // ساخت DateTime جدید با timezone تهران
  // date قبلاً با timezone تهران هست، پس فقط ساعت و دقیقه رو set می‌کنیم
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);

  return dateTime;
}

/**
 * تبدیل تاریخ شمسی و زمان به DateTime میلادی
 * @param jalaliDate تاریخ شمسی (مثال: 1403/09/15)
 * @param timeString زمان (مثال: 14:30)
 * @returns DateTime میلادی کامل
 */
export function jalaliDateTimeToGregorian(
  jalaliDate: string,
  timeString: string,
): Date {
  const date = jalaliToGregorian(jalaliDate);
  return combineDateAndTime(date, timeString);
}

/**
 * چک کردن اعتبار فرمت تاریخ شمسی (پشتیبانی از اعداد فارسی و انگلیسی)
 */
export function isValidJalaliDateFormat(dateString: string): boolean {
  // تبدیل اعداد فارسی به انگلیسی برای چک کردن
  const normalized = convertPersianToEnglishNumbers(dateString);
  const regex = /^\d{4}\/\d{2}\/\d{2}$/;
  return regex.test(normalized);
}

/**
 * چک کردن اعتبار فرمت زمان (پشتیبانی از اعداد فارسی و انگلیسی)
 */
export function isValidTimeFormat(timeString: string): boolean {
  // تبدیل اعداد فارسی به انگلیسی برای چک کردن
  const normalized = convertPersianToEnglishNumbers(timeString);
  const regex = /^\d{2}:\d{2}$/;
  return regex.test(normalized);
}

