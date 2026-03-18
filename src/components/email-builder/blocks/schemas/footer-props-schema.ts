import { z } from 'zod';

export const FooterPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      variant: z.enum(['centered', 'split']).optional().nullable(),
      logoSrc: z.string().optional().nullable(),
      logoAlt: z.string().optional().nullable(),
      companyName: z.string().optional().nullable(),
      tagline: z.string().optional().nullable(),
      address: z.string().optional().nullable(),
      contactInfo: z.string().optional().nullable(),
      socialLinks: z
        .object({
          facebook: z.string().optional().nullable(),
          twitter: z.string().optional().nullable(),
          instagram: z.string().optional().nullable(),
          linkedin: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type FooterProps = z.infer<typeof FooterPropsSchema>;
