import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';
import { RoomsService } from 'src/rooms/rooms.service';

@WebSocketGateway()
export class MessagesGateway {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
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
}
