import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user: User = await this.userService.findByEmail(email);
    const pass = await bcrypt.compare(password, user.password);
    if (user && pass) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...data } = user;
      return data;
    }
    return null;
  }

  async register(data: Prisma.UserCreateInput) {
    const user: User = await this.userService.findByEmail(data.email);
    console.log(data.email);
    if (user) {
      throw new HttpException(
        'User with that email already exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    const password = await bcrypt.hash(data.password, 4);
    const createdUser: User = await this.userService.create({
      ...data,
      password,
    });
    return await this.login(createdUser);
  }

  async login(data: Prisma.UserUncheckedCreateWithoutMessagesInput) {
    const user = await this.userService.findByEmail(data.email);
    const payload: { id: number; email: string; username: string } = {
      id: user.id,
      email: user.email,
      username: user.username,
    };
    return await this.jwtService.signAsync(payload);
  }
}
