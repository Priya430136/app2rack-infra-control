// Colors are copied 1:1 from rackvue-insight/src/styles.css (the real app's
// design tokens) so the recreated screens in this video are color-accurate,
// not an approximation.
export const theme = {
  background: "oklch(0.18 0.025 250)",
  card: "oklch(0.22 0.028 250)",
  cardAlt: "oklch(0.24 0.028 250 / 0.9)",
  foreground: "oklch(0.96 0.01 240)",
  mutedForeground: "oklch(0.7 0.02 240)",
  border: "oklch(0.3 0.03 250 / 0.6)",
  primary: "oklch(0.78 0.15 200)", // teal
  chart1: "oklch(0.78 0.15 200)",
  chart2: "oklch(0.72 0.17 155)", // green
  chart3: "oklch(0.78 0.16 75)", // amber
  chart4: "oklch(0.65 0.2 290)", // purple
  chart5: "oklch(0.7 0.2 15)", // red-orange
  success: "oklch(0.72 0.17 155)",
  warning: "oklch(0.78 0.16 75)",
  destructive: "oklch(0.62 0.22 25)",
  info: "oklch(0.7 0.14 240)",
  gradient: "linear-gradient(135deg, oklch(0.78 0.15 200) 0%, oklch(0.65 0.2 290) 100%)",
};

export const statusColor = (status: string) => {
  switch (status) {
    case "healthy":
      return theme.success;
    case "warning":
      return theme.warning;
    case "critical":
      return theme.destructive;
    case "offline":
      return theme.mutedForeground;
    default:
      return theme.mutedForeground;
  }
};

export const severityColor = (sev: string) => {
  switch (sev) {
    case "Critical":
      return theme.destructive;
    case "High":
      return theme.warning;
    case "Medium":
      return theme.info;
    default:
      return theme.mutedForeground;
  }
};
