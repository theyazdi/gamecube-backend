import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsPhoneNumber, MinLength, IsArray } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'User phone number (Iranian format)',
    example: '9380000000',
    pattern: '^9[0-9]{9}$',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    description: 'User roles (array of roles)',
    example: ['user'],
    default: ['user'],
    enum: ['user', 'admin', 'moderator', 'editor', 'viewer'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User phone number (Iranian format)',
    example: '9380000000',
    pattern: '^9[0-9]{9}$',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'User password',
    example: 'newSecurePassword123',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description: 'User roles (array of roles)',
    example: ['admin', 'moderator'],
    enum: ['user', 'admin', 'moderator', 'editor', 'viewer'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @ApiPropertyOptional({
    description: 'Phone verification status',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPhoneVerified?: boolean;

  @ApiPropertyOptional({
    description: 'Email verification status',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @ApiPropertyOptional({
    description: 'General verification status',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  uuid: string;

  @ApiProperty({
    description: 'User phone number (Iranian format)',
    example: '9380000000',
  })
  phone: string;

  @ApiProperty({
    description: 'User roles (array of roles)',
    example: ['user', 'moderator'],
    type: [String],
  })
  roles: string[];

  @ApiProperty({
    description: 'Phone verification status',
    example: false,
  })
  isPhoneVerified: boolean;

  @ApiProperty({
    description: 'Email verification status',
    example: false,
  })
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'General verification status',
    example: false,
  })
  isVerified: boolean;

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
