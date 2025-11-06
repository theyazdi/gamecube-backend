import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { SmsModule } from '../sms/sms.module';
import { JwtModule } from '../../shared/auth';

@Module({
  imports: [UsersModule, SmsModule, JwtModule],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
