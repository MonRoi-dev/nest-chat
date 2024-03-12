import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async verifyToken(token: string): Promise<User> {
    const tokenData = await this.jwtService.verifyAsync(token);
    const userData = await this.usersService.findById(tokenData.id);
    return userData;
  }
}
