import { Module } from '@nestjs/common';
import { GeneralController } from './general.controller';
import { GeneralService } from './general.service';
import { PrismaModule } from '../../shared/database/prisma.module';
import { JwtModule } from '../../shared/auth';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [GeneralController],
  providers: [GeneralService],
  exports: [GeneralService],
})
export class GeneralModule {}

