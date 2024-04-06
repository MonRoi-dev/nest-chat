import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user: User = await this.usersService.findByEmail(email);
    if (!user) {
      throw new HttpException(
        `User with email: ${email} not found`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const pass = await bcrypt.compare(password, user.password);
    if (!pass) {
      throw new HttpException('Wrond password', HttpStatus.UNAUTHORIZED);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPass, ...data } = user;
    return data;
  }

  async register(data: Prisma.UserCreateInput) {
    const user: User = await this.usersService.findByEmail(data.email);
    if (user) {
      throw new HttpException(
        'User with that email already exist',
        HttpStatus.BAD_REQUEST,
      );
    }
    const password = await bcrypt.hash(data.password, 4);
    const createdUser: User = await this.usersService.create({
      ...data,
      password,
    });
    return await this.login(createdUser);
  }

  async login(data: Prisma.UserUncheckedCreateWithoutMessagesInput) {
    const user = await this.usersService.findByEmail(data.email);
    const payload: { id: number; email: string } = {
      id: user.id,
      email: user.email,
    };
    return await this.jwtService.signAsync(payload);
  }

  async verifyToken(token: string): Promise<User> {
    if (!token) {
      throw new BadRequestException();
    }
    const tokenData = await this.jwtService.verifyAsync(token);
    const userData = await this.usersService.findById(tokenData.id);
    return userData;
  }
}
