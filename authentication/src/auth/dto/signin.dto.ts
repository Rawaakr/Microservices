import { IsEmail, IsNotEmpty } from "class-validator";

export class SigninDto {
    @IsEmail()
    @IsNotEmpty()
    readonly email : String
    @IsNotEmpty() 
    readonly password : String
}