import { z } from 'zod';

export const UOM_TYPES = [
  'NUMERIC_MIN',
  'NUMERIC_MAX',
  'PERCENTAGE_MIN',
  'PERCENTAGE_MAX',
  'TIMELINE',
  'ZERO_BASED',
] as const;

export const goalSchema = z.object({
  title: z.string().min(3, 'Title needs at least 3 characters').max(120, 'Keep title under 120 characters'),
  description: z.string().max(2000, 'Keep description under 2000 characters').optional().or(z.literal('')),
  thrustAreaId: z.string().min(1, 'Pick a thrust area'),
  uomType: z.enum(UOM_TYPES),
  uomUnit: z.string().max(40).optional().or(z.literal('')),
  target: z.number().nullable().optional(),
  targetDate: z.string().nullable().optional(),
  weightage: z.number().min(10, 'Minimum weightage per goal is 10%').max(100, 'Maximum 100% per goal'),
});

export const goalSheetSchema = z.object({
  goals: z
    .array(goalSchema)
    .min(1, 'Add at least one goal')
    .max(8, 'Maximum 8 goals per sheet')
    .refine(
      (goals) => Math.abs(goals.reduce((s, g) => s + g.weightage, 0) - 100) < 0.01,
      { message: 'Total weightage across goals must equal exactly 100%' }
    ),
});

export type GoalInput = z.infer<typeof goalSchema>;
export type GoalSheetInput = z.infer<typeof goalSheetSchema>;
