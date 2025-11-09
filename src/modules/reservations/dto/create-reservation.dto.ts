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
    description: 'User ID (null if blocked by gaming cafe)',
    example: 123,
  })
  @IsOptional()
  @IsInt()
  userId?: number;

  @ApiProperty({
    description: 'Gaming cafe ID',
    example: 1,
  })
  @IsNotEmpty()
  @IsInt()
  organizationId: number;

  @ApiProperty({
    description: 'Station ID',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  stationId: number;

  @ApiProperty({
    description: 'Console ID',
    example: 3,
  })
  @IsNotEmpty()
  @IsInt()
  consoleId: number;

  @ApiProperty({
    description: 'Number of players',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  playerCount: number;

  @ApiProperty({
    description: 'Reservation date (ISO 8601 format)',
    example: '2025-01-15',
  })
  @IsNotEmpty()
  @IsDateString()
  reservedDate: string;

  @ApiProperty({
    description: 'Start time (ISO 8601 format)',
    example: '2025-01-15T16:00:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  startTime: string;

  @ApiProperty({
    description: 'End time (ISO 8601 format)',
    example: '2025-01-15T16:30:00Z',
  })
  @IsNotEmpty()
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({
    description: 'Reservation price (if not sent, calculated from StationPricing)',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Invoice number',
    example: 'INV-2025-0001',
  })
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional({
    description: 'Is blocked by gaming cafe?',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isBlockedByOrg?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'VIP room request',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

