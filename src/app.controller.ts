import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Render,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { MessagesService } from './messages/messages.service';
import { UsersService } from './users/users.service';
import { RoomsService } from './rooms/rooms.service';
import { Prisma } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as crypto from 'crypto';
import * as mime from 'mime';
import { AuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly roomsServise: RoomsService,
  ) {}

  @Get()
  @Render('index')
  async main(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).redirect('/auth');
    } else {
      const user = await this.authService.verifyToken(token);
      const users = await this.usersService.usersToAdd(user.id);
      return { user, users };
    }
  }

  @UseGuards(AuthGuard)
  @Get('/messages')
  async getMessages(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    const messages = await this.messagesService.read(roomId);
    res.json({ userId, messages });
  }

  @UseGuards(AuthGuard)
  @Get('/contacts')
  async getContacts(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    const users = await this.usersService.usersToAdd(userId);
    res.json({ users });
  }

  @UseGuards(AuthGuard)
  @Post('/contacts/:id')
  async addContact(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    await this.roomsServise.createRoom(userId, id);
    return res.redirect('/');
  }

  @UseGuards(AuthGuard)
  @Patch('/user')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './public/images',
        filename(req, file, cb) {
          crypto.randomBytes(16, function (err, raw) {
            if (err) throw err;
            cb(null, raw.toString('hex') + '.' + mime.extension(file.mimetype));
          });
        },
      }),
    }),
  )
  async userUpdate(
    @Req() req: Request,
    @Body() data: Prisma.UserUpdateInput,
    @UploadedFile()
    image?: Express.Multer.File,
  ): Promise<void> {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    await this.usersService.updateUser(userId, data, image?.filename);
  }
}
