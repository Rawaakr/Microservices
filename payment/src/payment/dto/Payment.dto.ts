import { IsEmail, IsNotEmpty, IsEnum, IsString, IsArray, IsNumber, IsOptional, ArrayNotEmpty, IsBoolean } from "class-validator";

export enum Token {
    TND = "TND",
    EUR = "EUR",
    USD = "USD"
}
export enum Type {
    IMMEDIATE = "immediate",
    PARTIAL = "partial"
}

export enum Methods {
    WALLET = "wallet",
    BANK_CARD = "bank_card",
    EDINAR = "e_dinar",
    FLOUCI = "flouci"
}
export class PaymentDto {
    @IsNotEmpty()
    @IsString()
    readonly receiverWalletId: string;

    @IsEnum(Token)
    readonly token: Token;

    @IsNotEmpty()
    @IsNumber()
    readonly amount: number; // Use number instead of Decimal for simplicity, ensure frontend sends number

    @IsEnum(Type)
    readonly type: Type;

    @IsOptional()
    @IsString()
    readonly description?: string;

    @IsArray()
    @IsEnum(Methods, { each: true })
    readonly acceptedPaymentMethods: Methods[];


    @IsString()
    readonly firstName: string;

    @IsString()
    readonly lastName: string;

    @IsString()
    readonly phoneNumber: string;
    
    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @IsString()
    readonly orderId: string; 
}
