import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async createMessage(
    content: string,
    userId: number,
    roomId: number,
    isImage: boolean = false,
  ): Promise<Message> {
    return await this.prisma.message.create({
      data: {
        content,
        isImage,
        user: { connect: { id: userId } },
        room: { connect: { id: roomId } },
      },
    });
  }

  async getMessages(roomId: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async editMessage(id: number, content: string): Promise<Message> {
    return await this.prisma.message.update({
      where: { id },
      data: { content },
    });
  }

  async deleteMessage(id: number): Promise<Message> {
    return await this.prisma.message.delete({ where: { id } });
  }
}
