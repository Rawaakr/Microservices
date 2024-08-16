import { IsEmail} from "class-validator"
export class ResetPasswordRequestDto {
    @IsEmail()
    readonly email : string

}