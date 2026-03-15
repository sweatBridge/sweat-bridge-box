/**
 * Red primitive tokens (error, danger)
 */
export const red = {
  redLight: '#FEE2E2',
  redLightHover: '#FECACA',
  redNormal: '#F04452',
  redNormalHover: '#D92D3B',
  redDark: '#B42318',
} as const;

export type RedToken = keyof typeof red;
