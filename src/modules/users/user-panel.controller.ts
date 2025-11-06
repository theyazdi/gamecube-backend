import { 
  Controller, 
  Get, 
  Post,
  Body,
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { UserService } from '../users/user.service';
import { User, Profile, Organization } from '../../generated/client';
import { UserResponseDto } from '../users/dto/user.dto';
import { 
  CompleteProfileDto, 
  ProfileResponseDto, 
  CompleteProfileResponseDto,
  ProfileDataDto 
} from '../users/dto/profile.dto';
import { FindNearbyOrganizationsDto } from '../users/dto/nearby-organizations.dto';
import { OrganizationService } from '../organizations/organization.service';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';
import { AuthenticatedRequest } from '../../shared/interfaces/authenticated-request.interface';

@ApiTags('User Panel')
@Controller('user-panel')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserPanelController {
  constructor(
    private readonly userService: UserService,
    private readonly organizationService: OrganizationService,
  ) {}

  @Get('me')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get current user information',
    description: 'Retrieves the authenticated user\'s own information'
  })
  @ApiOkResponse({ 
    description: 'Current user retrieved successfully',
    type: UserResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getCurrentUser(@Request() req: AuthenticatedRequest): Promise<Omit<User, 'password'>> {
    const user = await this.userService.findUserById(req.user.id);
    if (!user) {
      throw new Error('User not found');
    }
    // Remove password field from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get('profile')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get current user profile',
    description: 'Retrieves the authenticated user\'s profile information'
  })
  @ApiOkResponse({ 
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getProfile(@Request() req: AuthenticatedRequest): Promise<ProfileResponseDto> {
    const profile = await this.userService.getProfileByUserId(req.user.id);
    
    if (!profile) {
      return {
        message: 'Profile not found',
        data: null,
      };
    }

    return {
      message: 'Profile retrieved successfully',
      data: profile as any,
    };
  }

  @Post('complete-profile')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Complete user profile',
    description: 'Create or update the authenticated user\'s profile with personal information'
  })
  @ApiCreatedResponse({ 
    description: 'Profile completed/updated successfully',
    type: CompleteProfileResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['email must be an email'],
        error: 'Bad Request'
      }
    }
  })
  @ApiUnauthorizedResponse({ 
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async completeProfile(
    @Request() req: AuthenticatedRequest,
    @Body() completeProfileDto: CompleteProfileDto
  ): Promise<CompleteProfileResponseDto> {
    const existingProfile = await this.userService.getProfileByUserId(req.user.id);
    
    const profile = await this.userService.completeProfile(req.user.id, completeProfileDto);
    
    const message = existingProfile 
      ? 'Profile updated successfully' 
      : 'Profile created successfully';
    
    return {
      message,
      data: profile as any,
    };
  }

  @Post('nearby-organizations')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Find nearby gaming cafes',
    description: 'Finds gaming cafes within a specified radius from user location, sorted by distance (closest first)',
  })
  @ApiOkResponse({
    description: 'Nearby organizations retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          uuid: { type: 'string' },
          name: { type: 'string' },
          province: { type: 'string' },
          city: { type: 'string' },
          address: { type: 'string' },
          latitude: { type: 'number' },
          longitude: { type: 'number' },
          distance: { type: 'number', description: 'Distance in kilometers' },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['latitude must be a latitude string or number'],
        error: 'Bad Request',
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized',
      },
    },
  })
  async findNearbyOrganizations(
    @Body() findNearbyDto: FindNearbyOrganizationsDto,
  ): Promise<(Organization & { distance: number })[]> {
    return this.organizationService.findNearbyOrganizations(
      findNearbyDto.latitude,
      findNearbyDto.longitude,
      findNearbyDto.radius,
    );
  }
}
