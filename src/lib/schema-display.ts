/** Shared display helpers for schema metadata.
 *
 * These constants used to live inline in each consumer (SchemaStep,
 * SchemaHeader, etc.). Centralize them so the palette and labels stay
 * in sync and survive a dark-mode overhaul as one edit.
 */

export const SCHEMA_TYPE_LABELS: Record<string, string> = {
  full_pinyin: '全拼',
  double_pinyin: '双拼',
  shape: '形码',
  mixed: '混合',
}

/** Tailwind utility classes for each difficulty badge. Includes dark-mode variants. */
export const SCHEMA_DIFFICULTY_BADGE_CLASSES: Record<string, string> = {
  '简单': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  '中等': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  '困难': 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
}
