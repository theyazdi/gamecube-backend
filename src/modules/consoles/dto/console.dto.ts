import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, MinLength, IsNotEmpty } from 'class-validator';

export class CreateConsoleDto {
  @ApiProperty({
    description: 'Console name',
    example: 'PlayStation 5',
    minLength: 2,
  })
  @IsString()
  @MinLength(2)
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Console manufacturer',
    example: 'Sony',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiProperty({
    description: 'Release year',
    example: 2020,
  })
  @IsNumber()
  @IsNotEmpty()
  releaseYear: number;

  @ApiProperty({
    description: 'Console category',
    example: 'Home Console',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    description: 'Display priority (lower number = higher priority)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  displayPriority?: number;
}

export class UpdateConsoleDto {
  @ApiPropertyOptional({
    description: 'Console name',
    example: 'PlayStation 5',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({
    description: 'Console manufacturer',
    example: 'Sony',
  })
  @IsOptional()
  @IsString()
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Release year',
    example: 2020,
  })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;

  @ApiPropertyOptional({
    description: 'Console category',
    example: 'Home Console',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Display priority (lower number = higher priority)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  displayPriority?: number;
}

export class ConsoleResponseDto {
  @ApiProperty({
    description: 'Console ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Console name',
    example: 'PlayStation 5',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Console manufacturer',
    example: 'Sony',
  })
  manufacturer?: string;

  @ApiPropertyOptional({
    description: 'Release year',
    example: 2020,
  })
  releaseYear?: number;

  @ApiProperty({
    description: 'Console category',
    example: 'Home Console',
  })
  category: string;

  @ApiProperty({
    description: 'Display priority (lower number = higher priority)',
    example: 0,
  })
  displayPriority: number;

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
