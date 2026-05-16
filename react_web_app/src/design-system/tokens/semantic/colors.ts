/**
 * Semantic color tokens – map primitives to meaning.
 * Use these in app code (buttons, text, surfaces, etc.).
 */
import { blue } from '../primitives/blue';
import { gray } from '../primitives/gray';
import { red } from '../primitives/red';

export const semanticColors = {
  // Primary (blue)
  primary: blue.blueNormal,
  primaryHover: blue.blueNormalHover,
  primaryActive: blue.blueNormalActive,
  primarySoft: blue.blueLight,
  primarySoftHover: blue.blueLightHover,
  primarySoftActive: blue.blueLightActive,

  // Info (blue)
  info: '#4593FC',
  infoSoft: blue.blueLight,

  // Neutral / UI
  secondary: gray.gray400,
  background: gray.gray50,
  surface: '#FFFFFF',

  // Feedback
  error: red.redNormal,
  errorSoft: red.redLight,
  success: '#03B26C',
  successSoft: '#AEEFD5',
  warning: '#FE9800',
  warningSoft: '#FFE0B0',

  // Text
  textPrimary: gray.gray800,
  textSecondary: gray.gray500,
  textLight: gray.gray300,

  // Sidebar
  sidebarBackground: gray.gray800,
  sidebarText: gray.gray100,
  sidebarActive: blue.blueNormal,
} as const;
