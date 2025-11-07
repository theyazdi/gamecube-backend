import {
  IsNumber,
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchAvailableGamenetQueryDto {
  @ApiProperty({
    description: 'عرض جغرافیایی کاربر',
    example: 35.6892,
    minimum: -90,
    maximum: 90,
  })
  @Type(() => Number)
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
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiProperty({
    description: 'شعاع جستجو به کیلومتر',
    example: 10,
    minimum: 5,
    maximum: 30,
    enum: [5, 10, 15, 20, 25, 30],
  })
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(30)
  radiusKm: number;

  @ApiPropertyOptional({
    description: 'تاریخ شمسی (فرمت: YYYY/MM/DD مثال: 1403/09/15)',
    example: '1403/09/15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'ساعت شروع (فرمت: HH:mm مثال: 14:30)',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'ساعت پایان (فرمت: HH:mm مثال: 18:00)',
    example: '18:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'استان',
    example: 'تهران',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'شهر',
    example: 'تهران',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'شناسه کنسول',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  consoleId?: number;

  @ApiPropertyOptional({
    description: 'شناسه بازی',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gameId?: number;

  @ApiPropertyOptional({
    description: 'تعداد نفرات',
    example: 4,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  playerCount?: number;

  @ApiPropertyOptional({
    description: 'محدودیت تعداد نتایج',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

