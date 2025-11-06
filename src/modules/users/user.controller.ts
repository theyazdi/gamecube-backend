import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  UseGuards
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam, 
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { User } from '../../generated/client';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from './dto/user.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Create a new user',
    description: 'Creates a new user with phone number, password, and optional roles'
  })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ 
    description: 'User successfully created',
    type: UserResponseDto
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['phone must be a valid phone number', 'password must be longer than or equal to 6 characters'],
        error: 'Bad Request'
      }
    }
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.userService.createUser(createUserDto);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get all users',
    description: 'Retrieves a list of all users in the system'
  })
  @ApiOkResponse({ 
    description: 'List of users retrieved successfully',
    type: [UserResponseDto]
  })
  async findAllUsers(): Promise<User[]> {
    return this.userService.findAllUsers();
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get user by ID',
    description: 'Retrieves a specific user by their ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'number',
    example: 1
  })
  @ApiOkResponse({ 
    description: 'User found successfully',
    type: UserResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async findUserById(@Param('id', ParseIntPipe) id: number): Promise<User | null> {
    return this.userService.findUserById(id);
  }

  @Get('uuid/:uuid')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Get user by UUID',
    description: 'Retrieves a specific user by their UUID'
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiOkResponse({ 
    description: 'User found successfully',
    type: UserResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async findUserByUuid(@Param('uuid') uuid: string): Promise<User | null> {
    return this.userService.findUserByUuid(uuid);
  }


  @Put(':id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Update user by ID',
    description: 'Updates user information by their ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'number',
    example: 1
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ 
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input data',
    schema: {
      example: {
        statusCode: 400,
        message: ['phone must be a valid phone number'],
        error: 'Bad Request'
      }
    }
  })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Put('uuid/:uuid')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Update user by UUID',
    description: 'Updates user information by their UUID'
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ 
    description: 'User updated successfully',
    type: UserResponseDto
  })
  @ApiNotFoundResponse({ 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async updateUserByUuid(
    @Param('uuid') uuid: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateUserByUuid(uuid, updateUserDto);
  }




  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Delete user by ID',
    description: 'Permanently deletes a user by their ID'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User ID',
    type: 'number',
    example: 1
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully'
  })
  @ApiNotFoundResponse({ 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async deleteUser(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.userService.deleteUser(id);
  }

  @Delete('uuid/:uuid')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ 
    summary: 'Delete user by UUID',
    description: 'Permanently deletes a user by their UUID'
  })
  @ApiParam({ 
    name: 'uuid', 
    description: 'User UUID',
    type: 'string',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT,
    description: 'User deleted successfully'
  })
  @ApiNotFoundResponse({ 
    description: 'User not found',
    schema: {
      example: {
        statusCode: 404,
        message: 'User not found',
        error: 'Not Found'
      }
    }
  })
  async deleteUserByUuid(@Param('uuid') uuid: string): Promise<void> {
    await this.userService.deleteUserByUuid(uuid);
  }
}
