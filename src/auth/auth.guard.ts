import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const token = req.cookies.token;
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const user = await this.authService.verifyToken(token);
      if (user) {
        return true;
      }
    } catch {
      throw new UnauthorizedException();
    }
  }
}
