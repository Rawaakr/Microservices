import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt"// Correction de l'import pour ExtractJwt
import { PrismaService } from "../prisma/prisma.service"; // Utilisation d'une importation relative

enum Role {
    ADMIN = "ADMIN",
    USER = "USER"
}

interface Payload {
    sub: number;
    email: string;
    username: string;
    role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly configService: ConfigService,
        private readonly prismaService: PrismaService
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: configService.get<string>("SECRET_KEY"), // Correction pour obtenir la clé sous forme de chaîne
            ignoreExpiration: false
        });
    }

    async validate(payload: Payload) {
        const user = await this.prismaService.user.findUnique({ where: { email: payload.email } });
        if (!user) {
            throw new UnauthorizedException("Unauthorized");
        }
        Reflect.deleteProperty(user, "password");
        console.log(user);
        return user;
    }
}
