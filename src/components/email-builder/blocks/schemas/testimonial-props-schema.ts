import { z } from 'zod';

export const TestimonialPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      quote: z.string().optional().nullable(),
      authorName: z.string().optional().nullable(),
      authorTitle: z.string().optional().nullable(),
      authorPhotoUrl: z.string().optional().nullable(),
      rating: z.number().min(0).max(5).optional().nullable(),
      variant: z.enum(['default', 'featured', 'compact']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type TestimonialProps = z.infer<typeof TestimonialPropsSchema>;
