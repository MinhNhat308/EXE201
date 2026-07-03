import { Body, Controller, Get, Post, Req } from "@nestjs/common";
import { Public } from "./public.decorator";
import { AuthPasskeyService } from "./auth-passkey.service";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authPasskeyService: AuthPasskeyService
  ) {}

  @Public()
  @Post("login")
  login(@Body() payload: { email: string; password: string }) {
    return this.authService.login(payload);
  }

  @Public()
  @Post("register")
  register(@Body() payload: { fullName: string; email: string; password: string; role?: string }) {
    return this.authService.register(payload);
  }

  @Public()
  @Post("refresh")
  refresh(@Body() payload: { refreshToken: string }) {
    return this.authService.refresh(payload.refreshToken);
  }

  @Public()
  @Post("sso")
  sso(@Body() payload: { provider: string; email: string }) {
    return this.authService.ssoLogin(payload);
  }

  @Public()
  @Post("forgot-password")
  forgotPassword(@Body() payload: { email: string }) {
    return this.authService.forgotPassword(payload);
  }

  @Public()
  @Post("verify-access")
  verifyAccess(@Body() payload: { email: string; code: string }) {
    return this.authService.verifyAccess(payload);
  }

  @Public()
  @Post("passkey/login-options")
  passkeyLoginOptions(@Body() payload: { email: string }) {
    return this.authPasskeyService.getLoginOptions(payload.email);
  }

  @Public()
  @Post("passkey/login")
  passkeyLogin(@Body() payload: { email: string; response: Record<string, unknown> }) {
    return this.authPasskeyService.verifyLogin(payload.email, payload.response);
  }

  @Post("passkey/register-options")
  passkeyRegisterOptions(@Req() request: { user: { sub: string } }) {
    return this.authPasskeyService.getRegistrationOptions(request.user.sub);
  }

  @Post("passkey/register")
  passkeyRegister(
    @Req() request: { user: { sub: string } },
    @Body() payload: { response: Record<string, unknown>; deviceName?: string }
  ) {
    return this.authPasskeyService.verifyRegistration(request.user.sub, payload.response, payload.deviceName);
  }

  @Get("me")
  me(@Req() request: { user: { sub: string } }) {
    return this.authService.me(request.user.sub);
  }

  @Post("logout")
  logout() {
    return this.authService.logout();
  }
}
