import {
  IsNumber,
  IsInt,
  IsDateString,
  IsNotEmpty,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchAvailableGamenetDto {
  @ApiProperty({
    description: 'عرض جغرافیایی کاربر',
    example: 35.6892,
    minimum: -90,
    maximum: 90,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'طول جغرافیایی کاربر',
    example: 51.389,
    minimum: -180,
    maximum: 180,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'شعاع جستجو به کیلومتر',
    example: 5,
    minimum: 0.1,
    maximum: 50,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  radiusKm: number;

  @ApiProperty({
    description: 'شناسه کنسول',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  consoleId: number;

  @ApiPropertyOptional({
    description: 'شناسه بازی (اختیاری)',
    example: 42,
  })
  @IsOptional()
  @IsInt()
  gameId?: number;

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

  @ApiProperty({
    description: 'تعداد نفرات',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  playerCount: number;

  @ApiPropertyOptional({
    description: 'محدودیت تعداد نتایج',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

