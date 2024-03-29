import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    content: string,
    userId: number,
    roomId: number,
  ): Promise<Message> {
    return await this.prisma.message.create({
      data: {
        content,
        user: { connect: { id: userId } },
        room: { connect: { id: roomId } },
      },
    });
  }

  async read(roomId: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: { roomId },
    });
  }
}
