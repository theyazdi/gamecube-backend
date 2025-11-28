import {
  Controller,
  Get,
  Patch,
  Body,
  Post,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateTaxSettingsDto } from './dto';
import { JwtAuthGuard, RolesGuard, Roles, UserRole } from '../../shared';

@ApiTags('General Settings')
@Controller('general/settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('tax')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'دریافت تنظیمات مالیات',
    description: 'دریافت تنظیمات فعلی مالیات سیستم (فعال/غیرفعال، نرخ، نوع)',
  })
  @ApiResponse({
    status: 200,
    description: 'تنظیمات مالیات',
    schema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'وضعیت فعال/غیرفعال مالیات',
          example: false,
        },
        rate: {
          type: 'number',
          description: 'نرخ مالیات (درصد - 0 تا 100)',
          example: 10,
        },
      },
    },
  })
  async getTaxSettings() {
    return this.settingsService.getTaxSettings();
  }

  @Patch('tax')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'بروزرسانی تنظیمات مالیات (فقط Super Admin)',
    description: `بروزرسانی تنظیمات مالیات سیستم

**دسترسی:** فقط Super Admin

**تنظیمات قابل تغییر:**
- taxEnabled: فعال/غیرفعال کردن مالیات
- taxRate: نرخ مالیات (0 تا 100 درصد)

**نکته:** تغییرات فقط روی فاکتورهای جدید اعمال می‌شود`,
  })
  @ApiResponse({
    status: 200,
    description: 'تنظیمات با موفقیت بروزرسانی شد',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - نیاز به احراز هویت',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - فقط Super Admin دسترسی دارد',
  })
  async updateTaxSettings(@Body() dto: UpdateTaxSettingsDto) {
    return this.settingsService.updateTaxSettings(dto);
  }

}
