import { StellarRelativeOrbit } from './stellar-relative-orbit';

export type CompactBinaryRemnantKind = 'WHITE_DWARF' | 'NEUTRON_STAR' | 'STELLAR_BLACK_HOLE';
export type CompactBinaryPairKind = 'WD_WD' | 'WD_NS' | 'WD_BH' | 'NS_NS' | 'NS_BH' | 'BH_BH';

/** One EXISTING A/B stellar component, not a new galactic object or a public body ID. */
export interface CompactBinaryMember {
  readonly label: 'A' | 'B';
  readonly componentSeedHex: string;
  readonly remnantKind: CompactBinaryRemnantKind;
  /** Current compact-remnant mass estimate; NEVER phase-15 progenitor mass. */
  readonly massSolar: number;
  readonly referenceRadiusKm: number;
  readonly formationAgeBillionYears: number;
  readonly currentAgeBillionYears: number;
}

/**
 * 27.8: read-only physical classification of the EXISTING A-B orbit.
 * 16.4 period is based on progenitor masses: recompute its Kepler reference
 * using remnant masses, but do NOT replace or mutate the original orbit.
 * No transfer, merger event, gravitational-wave detection or observed state.
 */
export class CompactBinarySystem {
  static readonly AU_METRES = 149_597_870_700;
  static readonly SOLAR_MASS_KG = 1.98847e30;
  static readonly G = 6.67430e-11;
  static readonly C = 299_792_458;
  static readonly SECONDS_PER_YEAR = 31_557_600;

  readonly kind: CompactBinaryPairKind;
  readonly totalRemnantMassSolar: number;
  readonly chirpMassSolar: number;
  readonly remnantKeplerPeriodDays: number;
  readonly periastronAu: number;
  readonly referenceCircularInspiralYears: number;
  /** Not asserted when the independent V2 component ages differ. */
  readonly componentAgesAgree: boolean;

  constructor(
    readonly parentSystemSeedHex: string,
    readonly primary: CompactBinaryMember,
    readonly secondary: CompactBinaryMember,
    readonly originalInnerOrbit: StellarRelativeOrbit,
  ) {
    if (!/^[0-9A-F]{32}$/.test(parentSystemSeedHex)) {
      throw new RangeError('27.8 requires the existing normalized parent-system seed.');
    }
    if (!(originalInnerOrbit instanceof StellarRelativeOrbit)) {
      throw new TypeError('27.8 requires the actual phase-16 A-B relative orbit.');
    }
    if (primary.label !== 'A' || secondary.label !== 'B' ||
        primary.componentSeedHex === secondary.componentSeedHex) {
      throw new RangeError('27.8 requires distinct A/B component identities, in canonical order.');
    }
    for (const member of [primary, secondary]) {
      if (!/^[0-9A-F]{32}$/.test(member.componentSeedHex) ||
          !['WHITE_DWARF', 'NEUTRON_STAR', 'STELLAR_BLACK_HOLE'].includes(member.remnantKind) ||
          !Number.isFinite(member.massSolar) || member.massSolar <= 0 ||
          !Number.isFinite(member.referenceRadiusKm) || member.referenceRadiusKm <= 0 ||
          !Number.isFinite(member.formationAgeBillionYears) || member.formationAgeBillionYears <= 0 ||
          !Number.isFinite(member.currentAgeBillionYears) ||
          member.currentAgeBillionYears < member.formationAgeBillionYears - 1e-9) {
        throw new RangeError('27.8 requires physically formed compact remnants with valid mass/radius/ages.');
      }
      if (member.remnantKind === 'WHITE_DWARF' && (member.massSolar >= 1.44 || member.referenceRadiusKm < 1000) ||
          member.remnantKind === 'NEUTRON_STAR' && (member.massSolar < 1.1 || member.massSolar > 2.2 ||
            member.referenceRadiusKm < 9 || member.referenceRadiusKm > 15.5) ||
          member.remnantKind === 'STELLAR_BLACK_HOLE' && member.massSolar < 3.05) {
        throw new RangeError('Compact member does not satisfy its remnant-family physical bounds.');
      }
    }
    const pair = [primary.remnantKind, secondary.remnantKind].sort().join(':');
    const names: Readonly<Record<string, CompactBinaryPairKind>> = {
      'STELLAR_BLACK_HOLE:STELLAR_BLACK_HOLE': 'BH_BH',
      'NEUTRON_STAR:NEUTRON_STAR': 'NS_NS',
      'NEUTRON_STAR:STELLAR_BLACK_HOLE': 'NS_BH',
      'WHITE_DWARF:WHITE_DWARF': 'WD_WD',
      'NEUTRON_STAR:WHITE_DWARF': 'WD_NS',
      'STELLAR_BLACK_HOLE:WHITE_DWARF': 'WD_BH',
    };
    const kind = names[pair];
    if (!kind) throw new RangeError('Unsupported compact pair.');
    this.kind = kind;
    this.totalRemnantMassSolar = primary.massSolar + secondary.massSolar;
    this.chirpMassSolar = (primary.massSolar * secondary.massSolar) ** (3 / 5) /
      this.totalRemnantMassSolar ** (1 / 5);
    this.periastronAu = originalInnerOrbit.periastronAu;
    const minimumSeparationAu = (primary.referenceRadiusKm + secondary.referenceRadiusKm) * 1000 /
      CompactBinarySystem.AU_METRES;
    if (this.periastronAu <= minimumSeparationAu) {
      throw new RangeError('An existing compact pair cannot be detached if its physical radii already overlap.');
    }
    this.remnantKeplerPeriodDays = Math.sqrt(
      4 * Math.PI ** 2 * (originalInnerOrbit.semiMajorAxisAu * CompactBinarySystem.AU_METRES) ** 3 /
      (CompactBinarySystem.G * this.totalRemnantMassSolar * CompactBinarySystem.SOLAR_MASS_KG),
    ) / 86_400;
    // Peters quadrupole CIRCULAR-ORBIT reference only. For e>0 this is NOT a
    // predicted merger date; eccentricity and future mass transfer are excluded.
    const a = originalInnerOrbit.semiMajorAxisAu * CompactBinarySystem.AU_METRES;
    const m1 = primary.massSolar * CompactBinarySystem.SOLAR_MASS_KG;
    const m2 = secondary.massSolar * CompactBinarySystem.SOLAR_MASS_KG;
    this.referenceCircularInspiralYears = 5 * CompactBinarySystem.C ** 5 * a ** 4 /
      (256 * CompactBinarySystem.G ** 3 * m1 * m2 * (m1 + m2)) /
      CompactBinarySystem.SECONDS_PER_YEAR;
    this.componentAgesAgree = Math.abs(primary.currentAgeBillionYears - secondary.currentAgeBillionYears) < 1e-6;
    if (![this.chirpMassSolar, this.remnantKeplerPeriodDays,
      this.referenceCircularInspiralYears].every(value => Number.isFinite(value) && value > 0)) {
      throw new RangeError('Compact binary reference quantities must be finite and positive.');
    }
    this.primary = Object.freeze({ ...primary });
    this.secondary = Object.freeze({ ...secondary });
    Object.freeze(this);
  }
}
