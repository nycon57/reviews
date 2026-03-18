import { z } from 'zod';

const NavLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
});

export const HeaderPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      variant: z.enum(['centered', 'inline', 'social']).optional().nullable(),
      logoSrc: z.string().optional().nullable(),
      logoAlt: z.string().optional().nullable(),
      logoHeight: z.number().min(20).max(120).optional().nullable(),
      navLinks: z.array(NavLinkSchema).optional().nullable(),
      socialLinks: z
        .object({
          twitter: z.string().optional().nullable(),
          instagram: z.string().optional().nullable(),
          facebook: z.string().optional().nullable(),
          linkedin: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
      backgroundColor: z.string().optional().nullable(),
      linkColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type HeaderEditorProps = z.infer<typeof HeaderPropsSchema>;
