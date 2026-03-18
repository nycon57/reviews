import { z } from 'zod';

export const CalloutPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      text: z.string().optional().nullable(),
      title: z.string().optional().nullable(),
      variant: z
        .enum(['info', 'success', 'warning', 'tip', 'important'])
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});

export type CalloutProps = z.infer<typeof CalloutPropsSchema>;
