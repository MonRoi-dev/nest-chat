import { Injectable } from '@nestjs/common';
import { Message } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(content: string, userId: number): Promise<Message> {
    return await this.prismaService.message.create({
      data: { content, user: { connect: { id: userId } } },
    });
  }

  async read() {
    return await this.prismaService.message.findMany();
  }
}
