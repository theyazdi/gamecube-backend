import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReservationService } from './reservation.service';
import {
  CreateReservationDto,
  UpdateReservationDto,
  SearchAvailableGamenetDto,
  SearchAvailableGamenetQueryDto,
  CheckAvailabilityDto,
} from './dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'ایجاد رزرو جدید' })
  @ApiResponse({
    status: 201,
    description: 'رزرو با موفقیت ایجاد شد',
  })
  @ApiResponse({
    status: 400,
    description: 'داده‌های ورودی نامعتبر',
  })
  @ApiResponse({
    status: 404,
    description: 'استیشن یافت نشد',
  })
  @ApiResponse({
    status: 409,
    description: 'بازه زمانی رزرو شده است',
  })
  create(@Body() dto: CreateReservationDto) {
    return this.reservationService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'دریافت یک رزرو با ID' })
  @ApiParam({ name: 'id', description: 'شناسه رزرو' })
  @ApiResponse({
    status: 200,
    description: 'رزرو یافت شد',
  })
  @ApiResponse({
    status: 404,
    description: 'رزرو یافت نشد',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.findOne(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'دریافت رزروهای یک کاربر' })
  @ApiParam({ name: 'userId', description: 'شناسه کاربر' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'شماره صفحه',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'تعداد آیتم در هر صفحه',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'لیست رزروها',
  })
  findByUser(
    @Param('userId', ParseIntPipe) userId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.reservationService.findByUser(userId, page, limit);
  }

  @Get('organization/:organizationId')
  @ApiOperation({ summary: 'دریافت رزروهای یک گیم‌نت' })
  @ApiParam({ name: 'organizationId', description: 'شناسه گیم‌نت' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'شماره صفحه',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'تعداد آیتم در هر صفحه',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'لیست رزروها',
  })
  findByOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('limit', ParseIntPipe) limit = 20,
  ) {
    return this.reservationService.findByOrganization(
      organizationId,
      page,
      limit,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'بروزرسانی رزرو' })
  @ApiParam({ name: 'id', description: 'شناسه رزرو' })
  @ApiResponse({
    status: 200,
    description: 'رزرو بروزرسانی شد',
  })
  @ApiResponse({
    status: 404,
    description: 'رزرو یافت نشد',
  })
  @ApiResponse({
    status: 409,
    description: 'بازه زمانی جدید در دسترس نیست',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ) {
    return this.reservationService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'حذف رزرو' })
  @ApiParam({ name: 'id', description: 'شناسه رزرو' })
  @ApiResponse({
    status: 200,
    description: 'رزرو حذف شد',
  })
  @ApiResponse({
    status: 404,
    description: 'رزرو یافت نشد',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationService.remove(id);
  }

  @Post('check-availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'چک کردن در دسترس بودن یک بازه زمانی' })
  @ApiResponse({
    status: 200,
    description: 'نتیجه availability',
    schema: {
      type: 'object',
      properties: {
        isAvailable: { type: 'boolean' },
      },
    },
  })
  async checkAvailability(@Body() dto: CheckAvailabilityDto) {
    const isAvailable = await this.reservationService.checkAvailability(dto);
    return { isAvailable };
  }

  @Post('search-available')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'جستجوی گیم‌نت‌های قابل رزرو بر اساس مختصات جغرافیایی و فیلترهای مختلف',
  })
  @ApiResponse({
    status: 200,
    description: 'لیست گیم‌نت‌های موجود',
  })
  @ApiResponse({
    status: 400,
    description: 'داده‌های ورودی نامعتبر',
  })
  searchAvailableGamenets(@Body() dto: SearchAvailableGamenetDto) {
    return this.reservationService.searchAvailableGamenets(dto);
  }

  @Get('available-slots/:stationId')
  @ApiOperation({ summary: 'دریافت time slot های موجود برای یک استیشن' })
  @ApiParam({ name: 'stationId', description: 'شناسه استیشن' })
  @ApiQuery({
    name: 'date',
    required: true,
    description: 'تاریخ (ISO 8601 format)',
    example: '2025-01-15',
  })
  @ApiResponse({
    status: 200,
    description: 'لیست time slot های موجود',
  })
  getAvailableTimeSlots(
    @Param('stationId', ParseIntPipe) stationId: number,
    @Query('date') date: string,
  ) {
    return this.reservationService.getAvailableTimeSlots(stationId, date);
  }

  @Post('search/open')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'جستجوی گیم‌نت‌های باز (سازگار با فرانت)',
    description: `
این endpoint برای جستجوی گیم‌نت‌های باز طراحی شده است.

**پارامترهای اجباری:**
- latitude: عرض جغرافیایی کاربر
- longitude: طول جغرافیایی کاربر  
- radiusKm: شعاع جستجو (5, 10, 15, 20, 25, 30)

**پارامترهای اختیاری:**
- date: تاریخ شمسی (فرمت: YYYY/MM/DD مثل 1403/09/15)
- startTime: ساعت شروع (فرمت: HH:mm مثل 14:30)
- endTime: ساعت پایان (فرمت: HH:mm مثل 18:00)
- province: استان
- city: شهر
- consoleId: شناسه کنسول
- gameId: شناسه بازی
- playerCount: تعداد نفرات (1-20)
- limit: محدودیت تعداد نتایج (پیش‌فرض: 20)

**نکته مهم:** تاریخ و زمان به فرمت شمسی و ساعت 24 ساعته ارسال می‌شود.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'لیست گیم‌نت‌های باز با استیشن‌های موجود و availableSlots',
    schema: {
      type: 'object',
      properties: {
        organizations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              uuid: { type: 'string' },
              name: { type: 'string' },
              address: { type: 'string' },
              phoneNumber: { type: 'string' },
              province: { type: 'string' },
              city: { type: 'string' },
              latitude: { type: 'number' },
              longitude: { type: 'number' },
              distance: { type: 'number', description: 'فاصله به کیلومتر' },
              isOpen: { type: 'boolean', description: 'آیا در زمان انتخابی باز است' },
              indexImage: { type: 'string', nullable: true },
              logoImage: { type: 'string', nullable: true },
              stations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number' },
                    title: { type: 'string' },
                    consoleId: { type: 'number' },
                    consoleName: { type: 'string' },
                    consoleCategory: { type: 'string' },
                    capacity: { type: 'number' },
                    status: { type: 'boolean' },
                    pricings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          playerCount: { type: 'number' },
                          price: { type: 'number' },
                        },
                      },
                    },
                    games: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'number' },
                          title: { type: 'string' },
                          coverImage: { type: 'string', nullable: true },
                        },
                      },
                    },
                    availableSlots: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          startTime: { type: 'string', example: '14:30' },
                          endTime: { type: 'string', example: '15:00' },
                          label: { type: 'string', example: '14:30 - 15:00' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            searchParams: { type: 'object' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'فرمت تاریخ یا زمان نامعتبر است یا پارامترهای اجباری ارسال نشده‌اند',
  })
  searchOpenGamenets(@Body() body: SearchAvailableGamenetQueryDto) {
    return this.reservationService.searchOpenGamenets(body);
  }
}

