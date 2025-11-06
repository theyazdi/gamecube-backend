import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { JwtModule } from '../../shared/auth';
import { PrismaModule } from '../../shared/database';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [GameController],
  providers: [GameService],
  exports: [GameService],
})
export class GamesModule {}
