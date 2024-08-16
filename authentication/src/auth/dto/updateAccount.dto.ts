import { IsEmail, IsNegative, IsNotEmpty, IsString } from "class-validator";


export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}
export class UpdateAccountDto {
    @IsEmail()
    @IsNotEmpty()
    readonly email : string
    @IsNotEmpty()
    readonly username : string
    @IsNotEmpty()
    readonly password : string
    @IsString()
    readonly role:Role;
} 