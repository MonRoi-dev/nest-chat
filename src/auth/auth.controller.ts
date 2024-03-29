import {
  Controller,
  Post,
  Body,
  Res,
  Redirect,
  Render,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/')
  @Render('auth')
  async getAuth(@Res() res: Response) {
    return res.status(200);
  }

  @Post('login')
  @Redirect('/')
  async login(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    const token = await this.authService.login(data);
    res.cookie('token', token, { maxAge: 60 * 60 * 1000 * 24 });
  }

  @UseGuards(AuthGuard)
  @Post('logout')
  @Redirect('/auth')
  async logout(@Res() res: Response) {
    res.clearCookie('token');
    res.redirect('/auth');
  }

  @Post('register')
  @Redirect('/')
  async register(@Body() data: Prisma.UserCreateInput, @Res() res: Response) {
    const token = await this.authService.register(data);
    res.cookie('token', token, { maxAge: 60 * 60 * 1000 * 24 });
  }
}
