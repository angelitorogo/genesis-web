export const TidalDisruptionVictimKind = Object.freeze({
  MAIN_SEQUENCE_STAR: 'MAIN_SEQUENCE_STAR',
  RED_GIANT: 'RED_GIANT',
  WHITE_DWARF: 'WHITE_DWARF',
} as const);

export type TidalDisruptionVictimKind =
  typeof TidalDisruptionVictimKind[keyof typeof TidalDisruptionVictimKind];

/**
 * Explicit source-frame star–massive-BH encounter required by 29.6.
 *
 * GENESIS deliberately does not synthesize one of these encounters merely
 * because an IMBH/SMBH exists. A TDE needs an actual stellar victim and an
 * encounter pericentre. beta = r_t / r_p supplies that geometry in the
 * read-only laboratory until a canonical encounter generator exists.
 */
export class TidalDisruptionEncounterProfile {
  constructor(
    readonly victimKind: TidalDisruptionVictimKind,
    readonly blackHoleMassSolar: number,
    readonly stellarMassSolar: number,
    readonly stellarRadiusSolar: number,
    readonly penetrationFactorBeta: number,
  ) {
    assertRange(blackHoleMassSolar, 100, 1e10, 'blackHoleMassSolar');
    assertRange(penetrationFactorBeta, 0.05, 10, 'penetrationFactorBeta');

    switch (victimKind) {
      case TidalDisruptionVictimKind.WHITE_DWARF:
        assertRange(stellarMassSolar, 0.15, 1.44, 'stellarMassSolar');
        assertRange(stellarRadiusSolar, 0.005, 0.03, 'stellarRadiusSolar');
        break;
      case TidalDisruptionVictimKind.RED_GIANT:
        assertRange(stellarMassSolar, 0.5, 30, 'stellarMassSolar');
        assertRange(stellarRadiusSolar, 2, 2_000, 'stellarRadiusSolar');
        break;
      case TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR:
        assertRange(stellarMassSolar, 0.08, 150, 'stellarMassSolar');
        assertRange(stellarRadiusSolar, 0.08, 25, 'stellarRadiusSolar');
        break;
      default:
        throw new RangeError('Unsupported 29.6 tidal-disruption victim kind.');
    }
  }
}

function assertRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be finite and in [${min}, ${max}].`);
  }
}
