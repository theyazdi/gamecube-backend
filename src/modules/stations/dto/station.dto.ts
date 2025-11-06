import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, MinLength, IsNotEmpty } from 'class-validator';

export class CreateStationDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  organizationId: number;

  @ApiProperty({
    description: 'Station title',
    example: 'Station 1 - PlayStation 5',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Price per hour',
    example: 50000,
  })
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'Console ID',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  consoleId: number;

  @ApiProperty({
    description: 'Station capacity (number of people)',
    example: 2,
  })
  @IsNumber()
  @IsNotEmpty()
  capacity: number;

  @ApiPropertyOptional({
    description: 'Station status (in use or not)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Is station active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is station accepted by admin',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;

  @ApiPropertyOptional({
    description: 'Game IDs for this station',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  gameIds?: number[];
}

export class UpdateStationDto {
  @ApiPropertyOptional({
    description: 'Organization ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  organizationId?: number;

  @ApiPropertyOptional({
    description: 'Station title',
    example: 'Station 1 - PlayStation 5',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({
    description: 'Price per hour',
    example: 50000,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiPropertyOptional({
    description: 'Console ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  consoleId?: number;

  @ApiPropertyOptional({
    description: 'Station capacity (number of people)',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  capacity?: number;

  @ApiPropertyOptional({
    description: 'Station status (in use or not)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @ApiPropertyOptional({
    description: 'Is station active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Is station accepted by admin',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;

  @ApiPropertyOptional({
    description: 'Game IDs for this station',
    example: [1, 2, 3, 4],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  gameIds?: number[];
}

export class StationResponseDto {
  @ApiProperty({
    description: 'Station ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Organization ID',
    example: 1,
  })
  organizationId: number;

  @ApiProperty({
    description: 'Station title',
    example: 'Station 1 - PlayStation 5',
  })
  title: string;

  @ApiProperty({
    description: 'Price per hour',
    example: 50000,
  })
  price: number;

  @ApiProperty({
    description: 'Console ID',
    example: 1,
  })
  consoleId: number;

  @ApiProperty({
    description: 'Station capacity',
    example: 2,
  })
  capacity: number;

  @ApiProperty({
    description: 'Station status',
    example: false,
  })
  status: boolean;

  @ApiProperty({
    description: 'Is station active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Is station accepted',
    example: false,
  })
  isAccepted: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
