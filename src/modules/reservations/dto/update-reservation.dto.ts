import { PartialType } from '@nestjs/swagger';
import { CreateReservationDto } from './create-reservation.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReservationDto extends PartialType(CreateReservationDto) {
  @ApiPropertyOptional({
    description: 'Payment status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Approval status by gaming cafe',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAccepted?: boolean;
}

