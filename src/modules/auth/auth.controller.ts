import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiBody,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiOkResponse
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, LoginResponseDto, InitiateDto, InitiateResponseDto, RegisterDto, RegisterResponseDto } from './dto/auth.dto';
import { SendOtpDto, VerifyOtpDto, SendOtpResponseDto, VerifyOtpResponseDto } from '../sms/dto/otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Initiate authentication flow',
    description: 'Check if user exists by phone number and determine next step (login or register)'
  })
  @ApiBody({ type: InitiateDto })
  @ApiOkResponse({ 
    description: 'User status determined successfully',
    type: InitiateResponseDto
  })
  async initiate(@Body() initiateDto: InitiateDto): Promise<InitiateResponseDto> {
    return this.authService.initiate(initiateDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user with phone number and password'
  })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({ 
    description: 'User successfully logged in',
    type: LoginResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid credentials',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid credentials',
        error: 'Unauthorized'
      }
    }
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'User registration',
    description: 'Register a new user with phone number and password'
  })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ 
    description: 'User successfully registered',
    type: RegisterResponseDto
  })
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(registerDto);
  }

  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send OTP for login',
    description: 'Send OTP code to user phone for authentication'
  })
  @ApiBody({ type: SendOtpDto })
  @ApiOkResponse({ 
    description: 'OTP sent successfully',
    type: SendOtpResponseDto
  })
  async sendOtp(@Body() sendOtpDto: SendOtpDto): Promise<SendOtpResponseDto> {
    return this.authService.sendOtpForLogin(sendOtpDto.phone);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Verify OTP and login',
    description: 'Verify OTP code and authenticate user'
  })
  @ApiBody({ type: VerifyOtpDto })
  @ApiOkResponse({ 
    description: 'OTP verified successfully',
    type: VerifyOtpResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Invalid or expired OTP',
    schema: {
      example: {
        statusCode: 401,
        message: 'Invalid or expired OTP code',
        error: 'Unauthorized'
      }
    }
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    return this.authService.verifyOtpAndLogin(verifyOtpDto.phone, verifyOtpDto.code);
  }
}
