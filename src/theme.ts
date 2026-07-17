export const colors = {
  // Brand
  primary: '#3B3358',       
  primaryDark: '#241F38',   
  primaryLight: '#5A4F7E',  

  accent: '#E2A33D',        
  accentDark: '#C48A2A',
  accentSoft: '#FBF0DA',

  // Neutrals
  background: '#FAF7F2',    
  surface: '#FFFFFF',      
  surfaceAlt: '#F3EEE6',    
  border: '#EAE3D6',
  divider: '#F0EAE0',

  // Text
  textPrimary: '#221D2E',
  textSecondary: '#6F6880',
  textMuted: '#A79FB3',
  textOnPrimary: '#FFFFFF',
  textOnAccent: '#2A1D04',

  // Feedback
  success: '#3F9463',
  successBg: '#E8F5EC',
  warning: '#DB9A34',
  warningBg: '#FBF1DF',
  danger: '#D1495B',
  dangerBg: '#FBEAEC',
  info: '#3D74B8',
  infoBg: '#EAF1FA',

  overlay: 'rgba(24, 20, 34, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 26, fontWeight: '700' as const, letterSpacing: 0.1 },
  h2: { fontSize: 20, fontWeight: '700' as const },
  h3: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  bodyStrong: { fontSize: 15, fontWeight: '600' as const },
  caption: { fontSize: 12.5, fontWeight: '500' as const },
  label: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2 },
};

export const shadow = {
  card: {
    shadowColor: '#1A1424',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  raised: {
    shadowColor: '#1A1424',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: '#C48A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
};