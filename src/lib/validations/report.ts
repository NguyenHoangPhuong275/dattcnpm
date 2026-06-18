import { z } from 'zod';
import { optionalTrimString } from './common';
import { REVIEW_REPORT_REASONS } from '@/lib/db/models';

export const reportReviewSchema = z.object({
  reason: z.enum(REVIEW_REPORT_REASONS),
  note: optionalTrimString(500),
});

export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
