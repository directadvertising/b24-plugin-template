import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    const jwtSecret = this.configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new HttpException(
        { error: 'JWT_SECRET is not configured' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new HttpException(
        { error: 'Authorization header missing' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      throw new HttpException(
        { error: 'Invalid token format' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = tokenParts[1];

    try {
      const decoded = jwt.verify(token, jwtSecret);
      (request as any).user = decoded;
      return true;
    } catch {
      throw new HttpException(
        { error: 'Invalid or expired token' },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
