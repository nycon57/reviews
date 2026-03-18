import { z } from 'zod';

export const StatsPropsSchema = z.object({
  style: z
    .object({
      /** Outer section/container background color */
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      items: z
        .array(z.object({ value: z.string(), label: z.string() }))
        .optional()
        .nullable(),
      columns: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional().nullable(),
      showDividers: z.boolean().optional().nullable(),
      /** Individual card/row background — distinct from style.backgroundColor (outer section) */
      cardBackgroundColor: z.string().optional().nullable(),
      variant: z.enum(["row", "cards"]).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type StatsProps = z.infer<typeof StatsPropsSchema>;
