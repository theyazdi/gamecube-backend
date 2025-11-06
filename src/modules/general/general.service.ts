import { Injectable } from '@nestjs/common';
import { toJalaali, toGregorian } from 'jalaali-js';

@Injectable()
export class GeneralService {
  /**
   * Get current date and time in Tehran timezone with Persian (Jalaali) calendar
   */
  getPersianDateTime() {
    // Get current time in Tehran timezone (UTC+3:30)
    const now = new Date();
    const tehranOffset = 3.5 * 60; // Tehran is UTC+3:30
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const tehranTime = new Date(utc + tehranOffset * 60000);

    // Convert to Jalaali (Persian) calendar
    const gregorianDate = {
      gy: tehranTime.getFullYear(),
      gm: tehranTime.getMonth() + 1,
      gd: tehranTime.getDate(),
    };

    const jalaali = toJalaali(gregorianDate.gy, gregorianDate.gm, gregorianDate.gd);

    // Format time
    const hours = String(tehranTime.getHours()).padStart(2, '0');
    const minutes = String(tehranTime.getMinutes()).padStart(2, '0');
    const seconds = String(tehranTime.getSeconds()).padStart(2, '0');

    // Format date
    const year = String(jalaali.jy).padStart(4, '0');
    const month = String(jalaali.jm).padStart(2, '0');
    const day = String(jalaali.jd).padStart(2, '0');

    // Persian month names
    const monthNames = [
      'فروردین',
      'اردیبهشت',
      'خرداد',
      'تیر',
      'مرداد',
      'شهریور',
      'مهر',
      'آبان',
      'آذر',
      'دی',
      'بهمن',
      'اسفند',
    ];

    // Day names
    const dayNames = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

    const dayOfWeek = tehranTime.getDay();
    const dayName = dayNames[dayOfWeek];

    return {
      timestamp: tehranTime.getTime(),
      iso: tehranTime.toISOString(),
      gregorian: {
        date: `${gregorianDate.gy}-${String(gregorianDate.gm).padStart(2, '0')}-${String(gregorianDate.gd).padStart(2, '0')}`,
        time: `${hours}:${minutes}:${seconds}`,
        datetime: `${gregorianDate.gy}-${String(gregorianDate.gm).padStart(2, '0')}-${String(gregorianDate.gd).padStart(2, '0')} ${hours}:${minutes}:${seconds}`,
      },
      persian: {
        date: `${year}/${month}/${day}`,
        time: `${hours}:${minutes}:${seconds}`,
        datetime: `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`,
        dateFormatted: `${day} ${monthNames[jalaali.jm - 1]} ${year}`,
        dayName: dayName,
        year: jalaali.jy,
        month: jalaali.jm,
        monthName: monthNames[jalaali.jm - 1],
        day: jalaali.jd,
      },
      timezone: {
        name: 'Asia/Tehran',
        offset: '+03:30',
      },
    };
  }
}

