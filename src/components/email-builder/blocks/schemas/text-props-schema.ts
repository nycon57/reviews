import { z } from 'zod';

export const TextPropsSchema = z.object({
  props: z
    .object({
      text: z.string().optional().nullable(),
      fontSize: z.number().min(12).max(48).optional().nullable(),
      lineHeight: z.string().optional().nullable(),
      color: z.string().optional().nullable(),
      fontWeight: z.enum(['normal', '600']).optional().nullable(),
      align: z.enum(['left', 'center', 'right']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type TextProps = z.infer<typeof TextPropsSchema>;
