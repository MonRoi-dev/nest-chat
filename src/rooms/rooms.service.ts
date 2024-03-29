import { Injectable } from '@nestjs/common';
import { Room } from '@prisma/client';
import { PrismaService } from 'src/database/prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoomById(roomId: number, userId: number): Promise<Room> {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: {
        users: { where: { userId: { not: userId } }, include: { users: true } },
      },
    });
    return room;
  }

  async createRoom(firstId: number, secondId: number): Promise<Room> {
    const room = await this.prisma.room.create({
      data: {
        users: {
          create: [
            { users: { connect: { id: firstId } } },
            { users: { connect: { id: secondId } } },
          ],
        },
      },
    });
    return room;
  }
}
