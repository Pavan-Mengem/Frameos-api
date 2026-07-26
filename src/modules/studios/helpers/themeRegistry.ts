/**
 * Portfolio themes. The frontend theme registry is the source of truth for
 * *rendering*; this list mirrors it so the backend can validate keys on set
 * and enforce Pro gating (FR-WEB-3). Keep in sync when frontend ships a new
 * theme.
 */
export interface ThemeMeta {
  key: string;
  name: string;
  isPremium: boolean;
}

export const THEMES: readonly ThemeMeta[] = [
  { key: 'minimal-editorial', name: 'Minimal Editorial', isPremium: false },
  { key: 'candid-bloom',      name: 'Candid Bloom',      isPremium: false },
  { key: 'studio-mono',       name: 'Studio Mono',       isPremium: false },
  { key: 'royal-heritage',    name: 'Royal Heritage',    isPremium: true  },
  { key: 'noir-cinematic',    name: 'Noir Cinematic',    isPremium: true  },
];

export const THEME_KEYS = THEMES.map((t) => t.key);

export const isThemeAllowedForPlan = (themeKey: string, plan: 'free' | 'pro' | 'studio'): boolean => {
  const t = THEMES.find((x) => x.key === themeKey);
  if (!t) return false;
  return !t.isPremium || plan !== 'free';
};
