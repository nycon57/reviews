import { z } from 'zod';

export const ListPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      items: z.array(z.string()).optional().nullable(),
      type: z.enum(['bullet', 'number', 'check']).optional().nullable(),
      markerColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ListProps = z.infer<typeof ListPropsSchema>;
