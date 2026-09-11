const colors = {
  background: "#070f11",
  title: "#f8fafc",
  text: "#e5eef1",
  textMuted: "#8fa4ad",
  accent: "#4de1d4",
  accentSoft: "#a8fff5",
  line: "rgba(143, 164, 173, 0.24)",
  accentTitleGlow: "rgba(77, 225, 212, 0.24)",
  accentGlow: "rgba(77, 225, 212, 0.5)",
} as const;

const fonts = {
  title: '"Arial", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  script: '"Arial", "PingFang SC", "Hiragino Sans GB", sans-serif',
} as const;

const fontSizes = {
  heroTitle: "clamp(2.5rem, 2.14rem + 1.52vw, 3rem)",
  sectionSubtitle: "clamp(0.875rem, 0.696rem + 0.76vw, 1.125rem)",
  cardTitle: "clamp(1.125rem, 0.946rem + 0.76vw, 1.375rem)",
  bodyLarge: "clamp(1rem, 0.911rem + 0.38vw, 1.125rem)",
  body: "clamp(0.875rem, 0.786rem + 0.38vw, 1rem)",
  caption: "clamp(0.75rem, 0.661rem + 0.38vw, 0.875rem)",
} as const;

const lineHeights = {
  heroTitle: 1.04,
  sectionSubtitle: 1.4,
  cardTitle: 1.3,
  bodyLarge: 1.9,
  body: 1.65,
  caption: 1.5,
} as const;

const letterSpacings = {
  title: "0.05em",
  subtitle: "0.18em",
  body: "0.06em",
  caption: "0.1em",
} as const;

const fontWeights = {
  regular: 400,
  bold: 700,
} as const;

const video = {
  corner: {
    fontSize: 24,
    fontWeight: fontWeights.bold,
    letterSpacing: letterSpacings.caption,
  },
  title: {
    fontSize: 78,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heroTitle,
    letterSpacing: letterSpacings.title,
  },
  finalTitle: {
    fontSize: 63,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.heroTitle,
    letterSpacing: letterSpacings.title,
  },
  point: {
    fontSize: 44,
    lineHeight: 1.45,
    letterSpacing: letterSpacings.body,
  },
  finalPoint: {
    fontSize: 66,
    lineHeight: 1.45,
    letterSpacing: letterSpacings.body,
  },
  titleShadow: `0 0 18px ${colors.accentTitleGlow}`,
  pointShadow: `0 0 12px ${colors.accentGlow}`,
  progressShadow: `0 0 10px ${colors.accentGlow}`,
} as const;

export const theme = {
  colors,
  fonts,
  fontSizes,
  lineHeights,
  letterSpacings,
  fontWeights,
  video,
} as const;

export type Theme = typeof theme;
