import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsEmail, IsArray, IsUrl, MinLength, MaxLength, IsNumber, IsLatitude, IsLongitude, IsNotEmpty } from 'class-validator';
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
    description: 'Organization description in Persian (max 400 characters)',
    example: 'گیم نت مدرن با بهترین تجهیزات و فضای راحت برای بازی',
    maxLength: 400,
  })
  @IsOptional()
  @IsString()
  @MaxLength(400, { message: 'Description must not exceed 400 characters' })
  description?: string;

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
    description: 'Organization description in Persian (max 400 characters)',
    example: 'گیم نت مدرن با بهترین تجهیزات و فضای راحت برای بازی',
    maxLength: 400,
  })
  @IsOptional()
  @IsString()
  @MaxLength(400, { message: 'Description must not exceed 400 characters' })
  description?: string;

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
    description: 'Organization description in Persian (max 400 characters)',
    example: 'گیم نت مدرن با بهترین تجهیزات و فضای راحت برای بازی',
  })
  description?: string;

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

export class GetOrganizationDetailsDto {
  @ApiProperty({
    description: 'Organization username',
    example: 'gamingcafe_tehran',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiPropertyOptional({
    description: 'User latitude for distance calculation',
    example: 35.6892,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'User longitude for distance calculation',
    example: 51.3890,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude?: number;
}

export class ConsoleInfoDto {
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
}

export class WorkingHoursDayDto {
  @ApiProperty({
    description: 'Day of week (0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday)',
    example: 0,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Day name',
    example: 'Saturday',
  })
  dayName: string;

  @ApiProperty({
    description: 'Working hours status',
    enum: ['closed', '24hours', 'timeRange'],
    example: 'timeRange',
  })
  status: 'closed' | '24hours' | 'timeRange';

  @ApiPropertyOptional({
    description: 'Start time in HH:MM format (only if status is timeRange)',
    example: '09:00',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:MM format (only if status is timeRange)',
    example: '22:00',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Display text for working hours',
    example: '09:00 - 22:00',
  })
  displayText: string;
}

export class OrganizationDetailsResponseDto {
  @ApiProperty({
    description: 'Organization username',
    example: 'gamingcafe_tehran',
  })
  username: string;

  @ApiProperty({
    description: 'Organization name',
    example: 'Gaming Cafe Tehran',
  })
  name: string;

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
    description: 'Gallery of image URLs',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    type: [String],
  })
  gallery: string[];

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
    description: 'Organization description in Persian (max 400 characters)',
    example: 'گیم نت مدرن با بهترین تجهیزات و فضای راحت برای بازی',
  })
  description?: string;

  @ApiProperty({
    description: 'Distance from user location in meters (0 if coordinates not provided)',
    example: 1250,
  })
  distance: number;

  @ApiProperty({
    description: 'List of unique consoles available at this organization',
    type: [ConsoleInfoDto],
  })
  consoles: ConsoleInfoDto[];

  @ApiProperty({
    description: 'List of all stations in this organization',
    type: [StationResponseDto],
  })
  stations: StationResponseDto[];

  @ApiProperty({
    description: 'Working hours for each day of the week',
    type: [WorkingHoursDayDto],
  })
  workingHours: WorkingHoursDayDto[];
}