import type { CapturedExtrasolarObjectIdentity } from './captured-extrasolar-object-identity';
import type { CapturedExtrasolarObjectOrbit } from './captured-extrasolar-object-orbit';
import type { CapturedExtrasolarObjectProperties } from './captured-extrasolar-object-properties';

export class RelevantCapturedExtrasolarObject {
  constructor(
    readonly identity: CapturedExtrasolarObjectIdentity,
    readonly properties: CapturedExtrasolarObjectProperties,
    readonly orbit: CapturedExtrasolarObjectOrbit,
  ) {
    if (identity.captureOrdinal !== properties.captureOrdinal) {
      throw new RangeError('Captured-extrasolar identity and properties must share the same ordinal.');
    }
  }

  get captureOrdinal(): number { return this.identity.captureOrdinal; }
  get proceduralId(): string { return this.identity.proceduralId; }
  get localDesignation(): string { return this.identity.localDesignation; }
  get compositionRegime() { return this.properties.compositionRegime; }
  get captureRegime() { return this.properties.captureRegime; }
  get diameterKilometers(): number { return this.properties.diameterKilometers; }
  get isBound(): boolean { return this.orbit.isBound; }
  get isExtrasolarOrigin(): boolean { return true; }
  get isDiscoverable(): boolean { return true; }
}
