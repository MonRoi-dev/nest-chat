import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagesService } from './messages.service';

@WebSocketGateway()
export class MessagesGateway {
  constructor(private readonly messagesService: MessagesService) {}

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
    this.server.to(`${payload.roomId}`).emit('recMessage', createdMessage);
  }

  @SubscribeMessage('joinRoom')
  joinRoom(socket: Socket, roomId: string) {
    socket.join(roomId);
  }
}
