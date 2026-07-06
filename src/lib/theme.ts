export type Theme = "basic" | "light" | "dark";

export const THEME_LABELS: Record<Theme, string> = {
  basic: "Basic",
  light: "Light",
  dark: "Dark",
};

/** Apply the theme to <html>. "basic" clears the attribute (default tokens). */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  if (theme === "basic") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", theme);
}
