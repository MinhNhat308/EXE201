import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createRequire } from "node:module";
import { Model } from "mongoose";
import { Tenant, TenantDocument } from "../tenants/tenant.schema";
import { Contract, ContractDocument } from "./contract.schema";
import { ContractsService } from "./contracts.service";

const nodeRequire = createRequire(__filename);
const PDFDocument = nodeRequire("pdfkit") as typeof import("pdfkit");

const planLabels: Record<string, string> = {
  saas_subscription: "SaaS Subscription",
  franchise: "Franchise",
  support: "Support"
};

@Injectable()
export class ContractsPdfService {
  constructor(
    private readonly contractsService: ContractsService,
    @InjectModel(Tenant.name) private readonly tenantModel: Model<TenantDocument>,
    @InjectModel(Contract.name) private readonly contractModel: Model<ContractDocument>
  ) {}

  async generate(id: string): Promise<Buffer> {
    const contract = await this.contractsService.findOne(id);
    if (!contract) {
      throw new NotFoundException("Contract not found");
    }

    const tenant = contract.tenantId ? await this.tenantModel.findById(contract.tenantId).exec() : null;
    const planName = planLabels[contract.plan] ?? contract.plan;
    const formattedAmount = new Intl.NumberFormat("vi-VN").format(contract.amount);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(20).fillColor("#2F80ED").text("THỎA THUẬN DỊCH VỤ", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(14).fillColor("#111").text(planName, { align: "center" });
      doc.moveDown(1);

      doc.fontSize(10).fillColor("#666").text(`Mã hợp đồng: ${contract.code}`, { align: "center" });
      doc.text(`Ngày ký: ${contract.startDate} · Hết hạn: ${contract.endDate}`, { align: "center" });
      doc.moveDown(1.5);

      doc.fontSize(12).fillColor("#2F80ED").text("BÊN A: Công ty cổ phần công nghệ BobaPOS");
      doc.fontSize(10).fillColor("#333").text("Đại diện: Ông Trần Công Tâm - Giám đốc điều hành");
      doc.text("Trụ sở: Tòa nhà Innovation, Công viên phần mềm Quang Trung, TP.HCM");
      doc.moveDown(1);

      doc.fontSize(12).fillColor("#2F80ED").text("BÊN B: Đối tác sử dụng dịch vụ");
      doc.fontSize(10).fillColor("#333").text(`Người đại diện: ${contract.ownerName}`);
      doc.text(`Đơn vị: ${tenant?.name ?? "—"}`);
      doc.text(`Email: ${tenant?.ownerEmail ?? "—"}`);
      if (tenant?.address) doc.text(`Địa chỉ: ${tenant.address}`);
      doc.moveDown(1);

      doc.fontSize(12).fillColor("#111").text("Điều khoản chính", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#333")
        .text(
          "1. Bên A cấp cho Bên B quyền sử dụng không độc quyền nền tảng BobaPOS TeaFlow trong phạm vi gói dịch vụ đã đăng ký.",
          { align: "justify" }
        )
        .moveDown(0.3)
        .text(
          "2. Phí dịch vụ được thanh toán theo lịch đã thỏa thuận. Bên B cam kết tuân thủ chính sách bảo mật và sử dụng hợp lệ.",
          { align: "justify" }
        );

      doc.moveDown(1);
      doc.fontSize(11).fillColor("#2F80ED").text(`Giá trị hợp đồng: ${formattedAmount} VNĐ`);
      doc.fontSize(10).fillColor("#666").text(`Thời hạn: ${contract.durationMonths ?? 12} tháng · Trạng thái: ${contract.status}`);

      if (contract.additionalTerms) {
        doc.moveDown(1);
        doc.fontSize(11).fillColor("#111").text("Điều khoản bổ sung", { underline: true });
        doc.moveDown(0.3);
        doc.fontSize(10).fillColor("#333").text(contract.additionalTerms, { align: "justify" });
      }

      doc.moveDown(2);
      doc.fontSize(9).fillColor("#999").text("Tài liệu được tạo tự động bởi TeaFlow BobaPOS Admin.", { align: "center" });

      doc.end();
    });
  }
}
