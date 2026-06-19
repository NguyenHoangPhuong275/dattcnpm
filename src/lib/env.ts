import { z } from 'zod';


const nonEmpty = (name: string) => z.string().min(1, `${name} là bắt buộc (không được để trống)`);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  JWT_SECRET: nonEmpty('JWT_SECRET'),
  MONGODB_URI: nonEmpty('MONGODB_URI'),
  REDIS_URL: nonEmpty('REDIS_URL'),
  WEBHOOK_SECRET: nonEmpty('WEBHOOK_SECRET'),

  WEBHOOK_IP_ALLOWLIST: z.string().optional().default(''),
  TRUSTED_PROXY_CIDRS: z.string().optional().default(''),
  CRON_SECRET: z.string().optional(),
  DEBUG_SECRET: z.string().optional(),
  API_KEY_RESEND: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const name = issue.path.join('.') || '(unknown)';
      return `  - ${name}: ${issue.message}`;
    })
    .join('\n');
}

export function parseEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const source = {
    ...raw,
    MONGODB_URI: raw.MONGODB_URI || raw.MONGO_URI,
  };

  const result = envSchema.safeParse(source);
  if (!result.success) {
    throw new Error(
      `❌ Cấu hình biến môi trường không hợp lệ. Vui lòng kiểm tra .env:\n${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    cached = parseEnv();
  }
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}

export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    return getEnv()[prop as keyof Env];
  },
  has(_target, prop: string) {
    return prop in getEnv();
  },
  ownKeys() {
    return Reflect.ownKeys(getEnv());
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    return Object.getOwnPropertyDescriptor(getEnv(), prop);
  },
});
