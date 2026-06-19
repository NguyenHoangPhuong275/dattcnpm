import { Resend } from 'resend';
import { env } from '@/lib/env';

let resendInstance: Resend | null = null;

export function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = env.API_KEY_RESEND;
    if (!apiKey) {
      throw new Error('API_KEY_RESEND is not set in environment variables');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}
