import { SetMetadata } from '@nestjs/common';
import { UserRole, ROLES_KEY } from './roles.enum';

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
