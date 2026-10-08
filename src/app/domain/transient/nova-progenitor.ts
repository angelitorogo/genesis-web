export const NovaWhiteDwarfComposition = Object.freeze({
  CARBON_OXYGEN: 'CARBON_OXYGEN',
  OXYGEN_NEON: 'OXYGEN_NEON',
} as const);

export type NovaWhiteDwarfComposition =
  typeof NovaWhiteDwarfComposition[keyof typeof NovaWhiteDwarfComposition];

/**
 * 29.2 — compact physical envelope for a thermonuclear nova progenitor.
 *
 * GENESIS does not yet solve Roche-lobe hydrodynamics. The accretion rate is
 * therefore a deterministic effective rate inferred from the already-generated
 * binary architecture; it is never fed back into the frozen stellar engine.
 */
export class NovaProgenitorProfile {
  constructor(
    readonly whiteDwarfMassSolar: number,
    readonly donorMassSolar: number,
    readonly metallicitySolarRatio: number,
    readonly orbitalPeriastronAu: number,
    readonly effectiveAccretionRateSolarPerYear: number,
    readonly ignitionEnvelopeMassSolar: number,
    readonly whiteDwarfComposition: NovaWhiteDwarfComposition,
  ) {
    assertFiniteRange(whiteDwarfMassSolar, 0.45, 1.38, 'whiteDwarfMassSolar');
    assertFiniteRange(donorMassSolar, 0.05, 150, 'donorMassSolar');
    assertFiniteRange(metallicitySolarRatio, 0, 5, 'metallicitySolarRatio');
    assertFiniteRange(orbitalPeriastronAu, 1e-5, 2.5, 'orbitalPeriastronAu');
    assertFiniteRange(
      effectiveAccretionRateSolarPerYear,
      1e-12,
      5e-7,
      'effectiveAccretionRateSolarPerYear',
    );
    assertFiniteRange(
      ignitionEnvelopeMassSolar,
      1e-8,
      2e-3,
      'ignitionEnvelopeMassSolar',
    );

    if (!Object.values(NovaWhiteDwarfComposition).includes(whiteDwarfComposition)) {
      throw new RangeError('Unknown nova white-dwarf composition.');
    }
  }

  get recurrenceIntervalYears(): number {
    return this.ignitionEnvelopeMassSolar / this.effectiveAccretionRateSolarPerYear;
  }
}

function assertFiniteRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
