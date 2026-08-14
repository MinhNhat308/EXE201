import { Injectable, NotFoundException } from "@nestjs/common";
import { createRequire } from "node:module";
import { ContractsService } from "./contracts.service";

const nodeRequire = createRequire(__filename);
const PDFDocument = nodeRequire("pdfkit") as typeof import("pdfkit");

const planLabels: Record<string, string> = {
  solo: "BOBAPOS Solo",
  standard: "BOBAPOS Store",
  premium: "BOBAPOS Chain"
};

@Injectable()
export class ContractsPdfService {
  constructor(private readonly contractsService: ContractsService) {}

  async generate(id: string): Promise<Buffer> {
    const invoice = await this.contractsService.findOne(id);
    if (!invoice) throw new NotFoundException("Billing invoice not found");
    const billingInvoice = invoice as typeof invoice & { paymentMethod?: string };

    const planName = planLabels[invoice.plan] ?? invoice.plan;
    const amount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(invoice.amount);
    const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(22).fillColor("#2F80ED").text("BOBAPOS", { align: "center" });
      doc.moveDown(0.4);
      doc.fontSize(16).fillColor("#111").text("HÓA ĐƠN GÓI DỊCH VỤ", { align: "center" });
      doc.moveDown(1.5);

      doc.fontSize(10).fillColor("#666").text(`Mã hóa đơn: ${invoice.code}`);
      doc.text(`Trạng thái: ${String(invoice.status).toUpperCase()}`);
      doc.text(`Phương thức thanh toán: ${billingInvoice.paymentMethod ?? "—"}`);
      doc.moveDown(1.5);

      doc.fontSize(12).fillColor("#2F80ED").text("THÔNG TIN KHÁCH HÀNG");
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor("#333").text(`Chủ cửa hàng: ${invoice.ownerName}`);
      doc.text(`Gói dịch vụ: ${planName}`);
      doc.moveDown(1.5);

      doc.fontSize(12).fillColor("#2F80ED").text("CHI TIẾT THANH TOÁN");
      doc.moveDown(0.4);
      doc.fontSize(10).fillColor("#333").text(`Kỳ dịch vụ: ${formatDate(invoice.startDate)} - ${formatDate(invoice.endDate)}`);
      doc.moveDown(0.8);
      doc.fontSize(16).fillColor("#111").text(`Tổng thanh toán: ${amount}`);

      if (invoice.additionalTerms) {
        doc.moveDown(1.5);
        doc.fontSize(11).fillColor("#111").text("Ghi chú");
        doc.fontSize(10).fillColor("#333").text(invoice.additionalTerms);
      }

      doc.moveDown(3);
      doc.fontSize(9).fillColor("#777").text("Tài liệu được tạo tự động bởi BOBAPOS Platform Admin.", { align: "center" });
      doc.end();
    });
  }
}
