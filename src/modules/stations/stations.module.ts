import { Module } from '@nestjs/common';
import { StationController } from './station.controller';
import { StationService } from './station.service';
import { JwtModule } from '../../shared/auth';
import { PrismaModule } from '../../shared/database';
import { OrganizationManagerGuard } from '../../shared/guards/organization-manager.guard';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [StationController],
  providers: [StationService, OrganizationManagerGuard],
  exports: [StationService],
})
export class StationsModule {}
