import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { SubscriptionPlansService } from "./subscription-plans.service";

@Controller("subscription-plans")
export class SubscriptionPlansController {
  constructor(private readonly subscriptionPlansService: SubscriptionPlansService) {}

  @Get("overview")
  getOverview() {
    return this.subscriptionPlansService.getOverview();
  }

  @Get()
  findAll() {
    return this.subscriptionPlansService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.subscriptionPlansService.findOne(id);
  }

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.subscriptionPlansService.create(payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: Record<string, unknown>) {
    return this.subscriptionPlansService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.subscriptionPlansService.remove(id);
  }
}
