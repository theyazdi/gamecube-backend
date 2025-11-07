import { IsInt, IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckAvailabilityDto {
  @ApiProperty({
    description: 'شناسه استیشن',
    example: 5,
  })
  @IsNotEmpty()
  @IsInt()
  stationId: number;

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
}

