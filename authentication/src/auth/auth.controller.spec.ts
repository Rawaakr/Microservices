import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthServiceMock } from './mocks/auth.service.mock';
import { Role, SignupDto } from './dto/signupdto.dto';
import { SigninDto } from './dto/signin.dto';
import { Request } from 'express';
import { UpdateAccountDto } from './dto/updateAccount.dto';
import { ResetPasswordRequestDto } from './dto/resetPasswordRequest.dto';
import { ResetPasswordConfirmDto } from './dto/resetPasswordConfirm.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';

describe('AuthController', () => {
  let authController: AuthController;
  let authService : AuthService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers : [{provide : AuthService,useClass: AuthServiceMock}]
    }).compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });
describe('signup',() => {
  const signupDto: SignupDto = {
    email: 'test@example.com',
    username: 'rawaa',
    password: 'password',
    role: Role.ADMIN,
  };

  it("should return {'message': 'User created successfully'}", async () => {
    await expect(authController.signup(signupDto)).resolves.toEqual({ message: 'User created successfully' });
  });
});

describe('signin',() =>{
  const signinDto : SigninDto = {
    email : 'test@example.com',
    password : 'testpassword'
  }
  const result = {
    TokenJwt: 'token',
    user: {
        username: "testUser",
        email: "test@example.com",
        role: Role.ADMIN
    } 
  };
  it("should return the token and the user connected", async () => {   
  jest.spyOn(authService, 'signin').mockResolvedValue(result);  
  await expect(authController.signin(signinDto)).resolves.toEqual(result);
})
})
describe('signout',() =>{
  const result = {
    message: 'Signed out successfully',
    user: null
  };
  it("should return {'message': 'Signed out successfully and user null'}", async () => {
  jest.spyOn(authService, 'signout').mockResolvedValue(result);  
  await expect(authController.signout()).resolves.toEqual(result);
})
})
describe('getProfile', () => {
  const user = {
    id: 1,
    email: 'test@example.com',
    username: 'testUser',
    password:"password",
    role: Role.USER,
    createdAt: new Date(),
    updateAt: new Date(),
    resetPasswordToken: null,
    resetPasswordTokenExpiry: null,
  };
  const req = { user: { userId: 1 } } as Partial<Request> as Request;
  it("should return the current user", async () => {
  jest.spyOn(authService, 'getProfile').mockResolvedValue(user);

  expect(await authController.getProfile(req)).toEqual(user);
});
});

describe('updateAccount', () => {
  const updateAccountdto : UpdateAccountDto = { 
    email: 'test@example.com',
    username: 'rawaa',
    password: 'password',
    role: Role.ADMIN,
  }
  const result = {
    data : 'User successfully updated',
    user : {
      id: 1,
      email: "test@example.com",
      username: "testUser",
      role:Role.ADMIN,
    }
  };
  const req = { user : {userId : 1}} as Partial<Request> as Request
    it("should return {'message': 'User successfully updated and return the updated user'}", async() => {
      jest.spyOn(authService,'updateAccount').mockResolvedValue(result);
      expect (authController.updateAccount(updateAccountdto,req)).resolves.toEqual(result);
    });
});

describe('requestPasswordReset' , () => {
  const resetPasswordRequestDto : ResetPasswordRequestDto = { 
    email : "test@example.com"
  }
  it("should return a reset token", async() => {
    expect(authController.requestPasswordReset(resetPasswordRequestDto)).resolves.toEqual({"data" : "token"});
  })

})

describe('requestPasswordConfirm' , () => {
  const resetPasswordConfirmDto : ResetPasswordConfirmDto = { 
    password : "password"
  }
  const resetToken = "reset token";
  it("should return a reset token", async() => {
    expect(authController.confirmPasswordReset(resetPasswordConfirmDto,resetToken)).resolves.toEqual({"data": "Password reset successfully" });
  })

})

describe('deleteAccount' , () => {
  const deleteAccountDto : DeleteAccountDto = { 
    password : "password"
  }
  const req = { user : {userId : 1}} as Partial<Request> as Request
  it("should return a reset token", async() => {
    expect(authController.deleteAccount(req,deleteAccountDto)).resolves.toEqual({"data" : "user successfully deleted"});
  })

})
});