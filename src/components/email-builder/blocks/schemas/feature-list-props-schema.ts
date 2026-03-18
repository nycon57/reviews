import { z } from 'zod';

export const FeatureListPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      items: z
        .array(z.object({ title: z.string(), description: z.string(), iconUrl: z.string().optional() }))
        .optional()
        .nullable(),
      variant: z.enum(['numbered', 'bulleted', 'icon-rows', 'numbered-circles']).optional().nullable(),
      columns: z.union([z.literal(1), z.literal(2)]).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type FeatureListProps = z.infer<typeof FeatureListPropsSchema>;
