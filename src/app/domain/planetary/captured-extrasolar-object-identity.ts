import type { SystemLocator } from '../generation/procedural-locator';
import type { SystemSeed } from '../seed/hierarchical-seeds';

const ID_PATTERN = /^[0-9A-F]{32}$/;

export class CapturedExtrasolarObjectIdentity {
  constructor(
    readonly captureSystemLocator: SystemLocator,
    readonly captureSystemSeed: SystemSeed,
    readonly captureOrdinal: number,
    readonly proceduralId: string,
  ) {
    if (!Number.isInteger(captureOrdinal) || captureOrdinal <= 0) {
      throw new RangeError('captureOrdinal must be a positive integer.');
    }

    if (!ID_PATTERN.test(proceduralId)) {
      throw new RangeError('Captured-extrasolar proceduralId must be 128-bit uppercase hexadecimal.');
    }
  }

  get localDesignation(): string {
    return `XCAP-${this.captureOrdinal.toString().padStart(3, '0')}`;
  }
}
