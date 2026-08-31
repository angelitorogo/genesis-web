import type { PlanetarySystem } from './planetary-system';
import type { RelevantCapturedExtrasolarObject } from './relevant-captured-extrasolar-object';

export class CapturedExtrasolarObjectSystem {
  readonly relevantObjects: readonly RelevantCapturedExtrasolarObject[];

  constructor(
    readonly hostPlanetarySystem: PlanetarySystem,
    readonly captureSupportIndex01: number,
    readonly permanentCaptureProbability01: number,
    objects: readonly RelevantCapturedExtrasolarObject[],
  ) {
    for (const [name, value] of [
      ['captureSupportIndex01', captureSupportIndex01],
      ['permanentCaptureProbability01', permanentCaptureProbability01],
    ] as const) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        throw new RangeError(`${name} must be inside [0,1].`);
      }
    }

    if (permanentCaptureProbability01 > 0.005) {
      throw new RangeError('Point-22.9 V1 permanent extrasolar capture must remain extremely rare.');
    }

    if (objects.length > 1) {
      throw new RangeError('Point-22.9 V1 materializes at most one relevant captured extrasolar object per system snapshot.');
    }

    objects.forEach((object, index) => {
      if (
        object.captureOrdinal !== index + 1 ||
        object.identity.captureSystemLocator !== hostPlanetarySystem.locator ||
        object.identity.captureSystemSeed !== hostPlanetarySystem.seed ||
        !object.isBound ||
        !object.isExtrasolarOrigin
      ) {
        throw new RangeError('Captured extrasolar objects must preserve capture context, contiguous ordinals, extrasolar origin and bound status.');
      }
    });

    this.relevantObjects = Object.freeze([...objects]);
  }

  get relevantObjectCount(): number { return this.relevantObjects.length; }
  get hasRelevantObject(): boolean { return this.relevantObjectCount === 1; }
  get relevantObject(): RelevantCapturedExtrasolarObject | null { return this.relevantObjects[0] ?? null; }
}
