import {
  IsInt,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiPropertyOptional({
    description: 'شناسه کاربر (برای block توسط گیم‌نت null است)',
    example: 123,
  })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({
    description: 'شناسه گیم‌نت',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  organizationId: number;

  @ApiProperty({
    description: 'شناسه استیشن',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  stationId: number;

  @ApiProperty({
    description: 'شناسه کنسول',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  consoleId: number;

  @ApiProperty({
    description: 'تعداد نفرات',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  playerCount: number;

  @ApiProperty({
    description: 'تاریخ رزرو (ISO 8601 format)',
    example: '2025-01-15',
  })
  @IsNotEmpty()
  @IsDateString()
  reservedDate: string;

  @ApiProperty({
    description: 'زمان شروع (ISO 8601 format)',
    example: '2025-01-15T16:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'زمان پایان (ISO 8601 format)',
    example: '2025-01-15T16:30:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    description: 'مبلغ رزرو (اگر ارسال نشود از StationPricing محاسبه می‌شود)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'شماره فاکتور',
    example: 'INV-2025-0001',
  })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'آیا توسط گیم‌نت block شده است؟',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isBlockedByOrg?: boolean;

  @ApiPropertyOptional({
    description: 'یادداشت‌های اضافی',
    example: 'درخواست اتاق VIP',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

