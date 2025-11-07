/**
 * Logger Utility برای مدیریت لاگ‌ها
 * در production، لاگ‌های debug غیرفعال می‌شوند
 */

export class Logger {
  private static isProduction = process.env.NODE_ENV === 'production';
  private static debugEnabled = process.env.DEBUG_MODE === 'true';

  /**
   * لاگ debug - فقط در development یا با DEBUG_MODE=true
   */
  static debug(message: string, data?: any): void {
    if (!this.isProduction || this.debugEnabled) {
      if (data !== undefined) {
        console.log(`🔍 [DEBUG] ${message}`, JSON.stringify(data, null, 2));
      } else {
        console.log(`🔍 [DEBUG] ${message}`);
      }
    }
  }

  /**
   * لاگ info - همیشه نمایش داده می‌شود
   */
  static info(message: string, data?: any): void {
    if (data !== undefined) {
      console.log(`ℹ️ [INFO] ${message}`, data);
    } else {
      console.log(`ℹ️ [INFO] ${message}`);
    }
  }

  /**
   * لاگ warning - همیشه نمایش داده می‌شود
   */
  static warn(message: string, data?: any): void {
    if (data !== undefined) {
      console.warn(`⚠️ [WARN] ${message}`, data);
    } else {
      console.warn(`⚠️ [WARN] ${message}`);
    }
  }

  /**
   * لاگ error - همیشه نمایش داده می‌شود
   */
  static error(message: string, error?: any): void {
    if (error !== undefined) {
      console.error(`❌ [ERROR] ${message}`, error);
    } else {
      console.error(`❌ [ERROR] ${message}`);
    }
  }
}
