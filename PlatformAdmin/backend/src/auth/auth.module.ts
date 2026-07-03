import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthController } from "./auth.controller";
import { AuthPasskeyService } from "./auth-passkey.service";
import { AuthService } from "./auth.service";
import { TokenService } from "./token.service";
import { User, UserSchema } from "./user.schema";

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [AuthController],
  providers: [AuthService, AuthPasskeyService, TokenService],
  exports: [AuthService, AuthPasskeyService, TokenService, MongooseModule]
})
export class AuthModule {}
