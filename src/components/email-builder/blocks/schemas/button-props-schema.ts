import { z } from 'zod';

export const ButtonPropsSchema = z.object({
  props: z
    .object({
      text: z.string().optional().nullable(),
      href: z.string().optional().nullable(),
      fullWidth: z.boolean().optional().nullable(),
      borderRadius: z.number().min(0).max(16).optional().nullable(),
      padding: z.number().min(8).max(20).optional().nullable(),
      backgroundColor: z.string().optional().nullable(),
      textColor: z.string().optional().nullable(),
      borderColor: z.string().optional().nullable(),
      fontWeight: z.number().optional().nullable(),
      align: z.enum(['left', 'center', 'right']).optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type ButtonEditorProps = z.infer<typeof ButtonPropsSchema>;
