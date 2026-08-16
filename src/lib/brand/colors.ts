export const repwellColors = {
  sage: {
    100: "#cad2c5",
    200: "#84a98c",
  },
  teal: {
    300: "#52796f",
    400: "#354f52",
    500: "#2f3e46",
  },
} as const;

export const brandColors = {
  repwell: repwellColors,
  primary: repwellColors.teal[300],
  primaryHover: repwellColors.teal[400],
  primaryLight: repwellColors.sage[200],
  secondary: repwellColors.sage[200],
  secondaryHover: repwellColors.teal[300],
  background: {
    white: "#ffffff",
    subtle: "#f8faf8",
    muted: "#f0f4f0",
    sage: repwellColors.sage[100],
    dark: repwellColors.teal[500],
  },
  text: {
    primary: repwellColors.teal[500],
    secondary: repwellColors.teal[400],
    muted: repwellColors.teal[300],
    subtle: repwellColors.sage[200],
    inverse: "#ffffff",
    inverseMuted: repwellColors.sage[100],
  },
  border: {
    default: "#e2e8e4",
    subtle: "#eef2ee",
    accent: repwellColors.sage[200],
  },
  accent: {
    success: repwellColors.sage[200],
    warning: "#d4a574",
    error: "#c47c7c",
    info: "#7c9eb8",
  },
} as const;
