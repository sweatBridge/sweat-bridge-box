import { AppColors } from '../constants/colors';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: AppColors.background,
        color: AppColors.textSecondary,
        textAlign: 'center',
        padding: '16px',
        fontSize: '14px',
        borderTop: '1px solid #E5E7EB',
      }}
    >
      © 2026 Sweat Bridge. All rights reserved.
    </footer>
  );
};

export default Footer;
