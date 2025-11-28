import { Module } from '@nestjs/common';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { PrismaModule } from '../../shared/database/prisma.module';
import { JwtModule } from '../../shared/auth';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [GeneralController, SettingsController],
  providers: [GeneralService, SettingsService],
  exports: [GeneralService, SettingsService],
})
export class GeneralModule {}

