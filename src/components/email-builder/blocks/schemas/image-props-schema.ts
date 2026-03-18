import { z } from 'zod';

export const ImagePropsSchema = z.object({
  props: z
    .object({
      src: z.string().optional().nullable(),
      alt: z.string().optional().nullable(),
      width: z.number().min(50).max(600).optional().nullable(),
      height: z.number().optional().nullable(),
      borderRadius: z.number().min(0).max(24).optional().nullable(),
      align: z.enum(['left', 'center', 'right']).optional().nullable(),
      href: z.string().optional().nullable(),
      caption: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ImageEditorProps = z.infer<typeof ImagePropsSchema>;
