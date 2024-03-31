import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  OnGatewayDisconnect,
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { RoomsService } from 'src/rooms/rooms.service';
import { UsersService } from 'src/users/users.service';
import { AuthService } from 'src/auth/auth.service';
import * as cookie from 'cookie';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as path from 'path';
import { Message } from '@prisma/client';

@WebSocketGateway({ cors: true })
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
    private readonly usersServise: UsersService,
    private readonly authServise: AuthService,
  ) {}

  @WebSocketServer() server: Server;

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    payload: { content: string; userId: number; roomId: number },
  ): Promise<void> {
    const createdMessage = await this.messagesService.createMessage(
      payload.content,
      payload.userId,
      +payload.roomId,
    );
    this.server
      .to(payload.roomId.toString())
      .emit('recMessage', createdMessage);
  }

  @SubscribeMessage('sendImage')
  async handleImage(
    @ConnectedSocket() socke: Socket,
    @MessageBody()
    payload: {
      userId: number;
      roomId: number;
      filename: string;
      data: ArrayBuffer;
    },
  ): Promise<void> {
    const buffer = Buffer.from(new Uint8Array(payload.data));
    const fileExtension = path.extname(payload.filename);
    const randomName = crypto.randomBytes(16).toString('hex');
    const imageName = randomName + fileExtension;
    const imagePath = path
      .join(__dirname, `../public/images/messages/`)
      .replace('\\dist', '');
    fs.writeFile(`${imagePath + imageName}`, buffer, (err) => {
      if (err) throw err;
    });
    await this.messagesService.createMessage(
      imageName,
      payload.userId,
      +payload.roomId,
      true,
    );
  }

  @SubscribeMessage('editMessage')
  async editMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: Message,
  ): Promise<void> {
    await this.messagesService.editMessage(message.id, message);
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() message: Message,
  ): Promise<void> {
    await this.messagesService.deleteMessage(message.id);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    socket: Socket,
    payload: { roomId: string; userId: number },
  ): Promise<void> {
    socket.join(payload.roomId);
    const room = await this.roomsService.getRoomById(
      +payload.roomId,
      payload.userId,
    );
    socket.emit('roomJoining', room);
    socket.emit('notTyping');
  }

  @SubscribeMessage('typing')
  async handleTyping(socket: Socket, roomId: number): Promise<void> {
    socket.broadcast.to(roomId.toString()).emit('isTyping', roomId);
  }

  @SubscribeMessage('notTyping')
  async handleNotTyping(socket: Socket, roomId: number): Promise<void> {
    socket.broadcast.to(roomId.toString()).emit('notTyping');
  }

  async handleConnection(socket: Socket): Promise<void> {
    socket.emit('connected');
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const { token } = cookie.parse(socket.handshake.headers.cookie);
      const { id } = await this.authServise.verifyToken(token);
      await this.usersServise.updateSocket(id, socket.id);
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    socket.emit('disconnected');
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const { token } = cookie.parse(socket.handshake.headers.cookie);
      const { id } = await this.authServise.verifyToken(token);
      await this.usersServise.updateSocket(id, '');
    }
  }
}
