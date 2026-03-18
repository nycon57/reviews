import { z } from 'zod';

export const RatingPropsSchema = z.object({
  style: z
    .object({
      backgroundColor: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  props: z
    .object({
      question: z.string().optional().nullable(),
      scale: z.union([z.literal(5), z.literal(10)]).optional().nullable(),
      surveyUrl: z.string().optional().nullable(),
      lowLabel: z.string().optional().nullable(),
      highLabel: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
});

export type RatingProps = z.infer<typeof RatingPropsSchema>;
