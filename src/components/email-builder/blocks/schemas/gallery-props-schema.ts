import { z } from 'zod';

export const GalleryPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      variant: z.enum(['grid', 'featured']).optional().nullable(),
      heading: z.string().optional().nullable(),
      description: z.string().optional().nullable(),
      images: z
        .array(
          z.object({
            src: z.string(),
            alt: z.string(),
            href: z.string(),
          })
        )
        .optional()
        .nullable(),
    })
    .optional()
    .nullable(),
});

export type GalleryProps = z.infer<typeof GalleryPropsSchema>;
