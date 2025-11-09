import { IsInt, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'Station ID',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  stationId: number;

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
}

