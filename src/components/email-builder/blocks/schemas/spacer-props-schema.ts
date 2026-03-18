import { z } from 'zod';

export const SpacerPropsSchema = z.object({
  props: z
    .object({
      height: z.number().min(8).max(120).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type SpacerProps = z.infer<typeof SpacerPropsSchema>;
