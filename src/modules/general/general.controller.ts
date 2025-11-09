import { Controller, Get } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { GeneralService } from './general.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('general')
@Controller('general')
export class GeneralController {
  constructor(private readonly generalService: GeneralService) {}

  @Get('datetime')
  @ApiOperation({
    summary: 'Get current date and time in Persian calendar',
    description: 'Returns current date and time in Tehran timezone with Persian (Jalaali) calendar format',
  })
  @ApiOkResponse({
    description: 'Date and time information retrieved successfully',
    schema: {
      example: {
        timestamp: 1706541234567,
        iso: '2024-01-30T12:34:56.789Z',
        gregorian: {
          date: '2024-01-30',
          time: '16:04:56',
          datetime: '2024-01-30 16:04:56',
        },
        persian: {
          date: '1402/11/10',
          time: '16:04:56',
          datetime: '1402/11/10 16:04:56',
          dateFormatted: '10 بهمن 1402',
          dayName: 'سه‌شنبه',
          year: 1402,
          month: 11,
          monthName: 'بهمن',
          day: 10,
        },
        timezone: {
          name: 'Asia/Tehran',
          offset: '+03:30',
        },
      },
    },
  })
  getDateTime() {
    return this.generalService.getPersianDateTime();
  }

  @Get('games-consoles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get complete list of games and consoles',
    description: `
This endpoint returns the complete list of all games and consoles.

**Authentication Required:** Yes (JWT Token)

**Returned Data:**
- Complete list of games with related console information
- Complete list of consoles with related game information
- Meta information including total number of games and consoles
    `,
  })
  @ApiOkResponse({
    description: 'List of games and consoles retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        games: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              title: { type: 'string' },
              description: { type: 'string', nullable: true },
              coverImage: { type: 'string', nullable: true },
              category: { type: 'array', items: { type: 'string' } },
              releaseYear: { type: 'number' },
              displayPriority: { type: 'number' },
              isAccepted: { type: 'boolean' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              consoles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    name: { type: 'string' },
                    manufacturer: { type: 'string', nullable: true },
                    releaseYear: { type: 'number' },
                    category: { type: 'string' },
                    displayPriority: { type: 'number' },
                  },
                },
              },
            },
          },
        },
        consoles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              manufacturer: { type: 'string', nullable: true },
              releaseYear: { type: 'number' },
              category: { type: 'string' },
              displayPriority: { type: 'number' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
              games: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    title: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    coverImage: { type: 'string', nullable: true },
                    category: { type: 'array', items: { type: 'string' } },
                    releaseYear: { type: 'number' },
                    displayPriority: { type: 'number' },
                    isAccepted: { type: 'boolean' },
                  },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            totalGames: { type: 'number' },
            totalConsoles: { type: 'number' },
          },
        },
      },
    },
  })
  getGamesAndConsoles() {
    return this.generalService.getGamesAndConsoles();
  }
}

