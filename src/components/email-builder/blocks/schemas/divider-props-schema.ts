import { z } from 'zod';

export const DividerPropsSchema = z.object({
  props: z
    .object({
      variant: z
        .enum(['solid', 'dashed', 'dotted', 'gradient'])
        .optional()
        .nullable(),
      color: z.string().optional().nullable(),
      thickness: z.number().min(1).max(4).optional().nullable(),
      spacing: z.enum(['sm', 'md', 'lg']).optional().nullable(),
      label: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type DividerEditorProps = z.infer<typeof DividerPropsSchema>;
