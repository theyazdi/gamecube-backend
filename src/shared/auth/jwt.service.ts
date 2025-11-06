import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

export interface JwtPayload {
  sub: number; // user id
  phone: string;
  roles: string[];
  iat?: number;
  exp?: number;
}

export interface JwtResponse {
  accessToken: string;
  expiresIn: string;
}

@Injectable()
export class JwtService {
  constructor(private jwtService: NestJwtService) {}

  /**
   * Generate JWT token for user
   * @param userId User ID
   * @param phone Phone number
   * @param roles User roles
   * @returns JWT token and expiration info
   */
  generateToken(userId: number, phone: string, roles: string[]): JwtResponse {
    const payload: JwtPayload = {
      sub: userId,
      phone,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '7d', // 7 days
    });

    return {
      accessToken,
      expiresIn: '7d',
    };
  }

  /**
   * Verify and decode JWT token
   * @param token JWT token
   * @returns User information from token
   */
  verifyToken(token: string): JwtPayload {
    return this.jwtService.verify(token);
  }

  /**
   * Extract token from Authorization header
   * @param authHeader Authorization header value
   * @returns JWT token or null
   */
  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove "Bearer "
  }
}
