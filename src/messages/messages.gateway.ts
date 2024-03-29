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

@WebSocketGateway()
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
    client: Socket,
    @MessageBody()
    payload: { content: string; userId: number; roomId: number },
  ): Promise<void> {
    const createdMessage = await this.messagesService.create(
      payload.content,
      payload.userId,
      +payload.roomId,
    );
    this.server
      .to(payload.roomId.toString())
      .emit('recMessage', createdMessage);
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
  async handleTyping(socket: Socket, roomId: number) {
    socket.broadcast.to(roomId.toString()).emit('isTyping', roomId);
  }

  @SubscribeMessage('notTyping')
  async handleNotTyping(socket: Socket, roomId: number) {
    socket.broadcast.to(roomId.toString()).emit('notTyping');
  }

  async handleConnection(client: Socket) {
    client.emit('connected');
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const { token } = cookie.parse(client.handshake.headers.cookie);
      const { id } = await this.authServise.verifyToken(token);
      await this.usersServise.updateSocket(id, client.id);
    }
  }

  async handleDisconnect(client: Socket) {
    client.emit('disconnected');
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const { token } = cookie.parse(client.handshake.headers.cookie);
      const { id } = await this.authServise.verifyToken(token);
      await this.usersServise.updateSocket(id, '');
    }
  }
}
