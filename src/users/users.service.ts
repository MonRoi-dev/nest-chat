import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
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
                messages: { orderBy: { createdAt: 'desc' }, take: 1 },
              },
            },
          },
        },
      },
    });
    user.rooms.sort(
      (a, b) =>
        new Date(b.rooms.messages[0]?.createdAt).getTime() -
        new Date(a.rooms.messages[0]?.createdAt).getTime(),
    );
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user;
  }

  async usersToAdd(userId: number): Promise<User[]> {
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
}
