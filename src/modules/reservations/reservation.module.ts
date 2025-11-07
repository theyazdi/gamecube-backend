import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationSearchService } from './reservation-search.service';
import { ReservationController } from './reservation.controller';
import { PrismaModule } from '../../shared/database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReservationController],
  providers: [ReservationService, ReservationSearchService],
  exports: [ReservationService],
})
export class ReservationModule {}

