import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/database';
import { UsersModule } from './modules/users';
import { AuthModule } from './modules/auth';
import { SmsModule } from './modules/sms';
import { OrganizationsModule } from './modules/organizations';
import { GamesModule } from './modules/games';
import { ConsolesModule } from './modules/consoles';
import { StationsModule } from './modules/stations';
import { FtpModule } from './modules/ftp';
import { JwtModule } from './shared/auth';
import { LocationModule } from './modules/location/location.module';
import { GeneralModule } from './modules/general';
import { ReservationModule } from './modules/reservations';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    JwtModule,
    UsersModule,
    AuthModule,
    SmsModule,
    OrganizationsModule,
    GamesModule,
    ConsolesModule,
    StationsModule,
    FtpModule,
    LocationModule,
    GeneralModule,
    ReservationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
