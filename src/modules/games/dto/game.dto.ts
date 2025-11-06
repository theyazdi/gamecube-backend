import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray, IsUrl, IsNumber, MinLength, IsNotEmpty, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGameDto {
  @ApiProperty({
    description: 'Game title',
    example: 'Cyberpunk 2077',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Game description',
    example: 'An open-world action-adventure RPG set in a dystopian future',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://example.com/cover-image.jpg',
  })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Game categories',
    example: ['Action', 'RPG', 'Open World'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({
    description: 'Console IDs (platforms) - Array of console IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  consoleIds?: number[];

  @ApiProperty({
    description: 'Release year',
    example: 2020,
  })
  @IsNumber()
  @IsNotEmpty()
  releaseYear: number;

  @ApiPropertyOptional({
    description: 'Display priority (lower number = higher priority)',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  displayPriority?: number;

  @ApiPropertyOptional({
    description: 'Acceptance status',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;
}

export class UpdateGameDto {
  @ApiPropertyOptional({
    description: 'Game title',
    example: 'Cyberpunk 2077',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @ApiPropertyOptional({
    description: 'Game description',
    example: 'An open-world action-adventure RPG set in a dystopian future',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://example.com/cover-image.jpg',
  })
  @IsOptional()
  @IsUrl()
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Game categories',
    example: ['Action', 'RPG', 'Open World'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  category?: string[];

  @ApiPropertyOptional({
    description: 'Console IDs (platforms) - Array of console IDs',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  consoleIds?: number[];

  @ApiPropertyOptional({
    description: 'Release year',
    example: 2020,
  })
  @IsOptional()
  @IsNumber()
  releaseYear?: number;

  @ApiPropertyOptional({
    description: 'Display priority (lower number = higher priority)',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  displayPriority?: number;

  @ApiPropertyOptional({
    description: 'Acceptance status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;
}

export class GameResponseDto {
  @ApiProperty({
    description: 'Game ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Game title',
    example: 'Cyberpunk 2077',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Game description',
    example: 'An open-world action-adventure RPG set in a dystopian future',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Cover image URL',
    example: 'https://example.com/cover-image.jpg',
  })
  coverImage?: string;

  @ApiPropertyOptional({
    description: 'Game categories',
    example: ['Action', 'RPG', 'Open World'],
    type: [String],
  })
  category?: string[];

  @ApiPropertyOptional({
    description: 'Consoles (platforms) - Array of console objects',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' },
        manufacturer: { type: 'string' },
        releaseYear: { type: 'number' },
        category: { type: 'string' },
      },
    },
  })
  consoles?: any[];

  @ApiPropertyOptional({
    description: 'Release year',
    example: 2020,
  })
  releaseYear?: number;

  @ApiProperty({
    description: 'Display priority (lower number = higher priority)',
    example: 0,
  })
  displayPriority: number;

  @ApiProperty({
    description: 'Acceptance status',
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
