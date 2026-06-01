// ── HunarHub Premium Palette — Electric Violet ───────────────────────────────
// Used by: Discord, Linear, Figma, Twitch, Vercel — #1 premium dark palette
// Primary:   #7C3AED  Electric Violet
// Secondary: #A855F7  Bright Purple
// Accent:    #06B6D4  Cyan pop (for contrast on dark)

export const COLORS = {
  background:    '#0A0A0F',   // Near-black with purple undertone
  card:          '#13111C',   // Deep purple-tinted card
  primary:       '#7C3AED',   // Electric Violet — main brand
  secondary:     '#A855F7',   // Bright Purple — accent
  text:          '#F1F0F5',   // Soft white
  textSecondary: '#6B6880',   // Muted purple-grey
  border:        '#2D2640',   // Subtle purple border
  error:         '#EF4444',   // Red
  success:       '#10B981',   // Emerald green
  warning:       '#F59E0B',   // Amber
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
