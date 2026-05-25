/** Spacing scale (matches Tailwind default spacing). Values in density-independent pixels. */
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;

export const screenLayout = {
  screenPaddingX: spacing[4],
  screenPaddingBottom: spacing[8],
  sectionGap: spacing[4],
  stackGap: spacing[2],
  cardPadding: spacing[4],
} as const;
