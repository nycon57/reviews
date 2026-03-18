import { z } from 'zod';

export const ArticlePropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      variant: z.enum(['hero', 'horizontal']).optional().nullable(),
      heading: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      imageUrl: z.string().optional().nullable(),
      imageAlt: z.string().optional().nullable(),
      buttonText: z.string().optional().nullable(),
      buttonHref: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ArticleProps = z.infer<typeof ArticlePropsSchema>;
