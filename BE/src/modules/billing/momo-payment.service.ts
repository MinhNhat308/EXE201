import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const DEFAULT_ENDPOINT =
  'https://test-payment.momo.vn/v2/gateway/api/create';

export interface MomoCreateResult {
  payUrl: string;
  deeplink?: string;
  qrCodeUrl?: string;
  requestId: string;
}

export interface MomoIpnPayload {
  partnerCode?: string;
  orderId?: string;
  requestId?: string;
  amount?: number;
  orderInfo?: string;
  orderType?: string;
  transId?: number;
  resultCode?: number;
  message?: string;
  payType?: string;
  responseTime?: number;
  extraData?: string;
  signature?: string;
}

@Injectable()
export class MomoPaymentService {
  private readonly log = new Logger(MomoPaymentService.name);

  isEnabled(): boolean {
    return (
      process.env.MOMO_ENABLED === 'true' &&
      Boolean(process.env.MOMO_PARTNER_CODE) &&
      Boolean(process.env.MOMO_ACCESS_KEY) &&
      Boolean(process.env.MOMO_SECRET_KEY)
    );
  }

  private partnerCode() {
    return process.env.MOMO_PARTNER_CODE!.trim();
  }

  private accessKey() {
    return process.env.MOMO_ACCESS_KEY!.trim();
  }

  private secretKey() {
    return process.env.MOMO_SECRET_KEY!.trim();
  }

  private sign(raw: string): string {
    return crypto.createHmac('sha256', this.secretKey()).update(raw).digest('hex');
  }

  private ipnUrl(): string {
    if (process.env.MOMO_IPN_URL?.trim()) {
      return process.env.MOMO_IPN_URL.trim();
    }
    const base =
      process.env.PUBLIC_API_URL?.trim() ||
      `http://localhost:${process.env.PORT ?? 3001}/api`;
    return `${base.replace(/\/$/, '')}/billing/momo/ipn`;
  }

  private redirectUrl(): string {
    const url =
      process.env.MOMO_REDIRECT_URL?.trim() ||
      'http://localhost:3000/dashboard/admin/billing/result';
    return url;
  }

  async createPayment(input: {
    orderId: string;
    amount: number;
    orderInfo: string;
  }): Promise<MomoCreateResult> {
    const partnerCode = this.partnerCode();
    const accessKey = this.accessKey();
    const requestId = crypto.randomUUID();
    const requestType = 'payWithMethod';
    const extraData = '';
    const amount = Math.round(input.amount);
    const orderInfo = input.orderInfo.slice(0, 240);
    const redirectUrl = this.redirectUrl();
    const ipnUrl = this.ipnUrl();

    const rawSignature = [
      `accessKey=${accessKey}`,
      `amount=${amount}`,
      `extraData=${extraData}`,
      `ipnUrl=${ipnUrl}`,
      `orderId=${input.orderId}`,
      `orderInfo=${orderInfo}`,
      `partnerCode=${partnerCode}`,
      `redirectUrl=${redirectUrl}`,
      `requestId=${requestId}`,
      `requestType=${requestType}`,
    ].join('&');

    const body = {
      partnerCode,
      partnerName: process.env.MOMO_PARTNER_NAME?.trim() || 'BOBAPOS',
      storeId: process.env.MOMO_STORE_ID?.trim() || 'BOBAPOS',
      requestId,
      amount,
      orderId: input.orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang: 'vi',
      requestType,
      autoCapture: true,
      extraData,
      signature: this.sign(rawSignature),
    };

    const endpoint = process.env.MOMO_ENDPOINT?.trim() || DEFAULT_ENDPOINT;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as {
      resultCode?: number;
      message?: string;
      payUrl?: string;
      deeplink?: string;
      qrCodeUrl?: string;
    };

    if (!res.ok || data.resultCode !== 0 || !data.payUrl) {
      this.log.warn(`MoMo create failed: ${JSON.stringify(data)}`);
      throw new Error(
        data.message || `MoMo từ chối tạo giao dịch (mã ${data.resultCode ?? res.status})`,
      );
    }

    return {
      payUrl: data.payUrl,
      deeplink: data.deeplink,
      qrCodeUrl: data.qrCodeUrl,
      requestId,
    };
  }

  verifyIpnSignature(payload: MomoIpnPayload): boolean {
    if (!payload.signature) return false;
    const accessKey = this.accessKey();
    const raw = [
      `accessKey=${accessKey}`,
      `amount=${payload.amount ?? ''}`,
      `extraData=${payload.extraData ?? ''}`,
      `message=${payload.message ?? ''}`,
      `orderId=${payload.orderId ?? ''}`,
      `orderInfo=${payload.orderInfo ?? ''}`,
      `orderType=${payload.orderType ?? ''}`,
      `partnerCode=${payload.partnerCode ?? ''}`,
      `payType=${payload.payType ?? ''}`,
      `requestId=${payload.requestId ?? ''}`,
      `responseTime=${payload.responseTime ?? ''}`,
      `resultCode=${payload.resultCode ?? ''}`,
      `transId=${payload.transId ?? ''}`,
    ].join('&');
    const expected = this.sign(raw);
    return expected === payload.signature;
  }
}
