import { Injectable } from '@nestjs/common';
import { Prisma, Room, User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({ data });
  }

  async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        rooms: {
          include: {
            rooms: {
              include: {
                users: {
                  where: { userId: { not: id } },
                  include: { users: true },
                },
                messages: { orderBy: { createdAt: 'desc' } },
              },
            },
          },
        },
      },
    });
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  async usersToAdd(userId: number): Promise<User[] | null> {
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          not: userId,
        },
        rooms: {
          every: {
            rooms: {
              users: {
                every: {
                  NOT: {
                    userId: userId,
                  },
                },
              },
            },
          },
        },
      },
    });
    return users;
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
