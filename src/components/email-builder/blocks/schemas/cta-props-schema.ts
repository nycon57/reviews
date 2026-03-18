import { z } from 'zod';

export const CTAPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      heading: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      buttonText: z.string().optional().nullable(),
      buttonHref: z.string().optional().nullable(),
      variant: z.enum(['default', 'brand', 'dark', 'gradient']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type CTASidebarProps = z.infer<typeof CTAPropsSchema>;
