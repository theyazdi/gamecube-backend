import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class CompleteProfileDto {
  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Ali',
  })
  @IsOptional()
  @IsString()
  fName?: string;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Ahmadi',
  })
  @IsOptional()
  @IsString()
  lName?: string;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'ali.ahmadi@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'National code (10 digits)',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  nationalCode?: string;

  @ApiPropertyOptional({
    description: 'Province',
    example: 'Tehran',
  })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Tehran',
  })
  @IsOptional()
  @IsString()
  city?: string;
}

export class ProfileDataDto {
  @ApiPropertyOptional({
    description: 'Profile ID',
    example: 1,
  })
  id: number;

  @ApiPropertyOptional({
    description: 'User ID',
    example: 1,
  })
  userId: number;

  @ApiPropertyOptional({
    description: 'User first name',
    example: 'Ali',
  })
  fName: string | null;

  @ApiPropertyOptional({
    description: 'User last name',
    example: 'Ahmadi',
  })
  lName: string | null;

  @ApiPropertyOptional({
    description: 'User email address',
    example: 'ali.ahmadi@example.com',
  })
  email: string | null;

  @ApiPropertyOptional({
    description: 'National code',
    example: '1234567890',
  })
  nationalCode: string | null;

  @ApiPropertyOptional({
    description: 'Province',
    example: 'Tehran',
  })
  province: string | null;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Tehran',
  })
  city: string | null;

  @ApiPropertyOptional({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class CompleteProfileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Profile completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Profile data',
    type: ProfileDataDto,
  })
  data: ProfileDataDto;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Profile retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Profile data',
    type: ProfileDataDto,
  })
  data: ProfileDataDto | null;
}

