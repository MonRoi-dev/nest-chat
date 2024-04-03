import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  OnGatewayDisconnect,
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
  WsException,
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
    @ConnectedSocket() socket: Socket,
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
    const uploadedImage = await this.messagesService.createMessage(
      imageName,
      payload.userId,
      +payload.roomId,
      true,
    );
    this.server.to(payload.roomId.toString()).emit('recMessage', uploadedImage);
  }

  @SubscribeMessage('editMessage')
  async editMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: {
      content: string;
      messageId: number;
      roomId: number;
    },
  ): Promise<void> {
    const editedMessage = await this.messagesService.editMessage(
      +payload.messageId,
      payload.content,
    );
    this.server
      .to(payload.roomId.toString())
      .emit('updateMessage', editedMessage);
  }

  @SubscribeMessage('deleteMessage')
  async deleteMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { messageId: string; roomId: number },
  ): Promise<void> {
    const deletedMessage = await this.messagesService.deleteMessage(
      +payload.messageId,
    );
    this.server
      .to(payload.roomId.toString())
      .emit('deleteMessage', deletedMessage);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    payload: { roomId: string; userId: number },
  ): Promise<void> {
    socket.join(payload.roomId);
    const room = await this.roomsService.getRoomById(
      +payload.roomId,
      payload.userId,
    );
    if (room) {
      socket.emit('roomJoining', room);
      socket.emit('notTyping');
    } else {
      throw new WsException("Room doesn't exist");
    }
  }

  @SubscribeMessage('leaveRoom')
  leaveRoom(
    @ConnectedSocket()
    socket: Socket,
    @MessageBody()
    roomId: string,
  ) {
    const rooms = [...socket.rooms].filter((room: string) => room != roomId);
    rooms.forEach((room) => {
      socket.leave(room);
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: number,
  ) {
    socket.broadcast.to(roomId.toString()).emit('isTyping', socket.id);
  }

  @SubscribeMessage('notTyping')
  handleNotTyping(
    @ConnectedSocket() socket: Socket,
    @MessageBody() roomId: number,
  ) {
    socket.broadcast.to(roomId.toString()).emit('notTyping', socket.id);
  }

  async handleConnection(@ConnectedSocket() socket: Socket): Promise<boolean> {
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const { token } = cookie.parse(socket.handshake.headers.cookie);
      const { id } = await this.authServise.verifyToken(token);
      await this.usersServise.updateSocket(id, socket.id);
    }
    return socket.emit('connected');
  }

  async handleDisconnect(@ConnectedSocket() socket: Socket): Promise<boolean> {
    const cookies = socket.handshake.headers.cookie;
    if (cookies) {
      const { token } = cookie.parse(socket.handshake.headers.cookie);
      const { id } = await this.authServise.verifyToken(token);
      await this.usersServise.updateSocket(id, '');
    }
    return socket.emit('disconnected');
  }
}
