import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { JwtService } from '../auth/jwt.service';
import { PrismaService } from '../database';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    
    const authHeader = request.headers['authorization'] as string;
    
    if (!authHeader) {
      throw new UnauthorizedException('Authorization header is required');
    }

    // Extract token from header
    const token = this.jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      throw new UnauthorizedException('Invalid authorization header format');
    }

    try {
      // Validate JWT token
      const payload = this.jwtService.verifyToken(token);
      
      // Fetch user from database to get latest roles
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          uuid: true,
          phone: true,
          roles: true,
          isPhoneVerified: true,
          isEmailVerified: true,
          isVerified: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Add user data to request with real-time roles from database
      request.user = {
        id: user.id,
        uuid: user.uuid,
        phone: user.phone,
        roles: user.roles,
        isPhoneVerified: user.isPhoneVerified,
        isEmailVerified: user.isEmailVerified,
        isVerified: user.isVerified,
      };
      
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
