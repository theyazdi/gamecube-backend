import { IsNotEmpty, IsInt, IsString, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSessionDto {
  @ApiProperty({
    description: 'Station ID',
    example: 1,
    type: Number,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  stationId: number;

  @ApiProperty({
    description: 'Jalali date in format YYYY/MM/DD',
    example: '1403/09/15',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: 'Start time in HH:mm format (24-hour)',
    example: '14:00',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format (24-hour)',
    example: '16:00',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({
    description: 'Number of players (1-10)',
    example: 2,
    type: Number,
    minimum: 1,
    maximum: 10,
  })
  @IsInt()
  @Min(1)
  @Max(10)
  @IsNotEmpty()
  playersCount: number;
}

export class CreateSessionResponseDto {
  @ApiProperty({
    description: 'Session UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sessionUuid: string;

  @ApiProperty({
    description: 'Invoice UUID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  invoiceUuid: string;

  @ApiProperty({
    description: 'Invoice ID',
    example: 123,
  })
  invoiceId: number;

  @ApiProperty({
    description: 'Total price (including tax)',
    example: 150000,
  })
  totalPrice: bigint;

  @ApiProperty({
    description: 'Tax amount',
    example: 13500,
  })
  tax: bigint;

  @ApiProperty({
    description: 'Price before tax',
    example: 136500,
  })
  priceBeforeTax: bigint;

  @ApiProperty({
    description: 'Expiration time (10 minutes from creation)',
    example: '2024-01-15T14:10:00.000Z',
  })
  expireAt: Date;

  @ApiProperty({
    description: 'Session details',
  })
  session: {
    id: number;
    uuid: string;
    organizationId: number;
    organizationName: string;
    stationId: number;
    stationTitle: string;
    date: Date;
    shamsiDate: string;
    startTime: string;
    endTime: string | null;
    duration: number;
    playersCount: number;
    status: string;
  };
}
