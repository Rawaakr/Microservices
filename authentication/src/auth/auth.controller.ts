import { Body, Controller, Delete, Get, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signupdto.dto';
import { SigninDto } from './dto/signin.dto';
import { Request } from 'express';
import { UpdateAccountDto } from './dto/updateAccount.dto';
import { ResetPasswordRequestDto } from './dto/resetPasswordRequest.dto';
import { ResetPasswordConfirmDto } from './dto/resetPasswordConfirm.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';
import { AuthGuard } from '@nestjs/passport';


 @Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('signup')
    signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post('signin')
    signin(@Body() signinDto: SigninDto) {
        return this.authService.signin(signinDto);
    }

    @UseGuards(AuthGuard("jwt"))
    @Get('profile')
    getProfile(@Req() request: Request) {    
        const userId = request.user["userId"]; 
        return this.authService.getProfile(userId);
    }

    @UseGuards(AuthGuard('jwt'))
    @Post('signout')
    signout() {
        return this.authService.signout();
    }

    @UseGuards(AuthGuard('jwt'))
    @Put('update-account')
    updateAccount(@Body() updateAccountdto: UpdateAccountDto, @Req() request: Request) {
        const userId = request.user["userId"]; 
        return this.authService.updateAccount(updateAccountdto,userId);
     }

    @Post('reset-password-request')
    requestPasswordReset(@Body() resetPasswordDto: ResetPasswordRequestDto) {
        return this.authService.requestPasswordReset(resetPasswordDto);
    }

    @Post('reset-password-confirm')
    confirmPasswordReset(@Body() resetPasswordConfirmDto: ResetPasswordConfirmDto, @Query('token') resetToken: string) {
        return this.authService.confirmPasswordReset(resetPasswordConfirmDto, resetToken);
    }
    @UseGuards(AuthGuard('jwt'))
    @Delete('delete-account')
    deleteAccount(@Req() request : Request,@Body() deleteAccountDto : DeleteAccountDto){
        const userId  = request.user["userId"];
        return this.authService.deleteAccount(userId,deleteAccountDto)
    }
}
