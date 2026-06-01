// ── HunarHub Premium Palette — Midnight Amber ────────────────────────────────
// Inspired by: Uber, Revolut, premium fintech apps
// Primary:   #F5A623  (Warm Amber Gold)
// Secondary: #E8621A  (Deep Coral Orange)
// Dark bg:   #0D0D0D → #1A1208  (Near-black with warm undertone)

export const COLORS = {
  background:    '#0F0D0A',   // Near-black warm dark
  card:          '#1C1812',   // Warm dark card
  primary:       '#F5A623',   // Amber gold — main brand color
  secondary:     '#E8621A',   // Coral orange — accent
  text:          '#F5EFE6',   // Warm white
  textSecondary: '#8A7D6B',   // Warm muted
  border:        '#2E2820',   // Warm dark border
  error:         '#FF4C4C',   // Red
  success:       '#2ECC71',   // Green
  warning:       '#F5A623',   // Same as primary amber
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
