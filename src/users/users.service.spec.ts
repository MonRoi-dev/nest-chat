import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from 'src/database/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockUser = {
    data: {
      username: 'user',
      email: 'email@mail.com',
      password: 'password',
    },
  };

  const mockUserId = 1;

  const mockFindedUser = {
    id: mockUserId,
    username: 'user',
    email: 'email@mail.com',
    password: 'password',
    image: 'avatar.jpg',
    socketId: '12345',
    createdAt: new Date(),
    updatedAt: new Date(),
    rooms: [],
    messages: [],
  };

  const mockPrismaService = {
    user: {
      create: jest.fn().mockReturnValueOnce(mockUser),
      findUnique: jest.fn((value: number | string, field: string) => {
        if (value === mockFindedUser[field]) {
          return mockFindedUser;
        }
      }),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(prismaService).toBeDefined();
  });

  describe('create user', () => {
    it('should create user', async () => {
      await service.create({
        username: 'user',
        email: 'email@mail.com',
        password: 'password',
      });
      expect(prismaService.user.create).toHaveBeenCalledWith(mockUser);
    });
  });

  describe('find users', () => {
    it('should return user with the same id as provided', async () => {
      await service.findById(mockUserId);
      expect(mockPrismaService.user.findUnique(mockUserId, 'id')).toBe(
        mockFindedUser,
      );
    });

    it('should return user with the same email as provided', async () => {
      await service.findByEmail(mockUser.data.email);
      expect(
        mockPrismaService.user.findUnique(mockUser.data.email, 'email'),
      ).toBe(mockFindedUser);
    });

    it('should return users without user with the provided id', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 1, name: 'User1' },
        { id: 2, name: 'User2' },
      ]);
      const users = await service.usersToAdd(mockUserId);
      expect(users).toEqual([
        { id: 1, name: 'User1' },
        { id: 2, name: 'User2' },
      ]);
    });
  });
});
