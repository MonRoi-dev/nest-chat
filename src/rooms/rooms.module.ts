import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { PrismaModule } from 'src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
