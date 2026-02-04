import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { env } from "process";
import { JwtStrategy } from "./JwtStrategy";


@Module({
    imports: [
        PassportModule,
        JwtModule.register({
            secret: env.SECRET_TOKEN ?? '',
        })
    ],
    providers: [JwtStrategy],
    exports: [JwtModule]
})
export class AuthModule {}