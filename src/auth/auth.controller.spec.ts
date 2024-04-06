import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { AppService } from 'src/app.service';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/database/prisma.service';

const mockRequest = {
  cookies: {
    token: '',
  },
} as unknown as Request;

const mockRequestToken = {
  cookies: {
    token: 'token',
  },
} as unknown as Request;

const mockResponse = {
  status: jest.fn().mockReturnThis(),
  render: jest.fn(),
  redirect: jest.fn(),
  cookie: jest.fn(),
  clearCookie: jest.fn(),
} as unknown as Response;

const mockUser = {
  email: 'email@mail.com',
  username: 'user',
  password: 'password',
};

const mockAuthService = {
  login: jest.fn().mockReturnValue('someToken'),
  register: jest.fn().mockReturnValue('someToken'),
};

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AppService,
        { provide: AuthService, useValue: mockAuthService },
        UsersService,
        JwtService,
        PrismaService,
      ],
    }).compile();

    authController = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
  describe('getAuth', () => {
    it('should render auth page', () => {
      authController.getAuth(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.render).toHaveBeenCalledWith('auth');
    });

    it('should render index page', () => {
      authController.getAuth(mockRequestToken, mockResponse);
      expect(mockResponse.redirect).toHaveBeenCalledWith('/');
    });
  });

  describe('postLogin', () => {
    it('should redirect / and writer cookies', async () => {
      await authController.login(mockUser, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        mockAuthService.login(),
        { maxAge: 86400000 },
      );
    });
  });

  describe('postLogout', () => {
    it('should redirect / and writer cookies', async () => {
      await authController.logout(mockResponse);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('token');
    });
  });

  describe('postRegister', () => {
    it('should redirect / and writer cookies', async () => {
      await authController.register(mockUser, mockResponse);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'token',
        mockAuthService.register(),
        { maxAge: 86400000 },
      );
    });
  });
});
