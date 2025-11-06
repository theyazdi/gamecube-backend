import { Controller, Get } from '@nestjs/common';
import { GeneralService } from './general.service';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
} from '@nestjs/swagger';

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

}

