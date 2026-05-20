// ============================================================
// RENTIFY — Design System : theme.ts
// Palette : Sunset Marketplace
// Typo    : Poppins + Inter
// Style   : Soft & Rounded
// ============================================================

// ─── COULEURS ────────────────────────────────────────────────
export const Colors = {
  // Primaire — Orange Rentify
  primary: '#E85D26',
  primaryLight: '#FF8C5A',
  primaryXLight: '#FFE8DC',
  primaryDark: '#C44A18',

  // Secondaire — Teal
  secondary: '#1A9E75',
  secondaryLight: '#4DC9A0',
  secondaryXLight: '#E1F5EE',
  secondaryDark: '#0D6E56',

  // Neutres — Fond & Texte
  background: '#FAFAF8',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F4F0',

  // Texte
  textPrimary: '#1A1A2E',
  textSecondary: '#6B6B7B',
  textTertiary: '#A0A0B0',
  textInverse: '#FFFFFF',

  // Bordures
  border: '#EBE9E4',
  borderStrong: '#D4D1C8',

  // États
  success: '#1A9E75',
  successLight: '#E1F5EE',
  warning: '#F0A020',
  warningLight: '#FFF4E0',
  error: '#E83A26',
  errorLight: '#FFEDEB',
  info: '#2980E8',
  infoLight: '#EBF4FF',

  // Statuts location (Rental)
  pending: '#F0A020',
  pendingBg: '#FFF4E0',
  accepted: '#1A9E75',
  acceptedBg: '#E1F5EE',
  rejected: '#E83A26',
  rejectedBg: '#FFEDEB',
  cancelled: '#A0A0B0',
  cancelledBg: '#F5F4F0',
  completed: '#2980E8',
  completedBg: '#EBF4FF',

  // Overlay & Shadow
  overlay: 'rgba(26, 26, 46, 0.5)',
  shadow: 'rgba(26, 26, 46, 0.10)',
  shadowStrong: 'rgba(26, 26, 46, 0.18)',
};

// ─── TYPOGRAPHIE ─────────────────────────────────────────────
export const Typography = {
  fontDisplay: 'Poppins_700Bold',
  fontHeading: 'Poppins_600SemiBold',
  fontSubheading: 'Poppins_500Medium',
  fontBody: 'Inter_400Regular',
  fontBodyMedium: 'Inter_500Medium',

  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1.0,
  },
};

// ─── ESPACEMENT ──────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

// ─── BORDER RADIUS ───────────────────────────────────────────
export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
};

// ─── OMBRES ──────────────────────────────────────────────────
export const Shadows = {
  none: {},
  sm: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  lg: {
    shadowColor: Colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  button: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── DIMENSIONS FIXES ────────────────────────────────────────
export const Layout = {
  tabBarHeight: 60,
  headerHeight: 56,
  statusBarOffset: 44,

  buttonHeight: {
    sm: 36,
    md: 48,
    lg: 56,
  },
  inputHeight: 52,
  cardImageHeight: 200,
  avatarSize: {
    sm: 32,
    md: 44,
    lg: 64,
    xl: 96,
  },

  screenPadding: 16,
  cardGap: 12,
  sectionGap: 24,
};

// ─── STYLES PRÉFABRIQUÉS ─────────────────────────────────────
export const Presets = {
  cardBase: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
  },

  cardMedia: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden' as const,
    ...Shadows.card,
  },

  inputBase: {
    height: Layout.inputHeight,
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xl,
    fontSize: Typography.size.md,
    color: Colors.textPrimary,
  },

  buttonPrimary: {
    height: Layout.buttonHeight.md,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing['3xl'],
    ...Shadows.button,
  },

  buttonSecondary: {
    height: Layout.buttonHeight.md,
    backgroundColor: 'transparent',
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: Spacing['3xl'],
  },

  priceBadge: {
    backgroundColor: Colors.primaryXLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },

  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing.lg,
  },

  iconRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing.sm,
  },
};

// ─── CATÉGORIES & ICÔNES ─────────────────────────────────────
export const Categories = [
  { id: 'outils',       label: 'Outils',       icon: 'hammer-outline',   color: '#E85D26' },
  { id: 'sport',        label: 'Sport',        icon: 'bicycle-outline',   color: '#1A9E75' },
  { id: 'jardinage',    label: 'Jardinage',    icon: 'leaf-outline',      color: '#3B8A2A' },
  { id: 'evenement',    label: 'Événement',    icon: 'balloon-outline',   color: '#9B59B6' },
  { id: 'maison',       label: 'Maison',       icon: 'home-outline',      color: '#2980B9' },
  { id: 'informatique', label: 'Informatique', icon: 'laptop-outline',    color: '#34495E' },
  { id: 'photo',        label: 'Photo/Vidéo',  icon: 'camera-outline',    color: '#E67E22' },
  { id: 'autre',        label: 'Autre',        icon: 'grid-outline',      color: '#A0A0B0' },
] as const;

// ─── STATUTS LOCATION ────────────────────────────────────────
export const RentalStatusConfig = {
  PENDING:   { label: 'En attente', color: Colors.pending,   bg: Colors.pendingBg   },
  ACCEPTED:  { label: 'Acceptée',   color: Colors.accepted,  bg: Colors.acceptedBg  },
  REJECTED:  { label: 'Refusée',    color: Colors.rejected,  bg: Colors.rejectedBg  },
  CANCELLED: { label: 'Annulée',    color: Colors.cancelled, bg: Colors.cancelledBg },
  COMPLETED: { label: 'Terminée',   color: Colors.completed, bg: Colors.completedBg },
} as const;

// ─── ANIMATIONS ──────────────────────────────────────────────
export const Animation = {
  fast: 200,
  normal: 300,
  slow: 500,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
};

// ─── EXPORT GLOBAL ───────────────────────────────────────────
const theme = {
  Colors,
  Typography,
  Spacing,
  Radius,
  Shadows,
  Layout,
  Presets,
  Categories,
  RentalStatusConfig,
  Animation,
};

export default theme;
