import { Controller, Get, Render, Req, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { MessagesService } from './messages/messages.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly messagesService: MessagesService,
  ) {}

  @Get()
  @Render('index')
  async main(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies.token;
    if (token) {
      const user = await this.appService.verifyToken(token);
      return { user };
    } else {
      res.redirect('/auth');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/profile')
  async profile(@Res() res: Response) {
    return res.json({ message: 'profile' });
  }

  @Get('/messages')
  async getMessages(@Res() res: Response, @Req() req: Request) {
    const token = req.cookies.token;
    const { id: userId } = await this.appService.verifyToken(token);
    const messages = await this.messagesService.read();
    res.json({ userId, messages });
  }
}
