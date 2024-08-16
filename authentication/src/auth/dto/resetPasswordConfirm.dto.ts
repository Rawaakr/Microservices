import { IsEmail, IsNotEmpty} from "class-validator";
export class ResetPasswordConfirmDto {
    @IsNotEmpty()
    readonly password : string;
}