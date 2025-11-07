import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsBoolean, IsString, IsOptional, Min, Max, Matches, ValidateIf, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum DayOfWeek {
  SATURDAY = 0,
  SUNDAY = 1,
  MONDAY = 2,
  TUESDAY = 3,
  WEDNESDAY = 4,
  THURSDAY = 5,
  FRIDAY = 6,
}

export class WorkingHoursDto {
  @ApiProperty({
    description: 'Day of week (0=Saturday, 1=Sunday, 2=Monday, 3=Tuesday, 4=Wednesday, 5=Thursday, 6=Friday)',
    example: 0,
    minimum: 0,
    maximum: 6,
  })
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @ApiProperty({
    description: 'Is the organization closed on this day',
    example: false,
  })
  @IsBoolean()
  isClosed: boolean;

  @ApiProperty({
    description: 'Is the organization open 24 hours on this day',
    example: false,
  })
  @IsBoolean()
  is24Hours: boolean;

  @ApiPropertyOptional({
    description: 'Start time in HH:MM format (required if not closed and not 24 hours)',
    example: '09:00',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @ValidateIf((o) => !o.isClosed && !o.is24Hours)
  @Transform(({ value }) => {
    if (typeof value === 'string' && value) {
      // Convert Persian digits to English digits
      const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
      const englishDigits = '0123456789';
      return value.replace(/[۰-۹]/g, (d) => {
        const index = persianDigits.indexOf(d);
        return index !== -1 ? englishDigits[index] : d;
      });
    }
    return value;
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:MM format (e.g., 09:00)',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:MM format (required if not closed and not 24 hours)',
    example: '22:00',
    pattern: '^([0-1][0-9]|2[0-3]):[0-5][0-9]$',
  })
  @IsOptional()
  @ValidateIf((o) => !o.isClosed && !o.is24Hours)
  @Transform(({ value }) => {
    if (typeof value === 'string' && value) {
      // Convert Persian digits to English digits
      const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
      const englishDigits = '0123456789';
      return value.replace(/[۰-۹]/g, (d) => {
        const index = persianDigits.indexOf(d);
        return index !== -1 ? englishDigits[index] : d;
      });
    }
    return value;
  })
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'endTime must be in HH:MM format (e.g., 22:00)',
  })
  endTime?: string;
}

export class CreateWorkingHoursDto {
  @ApiProperty({
    description: 'Array of working hours for each day of the week',
    type: [WorkingHoursDto],
    example: [
      { dayOfWeek: 0, isClosed: false, is24Hours: false, startTime: '09:00', endTime: '22:00' },
      { dayOfWeek: 1, isClosed: false, is24Hours: true, startTime: null, endTime: null },
      { dayOfWeek: 2, isClosed: true, is24Hours: false, startTime: null, endTime: null },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto[];
}

export class UpdateWorkingHoursDto {
  @ApiProperty({
    description: 'Array of working hours for each day of the week',
    type: [WorkingHoursDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto[];
}

export class WorkingHoursResponseDto {
  @ApiProperty({
    description: 'Working hours ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Organization ID',
    example: 1,
  })
  organizationId: number;

  @ApiProperty({
    description: 'Day of week',
    example: 0,
  })
  dayOfWeek: number;

  @ApiProperty({
    description: 'Is closed',
    example: false,
  })
  isClosed: boolean;

  @ApiProperty({
    description: 'Is 24 hours',
    example: false,
  })
  is24Hours: boolean;

  @ApiPropertyOptional({
    description: 'Start time',
    example: '09:00',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time',
    example: '22:00',
  })
  endTime?: string;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}

