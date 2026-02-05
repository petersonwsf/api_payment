import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { env } from "process";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: env.SECRET_TOKEN ?? '',
            ignoreExpiration: false
        })
    }

    async validate(payload: any) {
        return { userId: payload.id, username: payload.sub, role: payload.role };
    }
}