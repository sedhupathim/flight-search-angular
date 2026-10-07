import { Pipe, PipeTransform } from '@angular/core';

/** Formats a stop count, e.g. `0` → `Non-stop`, `2` → `2 stops`. */
@Pipe({ name: 'stops', standalone: true })
export class StopsPipe implements PipeTransform {
  transform(stops: number | null | undefined): string {
    if (stops == null) {
      return '';
    }
    return stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`;
  }
}
