/**
 * Curated theme-customization enums. The frontend carries the real CSS values
 * (colors/font-family strings); this backend list is only the validation
 * source of truth for the keys, same asymmetry as themeRegistry.ts's THEMES.
 */
export const ACCENT_KEYS = ['rose', 'amber', 'sage', 'sky', 'ink', 'plum'] as const;
export type AccentKey = (typeof ACCENT_KEYS)[number];

export const HEADING_FONT_KEYS = [
  'playfair', 'lora', 'cormorant', 'ebGaramond', 'oswald', 'spaceGrotesk', 'spaceMono', 'nunito', 'geist',
] as const;
export type HeadingFontKey = (typeof HEADING_FONT_KEYS)[number];
