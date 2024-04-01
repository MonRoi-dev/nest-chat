import {
  Controller,
  Post,
  Body,
  Res,
  Redirect,
  Get,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/')
  async getAuth(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(200).render('auth');
    } else {
      return res.redirect('/');
    }
  }

  @Post('login')
  @Redirect('/')
  async login(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    const token = await this.authService.login(data);
    res.cookie('token', token, { maxAge: 60 * 60 * 1000 * 24 });
  }

  @Post('logout')
  @Redirect('/auth')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
  }

  @Post('register')
  @Redirect('/')
  async register(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    const token = await this.authService.register(data);
    res.cookie('token', token, { maxAge: 60 * 60 * 1000 * 24 });
  }
}
