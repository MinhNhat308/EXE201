import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

export interface SepayWebhookPayload {
  id: number;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  transferAmount: number;
  content: string;
  referenceCode?: string;
  code?: string;
}

@Injectable()
export class SepayService {
  private readonly log = new Logger(SepayService.name);

  isEnabled(): boolean {
    return process.env.SEPAY_ENABLED !== 'false';
  }

  verifyHmac(
    rawBody: string,
    signature: string,
    timestamp: number,
  ): boolean {
    const secret = process.env.SEPAY_WEBHOOK_SECRET?.trim();
    if (!secret) {
      this.log.warn('SEPAY_WEBHOOK_SECRET chưa cấu hình — bỏ qua verify HMAC');
      return true;
    }

    if (!signature || !timestamp) return false;

    const driftSec = Math.abs(Date.now() / 1000 - timestamp);
    if (driftSec > 300) {
      this.log.warn(`SePay timestamp drift ${driftSec}s`);
      return false;
    }

    const expected =
      'sha256=' +
      crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(signature),
      );
    } catch {
      return expected === signature;
    }
  }

  parsePayload(raw: Record<string, unknown>): SepayWebhookPayload | null {
    const id = Number(raw.id);
    if (!Number.isFinite(id)) return null;

    const transferAmount = Number(raw.transferAmount ?? raw.amount ?? 0);
    const content = String(raw.content ?? raw.description ?? raw.code ?? '').trim();
    if (!content) return null;

    return {
      id,
      gateway: String(raw.gateway ?? raw.bank ?? 'unknown'),
      transactionDate: String(
        raw.transactionDate ?? raw.transaction_date ?? new Date().toISOString(),
      ),
      accountNumber: String(raw.accountNumber ?? raw.account_number ?? ''),
      transferAmount,
      content,
      referenceCode: raw.referenceCode
        ? String(raw.referenceCode)
        : raw.reference_code
          ? String(raw.reference_code)
          : undefined,
      code: raw.code ? String(raw.code) : undefined,
    };
  }
}
