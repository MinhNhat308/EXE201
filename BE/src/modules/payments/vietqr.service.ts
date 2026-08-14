import { Injectable, Logger } from '@nestjs/common';

export interface VietQrResult {
  qrImageUrl: string;
  paymentCode: string;
  bankAccountInfo: string;
  source: 'vietqr_api' | 'vietqr_img';
}

@Injectable()
export class VietQrService {
  private readonly log = new Logger(VietQrService.name);

  isEnabled(): boolean {
    return Boolean(
      process.env.VIETQR_ACCOUNT_NO?.trim() &&
        process.env.VIETQR_BANK_BIN?.trim(),
    );
  }

  paymentPrefix(): string {
    return (process.env.PAYMENT_CODE_PREFIX?.trim() || 'BOBAPOS').toUpperCase();
  }

  buildPaymentCode(dailySequence: number): string {
    const prefix = this.paymentPrefix();
    const suffix = String(dailySequence).padStart(5, '0');
    return `${prefix}${suffix}`.slice(0, 19).toUpperCase();
  }

  buildPaymentCodeFromId(idSuffix: string): string {
    const prefix = this.paymentPrefix();
    const clean = idSuffix.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    const maxSuffix = Math.max(1, 19 - prefix.length);
    return `${prefix}${clean.slice(-maxSuffix)}`.slice(0, 19).toUpperCase();
  }

  extractPaymentCode(content: string): string | null {
    const prefix = this.paymentPrefix();
    const upper = content.toUpperCase();
    const idx = upper.indexOf(prefix);
    if (idx < 0) return null;
    const slice = upper.slice(idx, idx + 19);
    return slice.replace(/[^A-Z0-9]/g, '').slice(0, 19) || null;
  }

  bankAccountInfo(): string {
    const bank = process.env.VIETQR_BANK_NAME?.trim() || 'Ngân hàng';
    const account = process.env.VIETQR_ACCOUNT_NO?.trim() || '';
    const holder = process.env.VIETQR_ACCOUNT_NAME?.trim() || '';
    return `${bank} · ${account} · ${holder}`.replace(/ · $/, '');
  }

  async generateQr(input: {
    amount: number;
    paymentCode: string;
  }): Promise<VietQrResult> {
    const accountNo = process.env.VIETQR_ACCOUNT_NO!.trim();
    const acqId = process.env.VIETQR_BANK_BIN!.trim();
    const accountName = (
      process.env.VIETQR_ACCOUNT_NAME?.trim() || 'BOBAPOS'
    ).toUpperCase();
    const amount = Math.round(input.amount);
    const paymentCode = input.paymentCode.toUpperCase().slice(0, 19);
    const bankAccountInfo = this.bankAccountInfo();

    const apiKey = process.env.VIETQR_API_KEY?.trim();
    const clientId = process.env.VIETQR_CLIENT_ID?.trim();

    if (apiKey && clientId) {
      try {
        const res = await fetch('https://api.vietqr.io/v1/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-client-id': clientId,
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            accountNo,
            accountName,
            acqId,
            amount: String(amount),
            addInfo: paymentCode,
            format: 'vietqr_net',
          }),
        });

        const data = (await res.json()) as {
          code?: string;
          desc?: string;
          data?: { qrDataURL?: string };
        };

        if (res.ok && data.code === '00' && data.data?.qrDataURL) {
          return {
            qrImageUrl: data.data.qrDataURL,
            paymentCode,
            bankAccountInfo,
            source: 'vietqr_api',
          };
        }

        this.log.warn(`VietQR API failed: ${JSON.stringify(data)}`);
      } catch (err) {
        this.log.warn(
          `VietQR API error: ${err instanceof Error ? err.message : err}`,
        );
      }
    }

    const params = new URLSearchParams({
      amount: String(amount),
      addInfo: paymentCode,
      accountName,
    });
    const qrImageUrl = `https://img.vietqr.io/image/${acqId}-${accountNo}-compact2.jpg?${params}`;

    return {
      qrImageUrl,
      paymentCode,
      bankAccountInfo,
      source: 'vietqr_img',
    };
  }
}
