import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaServiceMock } from './mocks/prisma.service.mock';
import { JwtService } from '@nestjs/jwt';
import { JwtServiceMock } from './mocks/JwtService.mock';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer'
import { Role, SignupDto } from './dto/signupdto.dto';
import { isValidRole } from '../utils/role.utils';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SigninDto } from './dto/signin.dto';
import { UpdateAccountDto } from './dto/updateAccount.dto';
import { ResetPasswordRequestDto } from './dto/resetPasswordRequest.dto';
import { ResetPasswordConfirmDto } from './dto/resetPasswordConfirm.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';

jest.mock('nodemailer', () => ({
  createTestAccount: jest.fn().mockResolvedValue({ user: 'testUser', pass: 'testPass' }),
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({}),
  }),
}));
jest.mock('bcrypt');
jest.mock('../utils/role.utils');
describe('AuthService', () => {
  let authService: AuthService;
  let transporterMock: any;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService,
        {provide :PrismaService, useValue : PrismaServiceMock },
        {provide :JwtService , useValue: JwtServiceMock}
      ],
    }).compile();
    jest.clearAllMocks();

    authService = module.get<AuthService>(AuthService);
  });
  
  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('signup',() => {
    it('should create a user successfully', async () => {
      const signupDto: SignupDto = {
        email: 'test@example.com',
        username: 'testUser',
        password: 'password123',
        role: Role.USER,
      };

      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(null);
      (isValidRole as jest.Mock).mockReturnValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      const sendMailMock = nodemailer.createTransport().sendMail as jest.Mock;
      sendMailMock.mockResolvedValue({});
      const result = await authService.signup(signupDto);
      await expect(PrismaServiceMock.user.create).toHaveBeenCalledWith({
        data: {
          email: signupDto.email,
          username: signupDto.username,
          password: 'hashedPassword',
          role: signupDto.role,
        },
      })
      
      await expect(sendMailMock).toHaveBeenCalledWith({
        from: "adnExpertise@gmail.com",
        to: signupDto.email,
        subject: "Inscription Confirmation",
        html: "<h3>Inscription is confirmed</h3>",
      });

      expect(result).toEqual({ message: 'User created successfully' });
    });

    it('should throw an exception if user already exists', async () => {
      const signupDto: SignupDto = {
          email: 'test@example.com',
          username: 'testUser',
          password: 'password123',
          role: Role.USER
      };

       (PrismaServiceMock.user.findUnique as jest.Mock).mockResolvedValue(signupDto);

      await expect(authService.signup(signupDto)).rejects.toBeInstanceOf(ConflictException);
      await expect(authService.signup(signupDto)).rejects.toEqual(new ConflictException("User already exists"));
     });

      it('should throw an exception of Invalid Role', async () => {
        const signupDto: any = {
        email: 'test@example.com',
        username: 'testUser',
        password: 'password123',
        role : '',
      };

      (PrismaServiceMock.user.findUnique as jest.Mock).mockResolvedValue(null);
      (isValidRole as jest.Mock).mockReturnValue(false);

      await expect(authService.signup(signupDto)).rejects.toBeInstanceOf(ConflictException);
      await expect(authService.signup(signupDto)).rejects.toEqual(new ConflictException("Invalid role"))
        });
  });

  describe('signin ',() => {

    it('should login and return a token', async() => {
      const signinDto : SigninDto = {
        email : "test@example.com",
        password : "password123",
      };
      const user : any = {
        id : 1,
        email : "krawa@gmail.com",
        username : "userUs",
        role : Role.ADMIN,
      };
      jest.spyOn(authService, 'findByEmail').mockResolvedValue(user);     
      (bcrypt.compare as jest.Mock).mockReturnValue(true);
      (JwtServiceMock.signAsync as jest.Mock).mockReturnValue("mocked-token");
      // const result = await authService.signin
      await expect(authService.signin(signinDto)).resolves.toEqual({
        TokenJwt : "mocked-token",
        user : {
          username : user.username,
          email : user.email,
          role : user.role,
        },
      })
    })
    it('should return a NotFoundException',async() =>{
      const signinDto : SigninDto = {
        email : "test@example.com",
        password : "password123",
      };
      
      jest.spyOn(authService,'findByEmail').mockReturnValue(null);
      await expect(authService.signin(signinDto)).rejects.toBeInstanceOf(NotFoundException);
      await expect(authService.signin(signinDto)).rejects.toEqual(new NotFoundException('User not found'));
    })
    it('should return an UnauthorizedException ',async() =>{
      const signinDto : SigninDto = {
        email : "test@example.com",
        password : "password123",
      };
      const user : any = {
        id : 1,
        email : "krawa@gmail.com",
        username : "userUs",
        role : Role.ADMIN,
      };

      jest.spyOn(authService, 'findByEmail').mockResolvedValue(user);     
      (bcrypt.compare as jest.Mock).mockReturnValue(false);
      await expect(authService.signin(signinDto)).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(authService.signin(signinDto)).rejects.toEqual(new UnauthorizedException('Invalid credentials'));
    })
  })

  describe('signout', () => {
    it('should return Signed out successfully et user null', async ()=>{
      await expect(authService.signout()).resolves.toEqual({
        message: "Signed out successfully",
        user: null
    })
    } )
  })

  describe('getProfile', () => {
    it("should return current user", async() => {
    const user : any = {
      id : 1,
      email : "krawa@gmail.com",
      username : "userUs",
      password : "password123",
      role : Role.ADMIN,
    }
    jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(user);
    const expectedUser = { ...user };
    delete expectedUser.password;
    await expect(authService.getProfile(1)).resolves.toEqual(expectedUser);
    })
    it("should return a NotFoundException", async() =>{
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(null);
      await expect(authService.getProfile(1)).rejects.toBeInstanceOf(NotFoundException);
      await expect(authService.getProfile(1)).rejects.toEqual(new NotFoundException('User not found'))
    })
  });

  describe('updateAccount', () => {
    it("should update user Account", async() => {
      const userId = 1;
      const userExist : any = {
        id : userId,
      email : "krawa@gmail.com",
      username : "userUs",
      password : "password123",
      role : Role.ADMIN,
      }
      const updateAccountDto: UpdateAccountDto = {
        email: 'test@example.com',
        username: 'testUser',
        password: 'password123',
        role: Role.USER,
      };
      const updatedUser = {
        ...userExist,
        email: updateAccountDto.email,
        username: updateAccountDto.username,
        role: updateAccountDto.role,
      };
      const resetToken = "resetToken";
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(userExist);
      jest.spyOn(authService,'requestPasswordReset').mockResolvedValue({data : resetToken});
      (isValidRole as jest.Mock).mockReturnValue(true);
      jest.spyOn(PrismaServiceMock.user,'update').mockResolvedValue(updatedUser);
      const result = await authService.updateAccount(updateAccountDto,userId);
      expect(result).toEqual({
        data: 'User successfully updated',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username,
          role: updatedUser.role,
               },
      });
    });
    
    it("should return a notFoundException",async () =>{
      const userId = 1;
      const userExist : any = {
        id : userId,
      email : "krawa@gmail.com",
      username : "userUs",
      password : "password123",
      role : Role.ADMIN,
      }
      const updateAccountDto: UpdateAccountDto = {
        email: 'test@example.com',
        username: 'testUser',
        password: 'password123',
        role: Role.USER,
      };
      (isValidRole as jest.Mock).mockReturnValue(true);
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(null);
      await expect(authService.updateAccount(updateAccountDto,userId)).rejects.toBeInstanceOf(NotFoundException);
      await expect(authService.updateAccount(updateAccountDto,userId)).rejects.toEqual(new NotFoundException("User not found"))

    })
  
    it("should return a ConflictException",async () =>{
      const userId = 1;
      const userExist : any = {
        id : userId,
      email : "krawa@gmail.com",
      username : "userUs",
      password : "password123",
      role : Role.ADMIN,
      }
      const updateAccountDto: UpdateAccountDto = {
        email: 'test@example.com',
        username: 'testUser',
        password: 'password123',
        role: Role.USER,
      };
      (isValidRole as jest.Mock).mockReturnValue(false)
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(userExist);
      await expect(authService.updateAccount(updateAccountDto,userId)).rejects.toBeInstanceOf(ConflictException);
      await expect(authService.updateAccount(updateAccountDto,userId)).rejects.toEqual(new ConflictException("Invalid Role"))

    });
  });


  describe('requestPasswordReset', () => {
    it("should return a reset token ",async() =>{
    const resetPasswordRequestDto : ResetPasswordRequestDto ={
      email :"test@example.com"
    }
    const userExist : any = {     
      id :1,
      email : "test@example.com",
      username : "userUs",
      password : "password123",
      role : Role.ADMIN,
    };
    const resetToken = "resetPasswordToken";
    const resetUrl = `http://localhost:3000/reset-password-confirm?token=${resetToken}`;
    jest.spyOn(authService,'findByEmail').mockResolvedValue(userExist);
    (JwtServiceMock.sign as jest.Mock).mockResolvedValue(resetToken);
    const updatedUser = {
      ...userExist,
      resetPasswordToken :resetToken,
      resetPasswordTokenExpiry: new Date(Date.now() + 3600 * 1000),
    };
    jest.spyOn(PrismaServiceMock.user,'update').mockResolvedValue(updatedUser);
    const sendMailMock = nodemailer.createTransport().sendMail as jest.Mock;
    sendMailMock.mockResolvedValue({});
    const result = await authService.requestPasswordReset(resetPasswordRequestDto);
    await expect(sendMailMock).toHaveBeenCalledWith({
      from: "adnExpertise@gmail.com",
      to: resetPasswordRequestDto.email,
      subject: "Password Change",
      html: `<h3>You should click on this link to confirm changing your password: <a href="${resetUrl}">link</a></h3>`
    });
    expect(result).toEqual({"data" :"resetPasswordToken"})
  })

  it("should return a NotFoundException", async() => {
    const resetPasswordRequestDto : ResetPasswordRequestDto ={
      email :"test@example.com"
    }
    jest.spyOn(authService,'findByEmail').mockResolvedValue(null);
    await expect(authService.requestPasswordReset(resetPasswordRequestDto)).rejects.toBeInstanceOf(NotFoundException);
    await expect(authService.requestPasswordReset(resetPasswordRequestDto)).rejects.toEqual(new NotFoundException("User not found"))
  })
  })

  describe("confirmPasswordReset", () => {
    it("should return Password reset successfully", async() => {
      const resetPasswordConfirmDto : ResetPasswordConfirmDto = {
        password : "passwordReset"
      };
      const userExist : any = {     
        id :1,
        email : "test@example.com",
        username : "userUs",
        password : "password123",
        role : Role.ADMIN,
      };
      const userUpdatedPassword : any = {     
        ...userExist,
        password:"hashed password",
        resetPasswordToken: null,
        resetPasswordTokenExpiry: null,
      };
      const validToken = { email: "test@example.com" };;
      const resetToken = "reset-token";
      jest.spyOn(authService,'validateToken').mockResolvedValue(validToken);
      jest.spyOn(authService,'findByEmail').mockResolvedValue(userExist);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed password");
      jest.spyOn(PrismaServiceMock.user,'update').mockResolvedValue(userUpdatedPassword)
      expect(authService.confirmPasswordReset(resetPasswordConfirmDto,resetToken)).resolves.toEqual({ data: "Password reset successfully" })
    })

    it("should return an UnauthorizedException", async() => {
      const resetPasswordConfirmDto : ResetPasswordConfirmDto = {
        password : "passwordReset"
      };
      const resetToken = "reset-token";
      jest.spyOn(authService,'validateToken').mockResolvedValue(null);
      expect(authService.confirmPasswordReset(resetPasswordConfirmDto,resetToken)).rejects.toBeInstanceOf(UnauthorizedException)
      expect(authService.confirmPasswordReset(resetPasswordConfirmDto,resetToken)).rejects.toEqual(new UnauthorizedException('Invalid or expired token'));
    })
    it("should return a NotFoundException", async() => {
      const resetPasswordConfirmDto : ResetPasswordConfirmDto = {
        password : "passwordReset"
      };
      const resetToken = "reset-token";
      const validToken = { email: "test@example.com" };;
      jest.spyOn(authService,'validateToken').mockResolvedValue(validToken);
      jest.spyOn(authService,'findByEmail').mockResolvedValue(null);
      expect(authService.confirmPasswordReset(resetPasswordConfirmDto,resetToken)).rejects.toBeInstanceOf(NotFoundException)
      expect(authService.confirmPasswordReset(resetPasswordConfirmDto,resetToken)).rejects.toEqual(new NotFoundException('User not found'));

    })
  })

  describe("deleteAccount", () => {
    it("should delete userAccount", async() => {
      const userId = 1 ;
      const deleteAccountDto : DeleteAccountDto = {
        password : "test123"
      };
      const userExist : any = {     
        id :userId,
        email : "test@example.com",
        username : "userUs",
        password : "password123",
        role : Role.ADMIN,
      };
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(userExist);
      jest.spyOn(PrismaServiceMock.user,'delete').mockResolvedValue(userExist);
      const result = await authService.deleteAccount(userId, deleteAccountDto);
      expect(PrismaServiceMock.user.delete).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual({data : "user successfully deleted"})
    })

    it("should return a notFoundException", async() => {
      const userId = 1 ;
      const deleteAccountDto : DeleteAccountDto = {
        password : "test123"
      };
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(null);
      expect(authService.deleteAccount(userId, deleteAccountDto)).rejects.toBeInstanceOf(NotFoundException);
      expect(authService.deleteAccount(userId, deleteAccountDto)).rejects.toEqual(new NotFoundException("User not found"))

    })
    it("should return an UnauthorizedException", async() => {
      const userId = 1 ;
      const deleteAccountDto : DeleteAccountDto = {
        password : "test123"
      };
      const userExist : any = {     
        id :userId,
        email : "test@example.com",
        username : "userUs",
        password : "password123",
        role : Role.ADMIN,
      };
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      jest.spyOn(PrismaServiceMock.user,'findUnique').mockResolvedValue(userExist);
      expect(authService.deleteAccount(userId, deleteAccountDto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(authService.deleteAccount(userId, deleteAccountDto)).rejects.toEqual(new UnauthorizedException("Password does not match"));

    })
  })
})
