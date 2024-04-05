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
} as unknown as Response;

describe('AuthController', () => {
  let authController: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AppService,
        AuthService,
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

  it('should render /auth page', () => {
    authController.getAuth(mockRequest, mockResponse);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.render).toHaveBeenCalledWith('auth');
  });

  it('should render index page', () => {
    authController.getAuth(mockRequestToken, mockResponse);
    expect(mockResponse.redirect).toHaveBeenCalledWith('/');
  });
});
