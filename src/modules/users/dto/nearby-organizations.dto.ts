import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsLatitude, IsLongitude, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FindNearbyOrganizationsDto {
  @ApiProperty({
    description: 'Latitude coordinate of user location',
    example: 35.6998,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitude: number;

  @ApiProperty({
    description: 'Longitude coordinate of user location',
    example: 51.3183,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @IsLongitude()
  longitude: number;

  @ApiProperty({
    description: 'Search radius in kilometers',
    example: 10,
    minimum: 0.1,
    maximum: 1000,
    type: Number,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radius: number;
}

