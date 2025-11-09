import {
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { convertPersianToEnglishNumbers } from '../../../shared/utils/date-converter.util';

export class SearchAvailableStationsDto {
  @ApiProperty({
    description: 'Jalali date (format: YYYY/MM/DD e.g. 1403/09/15)',
    example: '1403/09/15',
  })
  @Transform(({ value }) => convertPersianToEnglishNumbers(value))
  @IsString()
  @Matches(/^\d{4}\/\d{2}\/\d{2}$/, {
    message: 'Date format must be YYYY/MM/DD',
  })
  date: string;

  @ApiProperty({
    description: 'Start time (format: HH:mm e.g. 14:30)',
    example: '14:30',
  })
  @Transform(({ value }) => convertPersianToEnglishNumbers(value))
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time format must be HH:mm',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time (format: HH:mm e.g. 18:00)',
    example: '18:00',
  })
  @Transform(({ value }) => convertPersianToEnglishNumbers(value))
  @IsString()
  @Matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time format must be HH:mm',
  })
  endTime: string;

  @ApiProperty({
    description: 'Gaming cafe username',
    example: 'gamenet_tehran_01',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Console ID',
    example: 2,
  })
  @Type(() => Number)
  @IsInt()
  consoleId: number;

  @ApiPropertyOptional({
    description: 'Game ID',
    example: 123,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gameId?: number;

  @ApiPropertyOptional({
    description: 'Number of players',
    example: 4,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  playerCount?: number;
}
