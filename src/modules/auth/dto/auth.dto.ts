import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsPhoneNumber, MinLength, Matches } from 'class-validator';

export class InitiateDto {
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

export class InitiateResponseDto {
  @ApiProperty({
    description: 'Whether user exists or not',
    example: true,
  })
  userExists: boolean;

  @ApiProperty({
    description: 'Message indicating next step',
    example: 'User exists, please proceed to login',
  })
  message: string;

  @ApiProperty({
    description: 'Next action to take',
    example: 'login',
    enum: ['login', 'register'],
  })
  nextAction: 'login' | 'register';
}

export class LoginDto {
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
    description: 'User password',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  password: string;
}

export class RegisterDto {
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
    description: 'User password',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  password: string;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User registered successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User information',
    example: {
      id: 1,
      uuid: '550e8400-e29b-41d4-a716-446655440000',
      phone: '9380000000',
      roles: ['user'],
      isPhoneVerified: false,
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

export class LoginResponseDto {
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
      isPhoneVerified: false,
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
