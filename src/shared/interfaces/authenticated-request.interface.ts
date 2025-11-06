import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    uuid: string;
    phone: string;
    roles: string[];
    isPhoneVerified: boolean;
    isEmailVerified: boolean;
    isVerified: boolean;
  };
}




