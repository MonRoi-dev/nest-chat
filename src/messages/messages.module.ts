import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessagesGateway } from './messages.gateway';
import { RoomsModule } from 'src/rooms/rooms.module';

@Module({
  imports: [PrismaModule, RoomsModule],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
