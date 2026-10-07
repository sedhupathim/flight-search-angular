import { DurationPipe } from './duration.pipe';
import { StopsPipe } from './stops.pipe';

describe('DurationPipe', () => {
  const pipe = new DurationPipe();

  it('formats minutes', () => {
    expect(pipe.transform(45)).toBe('45m');
    expect(pipe.transform(60)).toBe('1h 00m');
    expect(pipe.transform(125)).toBe('2h 05m');
    expect(pipe.transform(null)).toBe('');
  });
});

describe('StopsPipe', () => {
  const pipe = new StopsPipe();

  it('formats stop counts', () => {
    expect(pipe.transform(0)).toBe('Non-stop');
    expect(pipe.transform(1)).toBe('1 stop');
    expect(pipe.transform(2)).toBe('2 stops');
  });
});
