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
    return await this.prismaService.message.create({
      data: {
        content,
        user: { connect: { id: userId } },
        room: { connect: { id: roomId } },
      },
    });
  }

  async read(roomId: number, userId: number): Promise<Message[] | null> {
    return await this.prismaService.message.findMany({
      where: { roomId },
      include: {
        room: {
          include: {
            users: {
              where: { userId: { not: userId } },
              include: { users: true },
            },
          },
        },
      },
    });
  }
}
