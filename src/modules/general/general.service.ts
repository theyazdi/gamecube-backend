import { Injectable } from '@nestjs/common';
import { toJalaali, toGregorian } from 'jalaali-js';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class GeneralService {
  constructor(private readonly prisma: PrismaService) {}
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

  /**
   * Get complete list of all games
   */
  async getAllGames() {
    return this.prisma.game.findMany({
      include: {
        consoles: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            manufacturer: true,
            releaseYear: true,
            category: true,
            displayPriority: true,
          },
          orderBy: {
            displayPriority: 'asc',
          },
        },
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get complete list of all consoles
   */
  async getAllConsoles() {
    return this.prisma.console.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        games: {
          where: {
            isAccepted: true,
          },
          select: {
            id: true,
            title: true,
            description: true,
            coverImage: true,
            category: true,
            releaseYear: true,
            displayPriority: true,
            isAccepted: true,
          },
          orderBy: {
            displayPriority: 'asc',
          },
        },
      },
      orderBy: [
        { displayPriority: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get complete list of games and consoles
   */
  async getGamesAndConsoles() {
    const [games, consoles] = await Promise.all([
      this.getAllGames(),
      this.getAllConsoles(),
    ]);

    return {
      games,
      consoles,
      meta: {
        totalGames: games.length,
        totalConsoles: consoles.length,
      },
    };
  }
}

