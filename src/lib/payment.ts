import { env } from '@/lib/env';
import type { BookingPaymentMode } from '@/types/booking';

export interface PaymentInfo {
  mode: BookingPaymentMode;
  bankCode: string;
  accountNo: string;
  accountName: string;
  amount: number;
  content: string;
  qrImageUrl: string;
}

export interface BookingPaymentConfig {
  mode: BookingPaymentMode;
  bankCode: string;
  accountNo: string;
  accountName: string;
}

function toAscii(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim();
}

function buildDemoQrImageUrl(amount: number, content: string): string {
  const params = new URLSearchParams({
    size: '240x240',
    margin: '12',
    data: `LOTUS_PAYMENT|${Math.max(0, Math.round(amount))}|${toAscii(content)}`,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

export function buildBookingPayment(
  amount: number,
  content: string,
  config: BookingPaymentConfig = {
    mode: env.PAYMENT_MODE,
    bankCode: env.PAYMENT_BANK_CODE,
    accountNo: env.PAYMENT_ACCOUNT_NO,
    accountName: env.PAYMENT_ACCOUNT_NAME,
  },
): PaymentInfo {
  const bankCode = config.bankCode.trim();
  const accountNo = config.accountNo.trim();
  const accountName = toAscii(config.accountName);
  const addInfo = toAscii(content);
  const paymentConfigured = Boolean(bankCode && accountNo && accountName);

  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo,
    accountName,
  });
  const qrImageUrl = config.mode === 'demo'
    ? buildDemoQrImageUrl(amount, content)
    : paymentConfigured
      ? `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.png?${params.toString()}`
      : '';

  return { mode: config.mode, bankCode, accountNo, accountName, amount, content, qrImageUrl };
}
