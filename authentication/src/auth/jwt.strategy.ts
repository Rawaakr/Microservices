import { DeleteAccountDto } from './dto/deleteAccount.dto';
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";

type Payload = {
    sub : number,
    email:string
}
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(  
        configservice: ConfigService,
        private readonly prismaService : PrismaService){
        super({
            jwtFromRequest : ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey : configservice.get("SECRET_KEY"),
            ignoreExpiration  : false
        })
    }

    async validate(payload: any) {
        return { userId: payload.sub, username: payload.username };
      }

    
}