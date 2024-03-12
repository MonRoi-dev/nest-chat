import {
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
    client: Socket,
    payload: { content: string; userId: number },
  ): Promise<void> {
    const { content, userId } = payload;
    const createdMessage = await this.messagesService.create(content, userId);
    this.server.emit('recMessage', createdMessage);
  }
}
