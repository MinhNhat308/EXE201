import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { SettingsService } from "./settings.service";

@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("profile")
  getProfile(@Req() request: { user: { sub: string } }) {
    return this.settingsService.getProfile(request.user.sub);
  }

  @Patch("profile")
  updateProfile(@Req() request: { user: { sub: string } }, @Body() payload: { fullName?: string; email?: string }) {
    return this.settingsService.updateProfile(request.user.sub, payload);
  }

  @Patch("security")
  updateSecurity(
    @Req() request: { user: { sub: string } },
    @Body() payload: { currentPassword: string; newPassword: string }
  ) {
    return this.settingsService.updateSecurity(request.user.sub, payload);
  }
}
