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
    description: 'User latitude',
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
    description: 'User longitude',
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
    description: 'Search radius in kilometers',
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
    description: 'Jalali date (format: YYYY/MM/DD e.g. 1403/09/15)',
    example: '1403/09/15',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Start time (format: HH:mm e.g. 14:30)',
    example: '14:30',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time (format: HH:mm e.g. 18:00)',
    example: '18:00',
  })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({
    description: 'Province',
    example: 'Tehran',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Tehran',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Console ID',
    example: 2,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  consoleId?: number;

  @ApiPropertyOptional({
    description: 'Game ID',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gameId?: number;

  @ApiPropertyOptional({
    description: 'Number of players',
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
}

