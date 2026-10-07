import { Pipe, PipeTransform } from '@angular/core';

/** Formats minutes as a compact duration, e.g. `125` → `2h 05m`. */
@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(totalMinutes: number | null | undefined): string {
    if (totalMinutes == null || totalMinutes < 0) {
      return '';
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return hours ? `${hours}h ${minutes}m` : `${totalMinutes}m`;
  }
}
