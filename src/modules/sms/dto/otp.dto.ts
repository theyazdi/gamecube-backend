import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({
    description: 'User phone number (Iranian format)',
    example: '9380000000',
    pattern: '^9[0-9]{9}$',
  })
  @IsString()
  @Matches(/^9[0-9]{9}$/, {
    message: 'Phone number must be in Iranian format (9xxxxxxxxx)',
  })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({
    description: 'User phone number (Iranian format)',
    example: '9380000000',
    pattern: '^9[0-9]{9}$',
  })
  @IsString()
  @Matches(/^9[0-9]{9}$/, {
    message: 'Phone number must be in Iranian format (9xxxxxxxxx)',
  })
  phone: string;

  @ApiProperty({
    description: 'OTP verification code',
    example: '123456',
    pattern: '^[0-9]{6}$',
  })
  @IsString()
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP code must be 6 digits',
  })
  code: string;
}

export class SendOtpResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP code sent successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Expiration time in minutes',
    example: 5,
  })
  expiresInMinutes: number;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'OTP verified successfully',
  })
  message: string;

  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      phone: '9380000000',
      roles: ['user'],
      isPhoneVerified: true,
      isEmailVerified: false,
      isVerified: false,
    },
  })
  user: {
    id: number;
    uuid: string;
    phone: string;
    roles: string[];
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    isVerified: boolean;
  };
}
