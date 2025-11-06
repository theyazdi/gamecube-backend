import { Module } from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { UserOrganizationService } from './user-organization.service';
import { UserOrganizationController } from './user-organization.controller';
import { OrganizationManagerGuard } from '../../shared/guards/organization-manager.guard';
import { JwtModule } from '../../shared/auth';
import { PrismaModule } from '../../shared/database';

@Module({
  imports: [PrismaModule, JwtModule],
  controllers: [OrganizationController, UserOrganizationController],
  providers: [OrganizationService, UserOrganizationService, OrganizationManagerGuard],
  exports: [OrganizationService, UserOrganizationService, OrganizationManagerGuard],
})
export class OrganizationsModule {}
