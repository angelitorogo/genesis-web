import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import type { MoonFormationInventory32F1d, MoonFormationPathway32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonSeed } from '../../domain/seed/hierarchical-seeds';
import { PlanetType } from '../../domain/planetary/planet-type';

const EARTH_MASS_KG = 5.9722e24;
// Reference endmember densities, not claimed mineralogy of the actual moon.
const RHO_WATER_ICE = 0.93;
const RHO_SILICATES = 3.30;
const RHO_METALS = 7.80;

const isGiant = (type: PlanetType): boolean =>
  type === PlanetType.GAS_GIANT || type === PlanetType.ICE_GIANT;

const finitePositive = (n: number, name: string): void => {
  if (!Number.isFinite(n) || n <= 0) throw new RangeError(`32.F.1d ${name} must be positive and finite.`);
};

/**
 * Fits an explicitly assumed, additive-volume ice/silicate/metal mixture to
 * the already-frozen bulk density. Porosity and H2O/other-ice chemistry are
 * free parameters, so these kilograms are conditional model states only.
 * No present-day atmosphere or ancient impact/capture event is inferred.
 * Sampling is domain-separated from all older V1/V2 random branches.
 */
export class MoonFormationInventoryEngine32F1d {
  private constructor() {}

  static fromMaterialized(
    source: MoonPhysicalProperties,
    seed: MoonSeed,
    hostType: PlanetType,
  ): MoonFormationInventory32F1d {
    finitePositive(source.massEarth, 'mass');
    finitePositive(source.radiusEarth, 'radius');
    finitePositive(source.meanDensityGramsPerCubicCentimeter, 'density');
    if (seed.kind !== 'moon') throw new RangeError('32.F.1d requires canonical MoonSeed.');
    if (!Object.values(PlanetType).includes(hostType)) throw new RangeError('32.F.1d unknown host planet type.');
    const density = source.meanDensityGramsPerCubicCentimeter;
    if (density < RHO_WATER_ICE || density > RHO_METALS) {
      throw new RangeError('32.F.1d bulk density lies outside the stated endmember domain; composition is unresolved.');
    }
    const digest = sha256(utf8ToBytes(`GENESIS-32-F-1D-FORMATION-V1|${seed.normalizedValue}`));
    const sample = (index: number): number =>
      (((digest[index] * 0x1000000) + (digest[index + 1] << 16) + (digest[index + 2] << 8) + digest[index + 3]) >>> 0) / 0x100000000;

    // Broad model prior only: loosely consolidated small moons may have more
    // porosity than massive ones. The selected porosity is NOT observed.
    const porosityMax = Math.min(0.22, 0.22 / (1 + Math.sqrt(source.massEarth / 0.0001)));
    const porosity = porosityMax * (0.20 + 0.65 * sample(0));
    const solidDensity = density / (1 - porosity);
    if (solidDensity > RHO_METALS) {
      throw new RangeError('32.F.1d sampled porosity incompatible with bulk density and metal endmember.');
    }

    let metalFraction: number;
    let silicateFraction: number;
    let condensedFraction: number;
    if (solidDensity >= RHO_SILICATES) {
      // Dense endmember: no condensed ices are *required* by density.
      metalFraction = (1 / solidDensity - 1 / RHO_SILICATES) /
        (1 / RHO_METALS - 1 / RHO_SILICATES);
      condensedFraction = 0;
      silicateFraction = 1 - metalFraction;
    } else {
      // Small metallic seed fraction is an explicit compositional hypothesis.
      metalFraction = 0.015 + 0.055 * sample(4);
      condensedFraction = (
        1 / solidDensity - metalFraction / RHO_METALS - (1 - metalFraction) / RHO_SILICATES
      ) / (1 / RHO_WATER_ICE - 1 / RHO_SILICATES);
      silicateFraction = 1 - metalFraction - condensedFraction;
      if (condensedFraction < 0 || silicateFraction < -1e-12) {
        throw new RangeError('32.F.1d no admissible density-conserving composition for chosen endmembers.');
      }
    }
    const mass = source.massEarth * EARTH_MASS_KG;
    const metal = mass * metalFraction;
    // A dense (ice-free) endmember has EXACTLY zero condensables. Deriving
    // them as `mass - metal - silicates` subtracts huge floating-point values
    // and can produce a small NEGATIVE mass (e.g. -8388608 kg at ~1e22 kg).
    // Construct the non-negative component from its fraction instead, then
    // close the silicate budget by subtraction. This preserves mass without
    // creating fictitious ice or permitting negative condensable inventories.
    const condensables = mass * condensedFraction;
    const silicates = mass - metal - condensables;
    // H2O versus unidentified other condensables is a conditional allocation;
    // it does not assert NH3, CH4, CO2, liquid, gas or actual surface ice.
    const waterFractionOfCondensables = 0.70 + 0.25 * sample(8);
    const waterIce = condensables * waterFractionOfCondensables;
    const other = condensables - waterIce;
    const predictedSpecificVolume = metalFraction / RHO_METALS +
      silicateFraction / RHO_SILICATES + condensedFraction / RHO_WATER_ICE;
    const reconstructedDensity = (1 - porosity) / predictedSpecificVolume;
    if (!Number.isFinite(reconstructedDensity) || Math.abs(reconstructedDensity - density) / density > 1e-10 ||
        Math.abs((metal + silicates + waterIce + other) - mass) / mass > 1e-12) {
      throw new RangeError('32.F.1d must conserve lunar mass and reproduce the assumed bulk density.');
    }
    const candidates: readonly MoonFormationPathway32F1d[] = isGiant(hostType)
      ? Object.freeze(['CIRCUMPLANETARY_ACCRETION_CANDIDATE', 'DYNAMICAL_CAPTURE_CANDIDATE'] as const)
      : Object.freeze(['CO_ACCRETION_CANDIDATE', 'IMPACT_DEBRIS_CANDIDATE', 'DYNAMICAL_CAPTURE_CANDIDATE'] as const);
    return Object.freeze({
      contractVersion: '32.F.1d-density-endmember-scenario-v1',
      provenance: 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION',
      hostPlanetOrdinal: source.hostPlanetOrdinal,
      moonOrdinal: source.moonOrdinal,
      formationCandidates: candidates,
      // Giant-host relevant moons are *regular*, not known captured objects;
      // even this origin is only a candidate, never a discovered event.
      selectedFormationPathway: isGiant(hostType) ? 'CIRCUMPLANETARY_ACCRETION_CANDIDATE' : 'UNRESOLVED',
      totalMassKilograms: mass,
      metallicMassKilograms: metal,
      silicateMassKilograms: silicates,
      waterIceMassKilograms: waterIce,
      otherCondensableMassKilograms: other,
      rockMassKilograms: metal + silicates,
      totalCondensableMassKilograms: condensables,
      maximumPotentialVolatileSupplyKilograms: condensables,
      waterIceSpeciation: 'H2O_ENDMEMBER_ASSUMPTION_NOT_IDENTIFIED',
      otherVolatileSpeciation: 'UNRESOLVED',
      modelPorosityFraction01: porosity,
      allowedPorosityRange01: Object.freeze([0, porosityMax] as const),
      modelBulkDensityGramsPerCubicCentimeter: reconstructedDensity,
      sourceBulkDensityGramsPerCubicCentimeter: density,
      densityAssumptions: 'VOLUME_ADDITIVE_ICE_SILICATE_METAL_ENDMEMBERS',
      initialAtmosphericGasMassKilograms: null,
      atmosphericLossAndReplenishmentRates: null,
      historyResolution: 'INITIAL_SCENARIO_ONLY_NO_DATED_EVOLUTION',
      uncertainty: 'NON_IDENTIFIABLE_COMPOSITION_AND_FORMATION_PATHWAY',
    } satisfies MoonFormationInventory32F1d);
  }
}
