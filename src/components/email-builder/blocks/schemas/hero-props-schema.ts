import { z } from 'zod';

export const HeroPropsSchema = z.object({
  style: z
    .object({
      /** Outer section/container background color */
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      headline: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      buttonText: z.string().optional().nullable(),
      buttonHref: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      imageAlt: z.string().optional().nullable(),
      imagePosition: z.enum(['top', 'bottom', 'right']).optional().nullable(),
      /** Inner content area background — distinct from style.backgroundColor (outer section) */
      contentBackgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type HeroProps = z.infer<typeof HeroPropsSchema>;
