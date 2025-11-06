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
import { GameService } from './game.service';
import { Game } from '../../generated/client';
import { CreateGameDto, UpdateGameDto, GameResponseDto } from './dto/game.dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';

@ApiTags('games')
@Controller('games')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Create a new game',
    description: 'Creates a new game entry in the database',
  })
  @ApiBody({ type: CreateGameDto })
  @ApiCreatedResponse({
    description: 'Game successfully created',
    type: GameResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async createGame(@Body() createGameDto: CreateGameDto): Promise<Game> {
    return this.gameService.createGame(createGameDto);
  }

  @Get()
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get all games',
    description: 'Retrieves a list of all games, with optional filtering',
  })
  @ApiQuery({
    name: 'accepted',
    required: false,
    description: 'Filter by acceptance status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'platform',
    required: false,
    description: 'Filter by console ID (platform)',
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category',
    example: 'Action',
  })
  @ApiOkResponse({
    description: 'List of games retrieved successfully',
    type: [GameResponseDto],
  })
  async findAllGames(
    @Query('accepted') accepted?: string,
    @Query('platform', new ParseIntPipe({ optional: true })) platform?: number,
    @Query('category') category?: string,
  ): Promise<Game[]> {
    if (accepted === 'true') {
      return this.gameService.findAcceptedGames();
    }
    if (platform) {
      return this.gameService.findGamesByPlatform(platform);
    }
    if (category) {
      return this.gameService.findGamesByCategory(category);
    }
    return this.gameService.findAllGames();
  }

  @Get('search/rawg')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Search game from RAWG.io',
    description: 'Searches for game information from RAWG.io API by game name',
  })
  @ApiQuery({
    name: 'name',
    description: 'Game name to search for',
    example: 'The Witcher 3',
    required: true,
  })
  @ApiOkResponse({
    description: 'Game data retrieved successfully from RAWG.io',
    schema: {
      example: {
        count: 1,
        next: null,
        previous: null,
        results: [
          {
            id: 3328,
            slug: 'the-witcher-3-wild-hunt',
            name: 'The Witcher 3: Wild Hunt',
            released: '2015-05-18',
            tba: false,
            background_image: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10b6bcdcb.jpg',
            rating: 4.66,
            rating_top: 5,
            ratings: [],
            ratings_count: 14377,
            reviews_text_count: 276,
            added: 60483,
            added_by_status: {},
            metacritic: 92,
            playtime: 47,
            suggestions_count: 647,
            updated: '2023-11-15T18:27:39',
            reviews_count: 14653,
            platforms: [],
            genres: [],
            stores: [],
            tags: [],
            short_screenshots: [],
          },
        ],
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Game name is required or invalid',
    schema: {
      example: {
        statusCode: 400,
        message: 'Game name is required',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_GATEWAY,
    description: 'Failed to fetch from RAWG.io API',
  })
  async searchGameFromRawg(@Query('name') name: string): Promise<any> {
    return this.gameService.searchGameFromRawg(name);
  }

  @Get(':id')
  @Roles(UserRole.USER, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Get game by ID',
    description: 'Retrieves a specific game by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Game ID',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Game found successfully',
    type: GameResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Game not found',
  })
  async findGameById(@Param('id', ParseIntPipe) id: number): Promise<Game | null> {
    return this.gameService.findGameById(id);
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Update game by ID',
    description: 'Updates game information by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Game ID',
    type: 'number',
    example: 1,
  })
  @ApiBody({ type: UpdateGameDto })
  @ApiOkResponse({
    description: 'Game updated successfully',
    type: GameResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'Game not found',
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
  })
  async updateGame(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGameDto: UpdateGameDto,
  ): Promise<Game> {
    return this.gameService.updateGame(id, updateGameDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Delete game by ID',
    description: 'Permanently deletes a game by their ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Game ID',
    type: 'number',
    example: 1,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Game deleted successfully',
  })
  @ApiNotFoundResponse({
    description: 'Game not found',
  })
  async deleteGame(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.gameService.deleteGame(id);
  }
}
