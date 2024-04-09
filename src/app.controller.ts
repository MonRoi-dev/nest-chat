import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Redirect,
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

  @Get('/')
  async main(@Req() req: Request, @Res() res: Response): Promise<void> {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).redirect('/auth');
    } else {
      const user = await this.authService.verifyToken(token);
      const users = await this.usersService.usersToAdd(user.id);
      return res.render('index', { user, users });
    }
  }

  @UseGuards(AuthGuard)
  @Get('/messages')
  async getMessages(
    @Query('roomId', ParseIntPipe) roomId: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    const messages = await this.messagesService.getMessages(roomId);
    return res.json({ userId, messages });
  }

  @UseGuards(AuthGuard)
  @Get('/contacts')
  async getContacts(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    const users = await this.usersService.usersToAdd(userId);
    return res.json({ users });
  }

  @UseGuards(AuthGuard)
  @Post('/contacts/:id')
  @Redirect('/')
  async addContact(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    await this.roomsServise.createRoom(userId, id);
    res.status(200);
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
    @Res() res: Response,
    @Body() data: Prisma.UserUpdateInput,
    @UploadedFile()
    image?: Express.Multer.File,
  ): Promise<void> {
    const token = req.cookies.token;
    const { id: userId } = await this.authService.verifyToken(token);
    await this.usersService.updateUser(userId, data, image?.filename);
    res.status(200);
  }
}
