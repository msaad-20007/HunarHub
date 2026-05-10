export const COLORS = {
  background: '#121212', // Dark background
  card: '#1E1E1E',       // Slightly lighter card background
  primary: '#00D2FF',    // Vivid cyan primary
  secondary: '#3A7BD5',  // Vivid blue secondary
  text: '#FFFFFF',       // Primary text
  textSecondary: '#A0A0A0', // Secondary text
  border: '#2C2C2C',     // Subtle border
  error: '#FF4C4C',      // Error red
  success: '#00E676',    // Success green
  warning: '#FFC107',    // Warning yellow
};

export const SIZES = {
  base: 8,
  small: 12,
  font: 14,
  medium: 16,
  large: 18,
  extraLarge: 24,
  title: 32,
  radius: 12,
  padding: 20,
};

export const FONTS = {
  title: {
    fontSize: SIZES.title,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  large: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text,
  },
  body: {
    fontSize: SIZES.medium,
    fontWeight: '400',
    color: COLORS.text,
  },
  small: {
    fontSize: SIZES.small,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
};

export const Theme = {
  COLORS,
  SIZES,
  FONTS,
};
