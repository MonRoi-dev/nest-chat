import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(
    content: string,
    userId: number,
    roomId: number,
  ): Promise<Message> {
    console.log(roomId);
    return await this.prismaService.message.create({
      data: {
        content,
        user: { connect: { id: userId } },
        room: { connect: { id: roomId } },
      },
    });
  }

  async read(roomId: number): Promise<Message[] | null> {
    return await this.prismaService.message.findMany({ where: { roomId } });
  }
}
