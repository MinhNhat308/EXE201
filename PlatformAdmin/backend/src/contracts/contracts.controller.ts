import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res } from "@nestjs/common";
import type { Response } from "express";
import type { QueryParams } from "../common/types";
import { ContractsPdfService } from "./contracts-pdf.service";
import { ContractsService } from "./contracts.service";

@Controller("contracts")
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly contractsPdfService: ContractsPdfService
  ) {}

  @Get()
  findAll(@Query() query: QueryParams) {
    return this.contractsService.findAll(query);
  }

  @Get(":id/pdf")
  async downloadPdf(@Param("id") id: string, @Res() res: Response) {
    const contract = await this.contractsService.findOne(id);
    const buffer = await this.contractsPdfService.generate(id);
    const filename = `${String(contract?.code ?? id).replace(/[^a-zA-Z0-9-_]/g, "_")}.pdf`;

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": buffer.length
    });
    res.send(buffer);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  create(@Body() payload: Record<string, unknown>) {
    return this.contractsService.create(payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: Record<string, unknown>) {
    return this.contractsService.update(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.contractsService.remove(id);
  }
}
