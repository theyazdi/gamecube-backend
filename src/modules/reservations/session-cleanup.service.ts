import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class SessionCleanupService {
  private readonly logger = new Logger(SessionCleanupService.name);
  private isRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cron job که هر 1 دقیقه اجرا می‌شود
   * سشن‌های منقضی شده را revoke می‌کند
   *
   * Optimizations:
   * - Non-blocking: اگر یک execution در حال اجراست، بعدی skip می‌شود
   * - Uses index: @@index([expireAt, status]) برای کوئری سریع
   * - Batch updates: updateMany برای کاهش DB calls
   * - No locking: فقط پاک‌سازی داده‌های قدیمی
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async cleanupExpiredSessions() {
    // جلوگیری از اجرای همزمان چند instance
    if (this.isRunning) {
      this.logger.debug('Cleanup already running, skipping this cycle');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      const now = new Date();

      this.logger.debug(`Starting cleanup for sessions expired before ${now.toISOString()}`);

      // استفاده از Transaction برای consistency
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. پیدا کردن سشن‌های منقضی شده
        // Uses optimized index: @@index([expireAt, status])
        const expiredSessions = await tx.session.findMany({
          where: {
            status: 'pending',
            expireAt: {
              lte: now, // Less than or equal to current time
            },
          },
          select: {
            id: true,
            invoiceId: true,
          },
        });

        if (expiredSessions.length === 0) {
          return { sessionsRevoked: 0, invoicesExpired: 0 };
        }

        const sessionIds = expiredSessions.map((s) => s.id);
        const invoiceIds = expiredSessions
          .map((s) => s.invoiceId)
          .filter((id): id is number => id !== null);

        // 2. Bulk update سشن‌ها به revoked
        const sessionsUpdated = await tx.session.updateMany({
          where: {
            id: {
              in: sessionIds,
            },
          },
          data: {
            status: 'revoked',
          },
        });

        // 3. Soft delete فاکتورها (status = expired)
        let invoicesUpdated = 0;
        if (invoiceIds.length > 0) {
          const invoicesResult = await tx.invoice.updateMany({
            where: {
              id: {
                in: invoiceIds,
              },
            },
            data: {
              status: 'expired',
            },
          });
          invoicesUpdated = invoicesResult.count;
        }

        return {
          sessionsRevoked: sessionsUpdated.count,
          invoicesExpired: invoicesUpdated,
        };
      });

      const duration = Date.now() - startTime;

      if (result.sessionsRevoked > 0) {
        this.logger.log(
          `✓ Cleanup completed in ${duration}ms: ${result.sessionsRevoked} sessions revoked, ${result.invoicesExpired} invoices expired`,
        );
      } else {
        this.logger.debug(
          `✓ Cleanup completed in ${duration}ms: No expired sessions found`,
        );
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `✗ Cleanup failed after ${duration}ms: ${error.message}`,
        error.stack,
      );
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * متد manual برای اجرای دستی cleanup
   * مفید برای testing یا اجرای on-demand
   */
  async manualCleanup(): Promise<{
    sessionsRevoked: number;
    invoicesExpired: number;
  }> {
    this.logger.log('Manual cleanup triggered');
    await this.cleanupExpiredSessions();
    return { sessionsRevoked: 0, invoicesExpired: 0 };
  }
}
