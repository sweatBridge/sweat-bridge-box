/**
 * Gray primitive tokens
 */
export const gray = {
  gray50: '#F9FAFB',
  gray100: '#F2F4F6',
  gray200: '#E5E8EB',
  gray300: '#B0B8C1',
  gray400: '#8B95A1',
  gray500: '#6B7684',
  gray600: '#4E5968',
  gray700: '#333D4B',
  gray800: '#191F28',
  gray900: '#101010',
} as const;

export type GrayToken = keyof typeof gray;
