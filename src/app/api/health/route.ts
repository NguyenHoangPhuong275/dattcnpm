import { sendSuccess } from '@/lib/api-response';

export async function GET() {
  return sendSuccess({
    status: 'ok',
    service: 'smart-travel-guide',
    timestamp: new Date().toISOString(),
  });
}
