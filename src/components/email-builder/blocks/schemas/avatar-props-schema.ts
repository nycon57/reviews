import { z } from 'zod';

export const AvatarPropsSchema = z.object({
  props: z
    .object({
      variant: z.enum(['single', 'stacked', 'profile']).optional().nullable(),
      images: z
        .array(
          z.object({
            src: z.string(),
            alt: z.string(),
          })
        )
        .optional()
        .nullable(),
      size: z.number().min(30).max(80).optional().nullable(),
      shape: z.enum(['circle', 'rounded']).optional().nullable(),
      name: z.string().optional().nullable(),
      title: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type AvatarEditorProps = z.infer<typeof AvatarPropsSchema>;
