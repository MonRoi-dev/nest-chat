import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Request, Response } from 'express';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { RoomsService } from './rooms/rooms.service';
import { MessagesService } from './messages/messages.service';
import { PrismaService } from './database/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AppController', () => {
  let appController: AppController;

  const mockUser = {
    id: 1,
    username: 'John Doe',
  };

  const mockRequestToken = {
    cookies: {
      token: 'Token',
    },
  } as unknown as Request;

  const mockRequest = {
    cookies: {
      token: '',
    },
  } as unknown as Request;

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    redirect: jest.fn(),
    render: jest.fn(),
    json: jest.fn(),
  } as unknown as Response;

  const mockUsers = [{ id: 2, username: 'Jane Doe' }];

  const mockAuthService = {
    verifyToken: jest.fn().mockReturnValue(mockUser),
  };

  const mockUsersService = {
    usersToAdd: jest.fn().mockReturnValue(mockUsers),
    updateUser: jest.fn().mockReturnValue(mockUser),
  };

  const mockMessages = [{ id: 2, content: 'content' }];

  const mockMessagesService = {
    getMessages: jest.fn().mockReturnValue(mockMessages),
  };

  const mockRoomsService = {
    createRoom: jest.fn().mockReturnValue({ id: 1 }),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: MessagesService, useValue: mockMessagesService },
        { provide: RoomsService, useValue: mockRoomsService },
        JwtService,
        PrismaService,
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getIndex', () => {
    it('should return status 401 and redirect to /auth', () => {
      appController.main(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/auth');
    });

    it('should render index and return user and users', async () => {
      await appController.main(mockRequestToken, mockResponse);
      expect(mockResponse.render).toHaveBeenCalledWith('index', {
        user: mockUser,
        users: mockUsers,
      });
    });
  });

  describe('getMessages', () => {
    it('should return json with userId and messages', async () => {
      await appController.getMessages(
        +mockRequestToken,
        mockRequestToken,
        mockResponse,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        userId: mockUser.id,
        messages: mockMessages,
      });
    });
  });

  describe('getContacts', () => {
    it('should return json with users', async () => {
      await appController.getContacts(mockRequestToken, mockResponse);
      expect(mockResponse.json).toHaveBeenCalledWith({
        users: mockUsers,
      });
    });

    it('should return status 200', async () => {
      await appController.addContact(
        +mockRequestToken,
        mockRequestToken,
        mockResponse,
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('userUpdate', () => {
    it('should return status 200', async () => {
      await appController.userUpdate(mockRequestToken, mockResponse, mockUser);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
