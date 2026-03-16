import { blue } from '../design-system/tokens';
import { semanticColors } from '../design-system/tokens';

/**
 * 애플리케이션에서 사용하는 그라데이션 상수들 (design system primary = blue normal)
 */
export const Gradients = {
  primary: `linear-gradient(135deg, ${blue.blueNormal} 0%, ${semanticColors.info} 100%)`,
  primaryHover: `linear-gradient(135deg, ${blue.blueNormalHover} 0%, ${blue.blueNormal} 100%)`,
  primaryLight: `linear-gradient(135deg, ${blue.blueLight} 0%, ${blue.blueLightActive} 100%)`,
} as const;

export default Gradients; 