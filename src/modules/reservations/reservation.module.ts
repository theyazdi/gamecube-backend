import { Module } from '@nestjs/common';
import { ReservationService } from './reservation.service';
import { ReservationSearchService } from './reservation-search.service';
import { SessionCleanupService } from './session-cleanup.service';
import { ReservationController } from './reservation.controller';
import { PrismaModule } from '../../shared/database/prisma.module';
import { JwtModule } from '../../shared/auth/jwt.module';
import { GeneralModule } from '../general/general.module';

@Module({
  imports: [PrismaModule, JwtModule, GeneralModule],
  controllers: [ReservationController],
  providers: [
    ReservationService,
    ReservationSearchService,
    SessionCleanupService,
  ],
  exports: [ReservationService],
})
export class ReservationModule {}

