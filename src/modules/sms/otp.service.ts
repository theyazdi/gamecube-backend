import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../shared/database';

export interface OtpData {
  phone: string;
  code: string;
  expiresAt: Date;
  attempts: number;
}

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate 6-digit OTP code
   * @returns OTP code
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Store OTP code in database
   * @param phone Phone number
   * @param code OTP code
   * @param expiresInMinutes Expiration time in minutes (default: 5 minutes)
   * @returns Stored OTP code
   */
  async storeOtpCode(phone: string, code: string, expiresInMinutes: number = 5): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    try {
      // Delete previous codes for this phone number
      await this.prisma.otpCode.deleteMany({
        where: { phone },
      });

      // Store new code
      await this.prisma.otpCode.create({
        data: {
          phone,
          code,
          expiresAt,
          attempts: 0,
        },
      });
      
    } catch (error) {
      this.logger.error(`Failed to store OTP code for phone: ${phone}`, error.message);
      throw error;
    }
  }

  /**
   * Verify and validate OTP code
   * @param phone Phone number
   * @param code OTP code
   * @returns Whether code is valid
   */
  async verifyOtpCode(phone: string, code: string): Promise<boolean> {
    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        phone,
        code,
        expiresAt: {
          gt: new Date(), // Not expired yet
        },
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Check number of attempts
    if (otpRecord.attempts >= 3) {
      // Delete code after 3 failed attempts
      await this.prisma.otpCode.delete({
        where: { id: otpRecord.id },
      });
      return false;
    }

    // Increment number of attempts
    await this.prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { attempts: otpRecord.attempts + 1 },
    });

    return true;
  }

  /**
   * Delete OTP code after successful use
   * @param phone Phone number
   */
  async deleteOtpCode(phone: string): Promise<void> {
    await this.prisma.otpCode.deleteMany({
      where: { phone },
    });
  }

  /**
   * Cleanup expired codes
   */
  async cleanupExpiredCodes(): Promise<void> {
    await this.prisma.otpCode.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
