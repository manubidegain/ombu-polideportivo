/**
 * Formats a date string (YYYY-MM-DD) to a localized date display
 * without timezone conversion issues.
 *
 * Example: "2025-01-31" -> "31/1/2025" (always shows day 31, not 30)
 */
export function formatLocalDate(dateStr: string, locale: string = 'es-UY'): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString(locale);
}

/**
 * Formats a date string (YYYY-MM-DD) with custom options
 * without timezone conversion issues.
 */
export function formatLocalDateLong(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  locale: string = 'es-UY'
): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month is 0-indexed
  return date.toLocaleDateString(locale, options);
}

/**
 * Parses a date string (YYYY-MM-DD) to a Date object in local timezone
 * without UTC conversion issues.
 *
 * Use this instead of `new Date("2025-01-31")` to avoid timezone problems.
 * Can be used with date-fns format() function.
 *
 * Example: parseLocalDate("2025-01-31") -> Date object for Jan 31, 2025 at 00:00 local time
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}
