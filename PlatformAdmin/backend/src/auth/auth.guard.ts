import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "./public.decorator";
import { TokenService } from "./token.service";
import { PLATFORM_ADMIN_ROLE } from "./user.schema";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService
  ) {}

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    const payload = this.tokenService.verify(token, "access");
    if (payload.role !== PLATFORM_ADMIN_ROLE) {
      throw new UnauthorizedException("Platform administrator access is required");
    }
    request.user = payload;
    return true;
  }
}
