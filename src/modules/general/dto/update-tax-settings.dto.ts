import { IsBoolean, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaxSettingsDto {
  @ApiProperty({
    description: 'فعال یا غیرفعال کردن محاسبه مالیات',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  taxEnabled?: boolean;

  @ApiProperty({
    description: 'نرخ مالیات (درصد بین 0 تا 100)',
    example: 10,
    minimum: 0,
    maximum: 100,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;
}
