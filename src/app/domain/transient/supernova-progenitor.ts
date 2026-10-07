export const SupernovaProgenitorChannel = Object.freeze({
  THERMONUCLEAR_WHITE_DWARF: 'THERMONUCLEAR_WHITE_DWARF',
  CORE_COLLAPSE: 'CORE_COLLAPSE',
} as const);

export type SupernovaProgenitorChannel =
  typeof SupernovaProgenitorChannel[
    keyof typeof SupernovaProgenitorChannel
  ];

export const SupernovaProgenitorCompactRemnantHint = Object.freeze({
  NEUTRON_STAR: 'NEUTRON_STAR',
  STELLAR_BLACK_HOLE: 'STELLAR_BLACK_HOLE',
} as const);

export type SupernovaProgenitorCompactRemnantHint =
  typeof SupernovaProgenitorCompactRemnantHint[
    keyof typeof SupernovaProgenitorCompactRemnantHint
  ];

/**
 * Point-29.1 canonical physical input for one supernova event.
 *
 * This is deliberately a compact progenitor envelope rather than a second
 * stellar-evolution engine. Point 29.1B translates existing generated stellar
 * Ground Truth into this input without changing the frozen stellar engines.
 */
export class SupernovaProgenitorProfile {
  constructor(
    readonly channel: SupernovaProgenitorChannel,
    readonly initialMassSolar: number,
    readonly preExplosionMassSolar: number,
    readonly metallicitySolarRatio: number,
    readonly hydrogenEnvelopeFraction: number,
    readonly heliumEnvelopeFraction: number,
    readonly whiteDwarfMassSolar: number | null,
    readonly compactRemnantHint:
      SupernovaProgenitorCompactRemnantHint | null = null,
  ) {
    assertFiniteRange(initialMassSolar, 0.5, 150, 'initialMassSolar');
    assertFiniteRange(preExplosionMassSolar, 0.5, 150, 'preExplosionMassSolar');
    assertFiniteRange(metallicitySolarRatio, 0, 5, 'metallicitySolarRatio');
    assertFiniteRange(hydrogenEnvelopeFraction, 0, 1, 'hydrogenEnvelopeFraction');
    assertFiniteRange(heliumEnvelopeFraction, 0, 1, 'heliumEnvelopeFraction');

    if (
      hydrogenEnvelopeFraction + heliumEnvelopeFraction >
      1.0000001
    ) {
      throw new RangeError(
        'hydrogenEnvelopeFraction + heliumEnvelopeFraction cannot exceed 1.',
      );
    }

    if (
      channel === SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF
    ) {
      if (
        whiteDwarfMassSolar === null ||
        !Number.isFinite(whiteDwarfMassSolar) ||
        whiteDwarfMassSolar < 0.85 ||
        whiteDwarfMassSolar > 1.44
      ) {
        throw new RangeError(
          'THERMONUCLEAR_WHITE_DWARF requires whiteDwarfMassSolar in [0.85, 1.44].',
        );
      }

      if (preExplosionMassSolar > 1.50) {
        throw new RangeError(
          'THERMONUCLEAR_WHITE_DWARF cannot use a preExplosionMassSolar above 1.50.',
        );
      }

      if (compactRemnantHint !== null) {
        throw new RangeError(
          'THERMONUCLEAR_WHITE_DWARF cannot carry a compact-remnant hint.',
        );
      }

      return;
    }

    if (whiteDwarfMassSolar !== null) {
      throw new RangeError(
        'CORE_COLLAPSE progenitors cannot carry whiteDwarfMassSolar.',
      );
    }

    if (initialMassSolar < 8) {
      throw new RangeError(
        'CORE_COLLAPSE requires an initialMassSolar of at least 8.',
      );
    }
  }
}

function assertFiniteRange(
  value: number,
  min: number,
  max: number,
  name: string,
): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
