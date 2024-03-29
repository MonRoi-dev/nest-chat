import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessagesGateway } from './messages.gateway';
import { RoomsModule } from 'src/rooms/rooms.module';
import { UsersModule } from 'src/users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, RoomsModule, UsersModule, AuthModule],
  providers: [MessagesService, MessagesGateway],
  exports: [MessagesService],
})
export class MessagesModule {}
