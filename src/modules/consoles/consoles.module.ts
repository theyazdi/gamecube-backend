import { Module } from '@nestjs/common';
import { ConsoleController } from './console.controller';
import { ConsoleService } from './console.service';
import { JwtModule } from '../../shared/auth';
import { PrismaModule } from '../../shared/database';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [ConsoleController],
  providers: [ConsoleService],
  exports: [ConsoleService],
})
export class ConsolesModule {}
