/**
 * Blue primitive tokens (key color)
 */
export const blue = {
  blueLight: '#eaf3fe',
  blueLightHover: '#e0ecfe',
  blueLightActive: '#bfd8fc',

  blueNormal: '#3182f6',
  blueNormalHover: '#2c75dd',
  blueNormalActive: '#2768c5',

  blueDark: '#2562b9',
  blueDarkHover: '#1d4e94',
  blueDarkActive: '#163a6f',

  blueDarker: '#112e56',
} as const;

export type BlueToken = keyof typeof blue;
