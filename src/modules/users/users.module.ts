import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserPanelController } from './user-panel.controller';
import { UserService } from './user.service';
import { JwtModule } from '../../shared/auth';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [JwtModule, OrganizationsModule],
  controllers: [UserController, UserPanelController],
  providers: [UserService],
  exports: [UserService],
})
export class UsersModule {}
