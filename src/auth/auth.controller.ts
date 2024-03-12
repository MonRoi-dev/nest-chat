import {
  Controller,
  Post,
  Body,
  UseGuards,
  Res,
  Redirect,
  Render,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
import { LocalAuthGuard } from './local-auth.guard';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/')
  @Render('auth')
  async getAuth() {
    return {};
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @Redirect('/')
  async login(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    const token = await this.authService.login(data);
    res.cookie('token', token, { maxAge: 60 * 60000 });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    res.redirect('/auth');
  }

  @Post('register')
  @Redirect('/')
  async register(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    const token = await this.authService.register(data);
    res.cookie('token', token, { maxAge: 60 * 60000 });
  }
}
