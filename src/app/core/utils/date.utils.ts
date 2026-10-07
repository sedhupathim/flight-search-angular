const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Formats a Date as a local `yyyy-MM-dd` string (no timezone shift, unlike `toISOString`). */
export function toIsoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Parses a `yyyy-MM-dd` string into a local Date, or `null` when it is not a real calendar date. */
export function parseIsoDate(value: string | null | undefined): Date | null {
  const match = value ? ISO_DATE.exec(value) : null;
  if (!match) {
    return null;
  }
  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** Combines a calendar date with an `HH:mm` time, optionally shifted by whole days. */
export function combineDateAndTime(date: Date, time: string, dayOffset = 0): Date {
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + dayOffset, hours, minutes);
}
