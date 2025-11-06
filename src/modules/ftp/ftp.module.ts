import { Module } from '@nestjs/common';
import { FtpController } from './ftp.controller';
import { FtpService } from './ftp.service';

@Module({
  controllers: [FtpController],
  providers: [FtpService],
  exports: [FtpService],
})
export class FtpModule {}
