import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signupdto.dto';
import * as bcrypt from 'bcrypt';
import { SigninDto } from './dto/signin.dto';
import { JwtService } from '@nestjs/jwt';
import * as nodemailer from 'nodemailer';
import { UpdateAccountDto } from './dto/updateAccount.dto';
import { isValidRole } from '../utils/role.utils';
import { ResetPasswordRequestDto } from './dto/resetPasswordRequest.dto';
import { ResetPasswordConfirmDto } from './dto/resetPasswordConfirm.dto';
import { DeleteAccountDto } from './dto/deleteAccount.dto';
import { NatsConfig } from 'src/nats-config';
import { Subjects } from '../../../common/src/subjects/subjects';
import { UserConnectedEvent} from '../../../common/src/events/user-connected';
import { ClientProxy } from '@nestjs/microservices';
@Injectable()
export class AuthService {
    private transporter: nodemailer.Transporter;

    constructor(
        private readonly prismaService: PrismaService,
        private readonly jwtService: JwtService,
    ) {
        this.initTransporter();
    }

    private initTransporter() {
        nodemailer.createTestAccount().then(testAccount => {
            this.transporter = nodemailer.createTransport({
                host: 'localhost',
                port: 1025,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                }
            });
        }).catch(err => {
            console.error('Failed to create test account:', err);
        });
    }
    async validateToken(token){
        try {
        const decoded = await this.jwtService.verify(token);
        return decoded ;
        } catch(err){
            return null ;
        }
    }

    async findByEmail(email: string) {
        return await this.prismaService.user.findUnique({ where: { email } });
    }
    async sendConfirmationEmail(userEmail: string) {
        const mailOptions = {
            from: "adnExpertise@gmail.com",
            to: userEmail,
            subject: "Inscription Confirmation",
            html: "<h3>Inscription is confirmed</h3>"
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
        }
    }

    async sendResetPasswordEmail(userEmail: string, resetToken: string) {
        const resetUrl = `http://localhost:3000/reset-password-confirm?token=${resetToken}`;
        const mailOptions = {
            from: "adnExpertise@gmail.com",
            to: userEmail,
            subject: "Password Change",
            html: `<h3>You should click on this link to confirm changing your password: <a href="${resetUrl}">link</a></h3>`
        };

        try {
            await this.transporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Failed to send reset password email:', error);
        }
    }

    async signup(signupDto: SignupDto) {
        const { email, username, password, role } = signupDto;
        const userExist = await this.findByEmail(email);
        
        if (userExist) {
            throw new ConflictException('User already exists');
        }

        if (!isValidRole(role)) {
            throw new ConflictException('Invalid role');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        await this.prismaService.user.create({
            data: {
                email,
                username,
                password: passwordHash,
                role, // Ensure role is set here if needed
            },
        });

        await this.sendConfirmationEmail(email);
        return { message: 'User created successfully' };
    }

    async signin(signinDto: SigninDto) {
        const { email, password } = signinDto;
        const userExist = await this.findByEmail(email as string);

        if (!userExist) {
            throw new NotFoundException('User not found');
        }

        const isPasswordValid = await bcrypt.compare(password as string, userExist.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = {
            sub: userExist.id,
            username: userExist.username,
            email: userExist.email,
            role: userExist.role,
        };

        const TokenJwt = await this.jwtService.signAsync(payload);

        const js = NatsConfig.getJetStream();
        await js.publish(Subjects.UserConnected, JSON.stringify({
            userId : userExist.id,
            email: userExist.email,
        
        }as UserConnectedEvent));
        console.log("User connected event published")
        return {
            TokenJwt,
            user: {
                username: userExist.username,
                email: userExist.email,
                role: userExist.role,
            },
        };
    }
    
    async signout() {
        return {
            message: "Signed out successfully",
            user: null
        };
    }

    async getProfile(userId: number) {
        const currentUser = await this.prismaService.user.findUnique({
            where: { id: userId },
        });

        if (!currentUser) {
            throw new NotFoundException('User not found');
        }
        Reflect.deleteProperty(currentUser,'password');
        return currentUser;
    }

    async updateAccount(updateAccountDto: UpdateAccountDto, userId:number) {
        const { email, username, password, role } = updateAccountDto;

        const userExist = await this.prismaService.user.findUnique({ where: { id: userId } });
        if (!userExist) throw new NotFoundException("User not found");
        if (role && !isValidRole(role)) {
            throw new ConflictException('Invalid Role');
        }

        const updatedData: any = {};
        if (email) updatedData.email = email;
        if (username) updatedData.username = username;
        if (role) updatedData.role = role;
        if (password) await this.requestPasswordReset(updatedData.email);

        const updatedUser = await this.prismaService.user.update({
            where: { id: userId },
            data: updatedData,
        });

        return {
            data: 'User successfully updated',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                username: updatedUser.username,
                role:updatedData.role
            }
        };
    }

    async requestPasswordReset(resetPasswordRequestDto: ResetPasswordRequestDto) {
        const { email } = resetPasswordRequestDto;
        const userExist = await this.findByEmail(email);
        if (!userExist) throw new NotFoundException('User not found');

        const resetToken = await this.jwtService.sign({ email }, { expiresIn: '1h' });

        await this.prismaService.user.update({
            where: { email },
            data: {
                resetPasswordToken: resetToken,
                resetPasswordTokenExpiry: new Date(Date.now() + 3600 * 1000),
            }
        });

        await this.sendResetPasswordEmail(email, resetToken);
        return { data: resetToken };
    }
    
    async confirmPasswordReset(resetPasswordConfirmDto: ResetPasswordConfirmDto, resetToken: string) {
        const { password } = resetPasswordConfirmDto;
        const decodedToken = await this.validateToken(resetToken);
        if (!decodedToken) throw new UnauthorizedException('Invalid or expired token');

        const userExist = await this.findByEmail(decodedToken.email);
        if (!userExist) throw new NotFoundException("User not found");

        const hashedPassword = await bcrypt.hash(password, 10);

        await this.prismaService.user.update({
            where: { email: decodedToken.email },
            data: {
                password: hashedPassword,
                resetPasswordToken: null,
                resetPasswordTokenExpiry: null,
            }
        });

        return { data: "Password reset successfully" };
    }

    async deleteAccount(userId: number , deleteAccountDto : DeleteAccountDto){
        const {password} = deleteAccountDto;
        const userExist = await this.prismaService.user.findUnique({where : {id:userId}});
        if(!userExist) throw new NotFoundException("User not found");

        const matchPassword = await bcrypt.compare(password,userExist.password);
        if (!matchPassword) throw new UnauthorizedException("Password does not match");
        await this.prismaService.user.delete({where : {id:userId}});
        return {
            data : "user successfully deleted"
        }
    }
}
