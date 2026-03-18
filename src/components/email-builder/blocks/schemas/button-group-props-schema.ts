import { z } from 'zod';

export const ButtonGroupPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      buttons: z
        .array(
          z.object({
            text: z.string(),
            href: z.string(),
            variant: z.string().optional(),
          })
        )
        .optional()
        .nullable(),
      align: z.enum(['left', 'center', 'right']).optional().nullable(),
      stackOnMobile: z.boolean().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ButtonGroupProps = z.infer<typeof ButtonGroupPropsSchema>;
