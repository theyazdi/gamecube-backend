import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  HttpException,
  UseGuards,
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConsoleService } from './console.service';
import { Console } from '../../generated/client';
import { CreateConsoleDto, UpdateConsoleDto, ConsoleResponseDto } from './dto/console.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';

@ApiTags('consoles')
@Controller('consoles')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ConsoleController {
  constructor(private readonly consoleService: ConsoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new console',
    description: 'Creates a new game console entry in the database',
  })
  @ApiBody({ type: CreateConsoleDto })
  @ApiCreatedResponse({
    description: 'Console successfully created',
    type: ConsoleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async createConsole(@Body() createConsoleDto: CreateConsoleDto): Promise<Console> {
    return this.consoleService.createConsole(createConsoleDto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all consoles',
    description: 'Retrieves a list of all consoles, with optional filtering',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
    example: 'Home Console',
  })
  @ApiQuery({
    name: 'manufacturer',
    required: false,
    description: 'Filter by manufacturer',
    example: 'Sony',
  })
  @ApiOkResponse({
    description: 'List of consoles retrieved successfully',
    type: [ConsoleResponseDto],
  })
  async findAllConsoles(
    @Query('category') category?: string,
    @Query('manufacturer') manufacturer?: string,
  ): Promise<Console[]> {
    if (category) {
      return this.consoleService.findConsolesByCategory(category);
    }
    if (manufacturer) {
      return this.consoleService.findConsolesByManufacturer(manufacturer);
    }
    return this.consoleService.findAllConsoles();
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get console by ID',
    description: 'Retrieves a specific console by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Console ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Console found successfully',
    type: ConsoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Console not found',
  })
  async findConsoleById(@Param('id', ParseIntPipe) id: number): Promise<Console | null> {
    return this.consoleService.findConsoleById(id);
  }

  @Get('name/:name')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get console by name',
    description: 'Retrieves a specific console by their name',
  })
  @ApiParam({
    name: 'name',
    description: 'Console name',
    type: 'string',
    example: 'PlayStation 5',
  })
  @ApiOkResponse({
    description: 'Console found successfully',
    type: ConsoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Console not found',
  })
  async findConsoleByName(@Param('name') name: string): Promise<Console | null> {
    return this.consoleService.findConsoleByName(name);
  }

  @Get('search/rawg')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get platforms list from RAWG.io',
    description: 'Retrieves list of platforms from RAWG.io API with optional pagination and ordering',
  })
  @ApiQuery({
    name: 'ordering',
    required: false,
    description: 'Which field to use when ordering the results',
    example: 'name',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'A page number within the paginated result set',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'page_size',
    required: false,
    description: 'Number of results to return per page',
    example: 20,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Platforms list retrieved successfully from RAWG.io',
    schema: {
      example: {
        count: 100,
        next: 'https://api.rawg.io/api/platforms?page=2',
        previous: null,
        results: [
          {
            id: 4,
            name: 'PC',
            slug: 'pc',
            games_count: 123456,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Failed to fetch from RAWG.io API',
  })
  async getPlatformsListFromRawg(
    @Query('ordering') ordering?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ): Promise<any> {
    let pageNumber: number | undefined;
    let pageSizeNumber: number | undefined;
    
    // Parse and validate page
    if (page) {
      pageNumber = parseInt(page, 10);
      if (isNaN(pageNumber) || pageNumber < 1) {
        throw new HttpException('page must be a positive integer', HttpStatus.BAD_REQUEST);
      }
    }
    
    // Parse and validate page_size
    if (pageSize) {
      pageSizeNumber = parseInt(pageSize, 10);
      if (isNaN(pageSizeNumber) || pageSizeNumber < 1) {
        throw new HttpException('page_size must be a positive integer', HttpStatus.BAD_REQUEST);
      }
    }
    
    return this.consoleService.getPlatformsListFromRawg(ordering, pageNumber, pageSizeNumber);
  }

  @Get('search/rawg/parents')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get parent platforms list from RAWG.io',
    description: 'Retrieves list of parent platforms from RAWG.io API with optional pagination and ordering',
  })
  @ApiQuery({
    name: 'ordering',
    required: false,
    description: 'Which field to use when ordering the results',
    example: 'name',
    type: String,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'A page number within the paginated result set',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'page_size',
    required: false,
    description: 'Number of results to return per page',
    example: 20,
    type: Number,
  })
  @ApiOkResponse({
    description: 'Parent platforms list retrieved successfully from RAWG.io',
    schema: {
      example: {
        count: 10,
        next: null,
        previous: null,
        results: [
          {
            id: 1,
            name: 'PC',
            slug: 'pc',
            platforms: [],
          },
          {
            id: 2,
            name: 'PlayStation',
            slug: 'playstation',
            platforms: [],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Failed to fetch from RAWG.io API',
  })
  async getParentPlatformsFromRawg(
    @Query('ordering') ordering?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ): Promise<any> {
    let pageNumber: number | undefined;
    let pageSizeNumber: number | undefined;
    
    // Parse and validate page
    if (page) {
      pageNumber = parseInt(page, 10);
      if (isNaN(pageNumber) || pageNumber < 1) {
        throw new HttpException('page must be a positive integer', HttpStatus.BAD_REQUEST);
      }
    }
    
    // Parse and validate page_size
    if (pageSize) {
      pageSizeNumber = parseInt(pageSize, 10);
      if (isNaN(pageSizeNumber) || pageSizeNumber < 1) {
        throw new HttpException('page_size must be a positive integer', HttpStatus.BAD_REQUEST);
      }
    }
    
    return this.consoleService.getParentPlatformsFromRawg(ordering, pageNumber, pageSizeNumber);
  }

  @Get('search/rawg/:id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get platform data from RAWG.io by ID',
    description: 'Retrieves platform information from RAWG.io API by platform ID',
  })
  @ApiParam({
    name: 'id',
    description: 'RAWG.io platform ID',
    type: 'number',
    example: 4,
  })
  @ApiOkResponse({
    description: 'Platform data retrieved successfully from RAWG.io',
    schema: {
      example: {
        id: 4,
        name: 'PC',
        slug: 'pc',
        games_count: 123456,
        image_background: 'https://media.rawg.io/media/games/456/456dea5e1c7e3cd07060c14e96612001.jpg',
        image: null,
        year_start: null,
        year_end: null,
        games: [],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid platform ID',
    schema: {
      example: {
        statusCode: 400,
        message: 'Platform ID is required and must be a positive number',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Failed to fetch from RAWG.io API',
  })
  async getPlatformFromRawg(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.consoleService.getPlatformFromRawg(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update console by ID',
    description: 'Updates console information by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Console ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: UpdateConsoleDto })
  @ApiOkResponse({
    description: 'Console updated successfully',
    type: ConsoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Console not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async updateConsole(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConsoleDto: UpdateConsoleDto,
  ): Promise<Console> {
    return this.consoleService.updateConsole(id, updateConsoleDto);
  }

  @Put('name/:name')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update console by name',
    description: 'Updates console information by their name',
  })
  @ApiParam({
    name: 'name',
    description: 'Console name',
    type: 'string',
    example: 'PlayStation 5',
  })
  @ApiBody({ type: UpdateConsoleDto })
  @ApiOkResponse({
    description: 'Console updated successfully',
    type: ConsoleResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Console not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async updateConsoleByName(
    @Param('name') name: string,
    @Body() updateConsoleDto: UpdateConsoleDto,
  ): Promise<Console> {
    return this.consoleService.updateConsoleByName(name, updateConsoleDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete console by ID',
    description: 'Soft deletes a console by their ID (sets deletedAt timestamp)',
  })
  @ApiParam({
    name: 'id',
    description: 'Console ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Console deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Console not found',
  })
  async deleteConsole(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.consoleService.deleteConsole(id);
  }

  @Delete('name/:name')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete console by name',
    description: 'Soft deletes a console by their name (sets deletedAt timestamp)',
  })
  @ApiParam({
    name: 'name',
    description: 'Console name',
    type: 'string',
    example: 'PlayStation 5',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Console deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Console not found',
  })
  async deleteConsoleByName(@Param('name') name: string): Promise<void> {
    await this.consoleService.deleteConsoleByName(name);
  }
}
