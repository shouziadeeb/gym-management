/**
 * Reusable NativeWind class strings.
 * Color classes use explicit light/dark variants — CSS variables do not resolve on React Native native.
 */

export const text = {
  screenTitle: 'text-3xl font-bold text-slate-900 dark:text-slate-50',
  screenTitleLg: 'text-2xl font-bold text-slate-900 dark:text-white',
  screenTitleMd: 'text-xl font-semibold text-slate-900 dark:text-white',
  screenSubtitle: 'text-base text-slate-600 dark:text-white',
  body: 'text-base text-slate-700 dark:text-white',
  bodySm: 'text-sm text-slate-700 dark:text-white',
  caption: 'text-sm text-slate-600 dark:text-white',
  label: 'text-sm font-medium text-slate-600 dark:text-white',
  meta: 'text-slate-500 dark:text-white',
  error: 'text-sm text-red-600 dark:text-red-400',
  link: 'text-sm text-emerald-600 dark:text-emerald-400',
  linkAccent: 'text-sm text-emerald-400',
  loading: 'text-slate-500 dark:text-slate-400',
  cardTitle: 'text-lg font-semibold text-slate-900 dark:text-slate-50',
  listTitle: 'text-lg font-semibold text-slate-900 dark:text-slate-50',
  badge: 'text-xs font-semibold uppercase tracking-wide',
  revenue: 'text-3xl font-bold text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-300',
  warningBody: 'text-amber-700 dark:text-amber-300',
} as const;

export const layout = {
  screenTop: 'pt-4',
  screenTopLg: 'pt-10',
  screenTopMd: 'pt-8',
  section: 'mt-4',
  sectionLg: 'mt-5',
  sectionXl: 'mt-2',
  stackSm: 'mt-1',
  stack: 'mt-2',
  stackMd: 'mt-3',
  stackLg: 'mt-4',
  gapSm: 'gap-1',
  gap: 'gap-2',
  gapMd: 'gap-3',
  gapLg: 'gap-4',
  vstack: 'flex-col',
  vstackSm: 'flex-col gap-2',
  vstackMd: 'flex-col gap-3',
  vstackLg: 'flex-col gap-4',
  row: 'flex-row gap-2',
  rowBetween: 'flex-row items-start justify-between',
  flex1: 'flex-1',
  center: 'items-center justify-center',
  cardSpacing: 'mb-2',
  buttonSpacing: 'mt-2',
} as const;

/** Layout-only surface classes — apply colors via useTheme() + theme/styles.ts on native. */
export const surfaces = {
  screen: 'bg-slate-50 dark:bg-slate-950',
  card: 'mb-3 w-full rounded-2xl border p-4 shadow-sm',
  cardInner: 'w-full flex-col gap-3',
  cardHighlight: 'border-emerald-600/60 dark:border-emerald-400/60',
  modalOverlay: 'flex-1 items-center justify-center px-4',
  modalPanel: 'w-full max-w-sm rounded-2xl p-4',
  loadingScreen: 'flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950',
  chip: 'rounded-xl px-3 py-2',
  chipActiveText: 'font-semibold text-white',
  chipInactiveText: 'font-semibold text-slate-900 dark:text-slate-100',
  input: 'rounded-xl border px-4 py-3.5 text-base',
  inputCompact: 'rounded-xl border px-3 py-3 text-base',
} as const;

export const buttons = {
  base: 'rounded-xl px-4 py-3.5 items-center justify-center',
  disabled: 'opacity-50',
} as const;

export const badges = {
  expired: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
  expiring: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100',
  cancelled: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  container: 'self-start rounded-full px-3 py-1',
} as const;
