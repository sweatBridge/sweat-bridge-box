import { blue, semanticColors } from '../design-system/tokens';

/**
 * App color palette – primitives + semantic.
 * Prefer semantic (primary, textPrimary, …) in UI; use blue/gray/red when you need a raw token.
 */
export const AppColors = {
  ...blue,
  ...semanticColors,
} as const;