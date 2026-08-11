import { describe, expect, it } from 'vitest';
import { nextBackoffDelay } from './backoff';

describe('nextBackoffDelay', () => {
  it('waits 5s after the first failure', () => {
    expect(nextBackoffDelay(1)).toBe(5_000);
  });

  it('waits 30s after the second consecutive failure', () => {
    expect(nextBackoffDelay(2)).toBe(30_000);
  });

  it('waits 2min after the third consecutive failure', () => {
    expect(nextBackoffDelay(3)).toBe(120_000);
  });

  it('caps at 2min for any further consecutive failures', () => {
    expect(nextBackoffDelay(4)).toBe(120_000);
    expect(nextBackoffDelay(50)).toBe(120_000);
  });

  it('treats zero (no prior failures) as the first step', () => {
    expect(nextBackoffDelay(0)).toBe(5_000);
  });
});
