import { z } from 'zod';

export const addCollaboratorSchema = z.object({
  email: z.string().email('Email không đúng định dạng').toLowerCase().trim(),
  permission: z.enum(['READ', 'EDIT']).optional().default('READ'),
});

export const updateCollaboratorSchema = z.object({
  permission: z.enum(['READ', 'EDIT']),
});

export type AddCollaboratorInput = z.infer<typeof addCollaboratorSchema>;
