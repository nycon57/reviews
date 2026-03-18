import { z } from 'zod';

export const HeadingPropsSchema = z.object({
  props: z
    .object({
      text: z.string().optional().nullable(),
      level: z
        .enum(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        .optional()
        .nullable(),
      align: z.enum(['left', 'center', 'right']).optional().nullable(),
      color: z.string().optional().nullable(),
      fontSize: z.number().optional().nullable(),
      fontWeight: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type HeadingProps = z.infer<typeof HeadingPropsSchema>;
