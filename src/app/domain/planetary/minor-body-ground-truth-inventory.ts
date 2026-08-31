import {
  MinorBodyKind,
  type MinorBodyKindValue,
} from './minor-body-kind';

import {
  type RelevantAsteroid,
} from './relevant-asteroid';

import {
  type RelevantCapturedExtrasolarObject,
} from './relevant-captured-extrasolar-object';

import {
  type RelevantComet,
} from './relevant-comet';

import {
  type RelevantInterstellarObject,
} from './relevant-interstellar-object';

import {
  type RelevantTransNeptunianObject,
} from './relevant-trans-neptunian-object';

export type MinorBodyGroundTruthObject =
  | RelevantAsteroid
  | RelevantComet
  | RelevantTransNeptunianObject
  | RelevantInterstellarObject
  | RelevantCapturedExtrasolarObject;

export interface MinorBodyGroundTruthEntry {
  readonly kind:
    MinorBodyKindValue;

  readonly body:
    MinorBodyGroundTruthObject;
}

/**
 * Point-22.10 immutable view over the five individually materialized phase-22
 * Ground Truth populations.
 *
 * Statistical belt populations are intentionally absent: this inventory only
 * contains individually addressable objects whose proceduralId can become a
 * discovery/catalogue target.
 */
export class MinorBodyGroundTruthInventory {

  readonly asteroids:
    readonly RelevantAsteroid[];

  readonly comets:
    readonly RelevantComet[];

  readonly transNeptunianObjects:
    readonly RelevantTransNeptunianObject[];

  readonly interstellarObjects:
    readonly RelevantInterstellarObject[];

  readonly capturedExtrasolarObjects:
    readonly RelevantCapturedExtrasolarObject[];

  readonly entries:
    readonly MinorBodyGroundTruthEntry[];

  constructor(
    asteroids:
      readonly RelevantAsteroid[],

    comets:
      readonly RelevantComet[],

    transNeptunianObjects:
      readonly RelevantTransNeptunianObject[],

    interstellarObjects:
      readonly RelevantInterstellarObject[],

    capturedExtrasolarObjects:
      readonly RelevantCapturedExtrasolarObject[],
  ) {
    this.asteroids = Object.freeze([
      ...asteroids,
    ]);

    this.comets = Object.freeze([
      ...comets,
    ]);

    this.transNeptunianObjects = Object.freeze([
      ...transNeptunianObjects,
    ]);

    this.interstellarObjects = Object.freeze([
      ...interstellarObjects,
    ]);

    this.capturedExtrasolarObjects = Object.freeze([
      ...capturedExtrasolarObjects,
    ]);

    this.entries = Object.freeze([
      ...this.asteroids.map(
        body => entry(
          MinorBodyKind.ASTEROID,
          body,
        ),
      ),
      ...this.comets.map(
        body => entry(
          MinorBodyKind.COMET,
          body,
        ),
      ),
      ...this.transNeptunianObjects.map(
        body => entry(
          MinorBodyKind.TRANS_NEPTUNIAN_OBJECT,
          body,
        ),
      ),
      ...this.interstellarObjects.map(
        body => entry(
          MinorBodyKind.INTERSTELLAR_OBJECT,
          body,
        ),
      ),
      ...this.capturedExtrasolarObjects.map(
        body => entry(
          MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT,
          body,
        ),
      ),
    ]);

    validateEntries(
      this.entries,
    );
  }

  get existingObjectCount():
    number {
    return this.entries.length;
  }
}

function entry(
  kind:
    MinorBodyKindValue,

  body:
    MinorBodyGroundTruthObject,
): MinorBodyGroundTruthEntry {
  return Object.freeze({
    kind,
    body,
  });
}

function validateEntries(
  entries:
    readonly MinorBodyGroundTruthEntry[],
): void {
  const keys =
    new Set<string>();

  for (
    const current
    of entries
  ) {
    if (
      !current.body
        .isDiscoverable
    ) {
      throw new RangeError(
        'MinorBodyGroundTruthInventory only accepts individually discoverable phase-22 bodies.',
      );
    }

    const key =
      `${current.kind.code}:${current.body.proceduralId}`;

    if (
      keys.has(
        key,
      )
    ) {
      throw new RangeError(
        `Duplicate minor-body Ground Truth identity: ${key}.`,
      );
    }

    keys.add(
      key,
    );
  }
}
