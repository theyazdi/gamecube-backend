import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEmail, IsArray, IsUrl, MinLength, IsNumber, IsLatitude, IsLongitude } from 'class-validator';
import { Type } from 'class-transformer';
import { StationResponseDto } from '../../stations/dto/station.dto';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'Gaming Cafe Tehran',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional({
    description: 'Username for organization profile (unique)',
    example: 'gamingcafe_tehran',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiProperty({
    description: 'Province name',
    example: 'Tehran',
  })
  @IsString()
  province: string;

  @ApiProperty({
    description: 'City name',
    example: 'Tehran',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'Phone number',
    example: '02112345678',
  })
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'info@gamingcafe.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Manager phone numbers',
    example: ['09121234567', '09359876543'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  managerPhones?: string[];

  @ApiPropertyOptional({
    description: 'Gallery of image URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({
    description: 'Index/featured image URL',
    example: 'https://example.com/index-image.jpg',
  })
  @IsOptional()
  @IsUrl()
  indexImage?: string;

  @ApiPropertyOptional({
    description: 'Logo image URL',
    example: 'https://example.com/logo.jpg',
  })
  @IsOptional()
  @IsUrl()
  logoImage?: string;

  @ApiPropertyOptional({
    description: '24-hour operation status',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  tfHour?: boolean;

  @ApiPropertyOptional({
    description: 'Is a cube gaming cafe',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isCube?: boolean;

  @ApiPropertyOptional({
    description: 'Physical address of the gaming cafe',
    example: '123 Main Street, Tehran, Iran',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate for map location',
    example: 35.6892,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate for map location',
    example: 51.3890,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude?: number;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({
    description: 'Organization name',
    example: 'Gaming Cafe Tehran',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    description: 'Username for organization profile (unique)',
    example: 'gamingcafe_tehran',
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @ApiPropertyOptional({
    description: 'Province name',
    example: 'Tehran',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'City name',
    example: 'Tehran',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '02112345678',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'info@gamingcafe.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'Manager phone numbers',
    example: ['09121234567', '09359876543'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  managerPhones?: string[];

  @ApiPropertyOptional({
    description: 'Gallery of image URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({
    description: 'Index/featured image URL',
    example: 'https://example.com/index-image.jpg',
  })
  @IsOptional()
  @IsUrl()
  indexImage?: string;

  @ApiPropertyOptional({
    description: 'Logo image URL',
    example: 'https://example.com/logo.jpg',
  })
  @IsOptional()
  @IsUrl()
  logoImage?: string;

  @ApiPropertyOptional({
    description: '24-hour operation status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  tfHour?: boolean;

  @ApiPropertyOptional({
    description: 'Is a cube gaming cafe',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isCube?: boolean;

  @ApiPropertyOptional({
    description: 'Physical address of the gaming cafe',
    example: '123 Main Street, Tehran, Iran',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate for map location',
    example: 35.6892,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate for map location',
    example: 51.3890,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude?: number;
}

export class OrganizationResponseDto {
  @ApiProperty({
    description: 'Organization ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Organization UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Gaming Cafe Tehran',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Username for organization profile',
    example: 'gamingcafe_tehran',
  })
  username?: string;

  @ApiProperty({
    description: 'Province name',
    example: 'Tehran',
  })
  province: string;

  @ApiProperty({
    description: 'City name',
    example: 'Tehran',
  })
  city: string;

  @ApiProperty({
    description: 'Phone number',
    example: '02112345678',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'info@gamingcafe.com',
  })
  email?: string;

  @ApiPropertyOptional({
    description: 'Manager phone numbers',
    example: ['09121234567', '09359876543'],
    type: [String],
  })
  managerPhones?: string[];

  @ApiPropertyOptional({
    description: 'Gallery of image URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  gallery?: string[];

  @ApiPropertyOptional({
    description: 'Index/featured image URL',
    example: 'https://example.com/index-image.jpg',
  })
  indexImage?: string;

  @ApiPropertyOptional({
    description: 'Logo image URL',
    example: 'https://example.com/logo.jpg',
  })
  logoImage?: string;

  @ApiProperty({
    description: '24-hour operation status',
    example: false,
  })
  tfHour: boolean;

  @ApiProperty({
    description: 'Is a cube gaming cafe',
    example: false,
  })
  isCube: boolean;

  @ApiPropertyOptional({
    description: 'Physical address of the gaming cafe',
    example: '123 Main Street, Tehran, Iran',
  })
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate for map location',
    example: 35.6892,
    type: Number,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate for map location',
    example: 51.3890,
    type: Number,
  })
  longitude?: number;

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

export class ManagerOrganizationsResponseDto {
  @ApiProperty({
    description: 'List of organizations managed by the user',
    type: [Object],
    example: [
      { id: 1, name: 'Gaming Cafe Tehran' },
      { id: 2, name: 'Gaming Cafe Isfahan' },
    ],
  })
  organizations: { id: number; name: string }[];

  @ApiProperty({
    description: 'List of all stations from managed organizations',
    type: [StationResponseDto],
  })
  stations: StationResponseDto[];
}