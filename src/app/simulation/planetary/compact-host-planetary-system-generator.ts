import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  type CompactHostPlanet,
  type CompactHostPlanetarySystem,
} from '../../domain/planetary/compact-host-planetary-system';
import { type SystemSeed } from '../../domain/seed/hierarchical-seeds';
import {
  CompactPlanetaryHost,
  type CompactPlanetaryHostType,
  type CompactHostScientificState,
} from '../../domain/stellar/compact-planetary-host';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ProceduralTargetResolver } from '../regeneration/procedural-target-resolver';
import { CompactHostEnvironmentEngine } from './compact-host-environment-engine';
import { CompactHostPlanetCharacterizationEngine } from './compact-host-planet-characterization-engine';
import { CompactHostSecondaryPopulationGenerator } from './compact-host-secondary-population-generator';
import { StellarSystemMultiplicitySelector } from '../stellar/stellar-system-multiplicity-selector';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';

const DOMAIN = 'GENESIS-V2-COMPACT-HOST-31.2-SNAPSHOT-1';
/** Design parameter, NOT an observational occurrence measurement. */
export const COMPACT_HOST_FRACTION_OF_V2_SINGLE = 0.008;
const AU_M = 149_597_870_700;
const SOLAR_KG = 1.98847e30;
const EARTH_KG = 5.9722e24;
const EARTH_RADIUS_M = 6_371_000;
const GRAVITATIONAL_CONSTANT = 6.67430e-11;
const LIGHT_SPEED = 299_792_458;
const SECONDS_PER_DAY = 86_400;

const TYPE_WEIGHTS: readonly [CompactPlanetaryHostType, number][] = Object.freeze([
  [ExtremeType.NEUTRON_STAR, 0.27],
  [ExtremeType.PULSAR, 0.26],
  [ExtremeType.MILLISECOND_PULSAR, 0.19],
  [ExtremeType.MAGNETAR, 0.06],
  [ExtremeType.STELLAR_MASS_BLACK_HOLE, 0.22],
]);

/** Models an intrinsic present-time population, without progenitors or elapsed time. */
export class CompactHostPlanetarySystemGenerator {
  private constructor() {}

  /** Only V2 SINGLE locators can be reclassified; ordinary and V1 seeds are untouched. */
  static generateOrNull(
    key: UniverseGenerationKey,
    locator: SystemLocator,
    /** Reuse the multiplicity already selected from this locator's V2 physical seed. */
    preselectedMultiplicity?: StellarSystemMultiplicity,
  ): CompactHostPlanetarySystem | null {
    if ((key.generatorVersion !== GeneratorVersion.V2 && key.generatorVersion !== GeneratorVersion.V3)) return null;
    if (!(locator instanceof SystemLocator)) {
      throw new TypeError('A real SystemLocator is required.');
    }
    const physicalKey = multihostPhysicalSourceKey(key);
    const seed = ProceduralTargetResolver.resolveTargetSeed(physicalKey, locator) as SystemSeed;
    // The catalogue has already resolved this exact V2 physical identity.
    // Reusing its result avoids selecting the same system twice when a
    // DISCOVERED record becomes CATALOGUED; ordinary callers still select here.
    const multiplicity = preselectedMultiplicity ??
      StellarSystemMultiplicitySelector.select(physicalKey, seed);
    if (multiplicity !== StellarSystemMultiplicity.SINGLE) {
      return null;
    }

    // Domain-separated entropy. This never advances a generator's PRNG stream.
    // In particular it does not overwrite the frozen physical SystemSeed.
    const material = [DOMAIN, key.universeSeed.normalizedValue, key.generatorVersion.code,
      locator.galaxyIndex, locator.sectorKey, locator.galacticObjectIndex,
      seed.normalizedValue].join(':');
    if (draw(material, 'SELECT') >= COMPACT_HOST_FRACTION_OF_V2_SINGLE) return null;

    let sample = draw(material, 'TYPE');
    let type: CompactPlanetaryHostType = ExtremeType.NEUTRON_STAR;
    for (const [candidate, weight] of TYPE_WEIGHTS) {
      type = candidate;
      sample -= weight;
      if (sample < 0) break;
    }

    const massSolar = type === ExtremeType.STELLAR_MASS_BLACK_HOLE
      ? spread(material, 'MASS', 4.5, 18)
      : spread(material, 'MASS', 1.18, 2.12);
    const state = presentHostState(material, type, massSolar);
    // The system does not claim to be a duplicate of an unrelated, separately
    // generated EXTREME_OBJECT locator; 31.4 will join physical identities only
    // if the public catalogue actually supplies such a link.
    const host = new CompactPlanetaryHost({
      generationKey: key,
      systemLocator: locator,
      type,
      extremeObjectLocator: null,
      scientificState: state,
    });
    const planets = generatePlanets(material, locator, type, massSolar);
    const frozenPlanets = Object.freeze(planets);
    const environments = Object.freeze(frozenPlanets.map(planet =>
      CompactHostEnvironmentEngine.project(host, planet)));
    const characterizations = Object.freeze(frozenPlanets.map((planet,index) =>
      CompactHostPlanetCharacterizationEngine.generate(host,planet,environments[index]!)));
    return Object.freeze({
      modelVersion: 'COMPACT_HOST_SNAPSHOT_31_2_V1' as const,
      host,
      planets: frozenPlanets,
      environments,
      characterizations,
      secondaries:CompactHostSecondaryPopulationGenerator.generate(host,frozenPlanets,environments),
      architecture: 'SINGLE' as const,
      orbitalAssessment: 'KEPLER_ROCHE_MUTUAL_HILL_SCREEN' as const,
      status: 'SNAPSHOT_MODEL_UNVALIDATED_N_BODY' as const,
    });
  }
}

function presentHostState(
  material: string,
  type: CompactPlanetaryHostType,
  massSolar: number,
): CompactHostScientificState {
  if (type === ExtremeType.STELLAR_MASS_BLACK_HOLE) {
    // A vacuum black hole has no stellar photosphere. No invented accretion.
    return {
      massSolar,
      activityRegime: 'QUIESCENT',
      thermalLuminositySolar: null,
      highEnergyLuminositySolar: null,
      accretionLuminositySolar: null,
      surfaceMagneticFieldTesla: null,
      rotationPeriodSeconds: null,
    };
  }
  const period = type === ExtremeType.MILLISECOND_PULSAR
    ? spread(material, 'PERIOD', 0.0016, 0.02)
    : type === ExtremeType.MAGNETAR
      ? spread(material, 'PERIOD', 2, 12)
      : type === ExtremeType.PULSAR
        ? spread(material, 'PERIOD', 0.05, 2)
        : spread(material, 'PERIOD', 0.1, 15);
  const field = type === ExtremeType.MAGNETAR
    ? logSpread(material, 'FIELD', 1e9, 1e11)
    : type === ExtremeType.MILLISECOND_PULSAR
      ? logSpread(material, 'FIELD', 1e3, 1e5)
      : logSpread(material, 'FIELD', 1e7, 1e9);
  return {
    massSolar,
    activityRegime: type === ExtremeType.MAGNETAR ? 'MAGNETICALLY_ACTIVE'
      : type === ExtremeType.NEUTRON_STAR ? 'QUIESCENT' : 'PULSED',
    // The snapshot does not know radiative efficiency, XUV spectrum, beaming,
    // spin-down or accretion flux. Those belong to 31.3, not a fake solar HZ.
    thermalLuminositySolar: null,
    highEnergyLuminositySolar: null,
    accretionLuminositySolar: null,
    surfaceMagneticFieldTesla: field,
    rotationPeriodSeconds: period,
  };
}

function generatePlanets(
  material: string,
  locator: SystemLocator,
  type: CompactPlanetaryHostType,
  massSolar: number,
): CompactHostPlanet[] {
  // Conditional planet frequency is a GENESIS tuning assumption; it is not
  // evidence for the true astrophysical incidence of compact-host planets.
  const chance = type === ExtremeType.MAGNETAR ? 0.12
    : type === ExtremeType.PULSAR ? 0.42
      : type === ExtremeType.MILLISECOND_PULSAR ? 0.36
        : type === ExtremeType.STELLAR_MASS_BLACK_HOLE ? 0.25 : 0.22;
  if (draw(material, 'PLANET-OCCURRENCE') >= chance) return [];
  const countSample = draw(material, 'COUNT');
  const count = countSample < 0.58 ? 1 : countSample < 0.87 ? 2 : 3;
  const planets: CompactHostPlanet[] = [];
  let previousApoastron = 0;
  let previousA = 0;
  let previousMassEarth = 0;
  const firstAxis = spread(material, 'FIRST-AXIS', 0.22, 0.92);
  const hostKg = massSolar * SOLAR_KG;

  for (let i = 0; i < count; i += 1) {
    const massEarth = logSpread(material, `MASS-${i}`, 0.045, 5.5);
    const radiusEarth = massEarth ** (massEarth >= 2 ? 0.26 : 0.28);
    const bulkKind = massEarth >= 2 ? 'SUPER_EARTH' as const : 'ROCKY' as const;
    const a = firstAxis * (2.6 ** i) * spread(material, `AXIS-${i}`, 0.98, 1.12);
    const e = spread(material, `ECC-${i}`, 0.002, 0.075);
    const periastronAu = a * (1 - e);
    const apoastronAu = a * (1 + e);
    const planetKg = massEarth * EARTH_KG;
    const radiusM = radiusEarth * EARTH_RADIUS_M;
    const rocheLimitAu = 2.44 * radiusM * (hostKg / planetKg) ** (1 / 3) / AU_M;
    // Schwarzschild radius is a minimal horizon screen for a non-spinning BH.
    const horizonAu = type === ExtremeType.STELLAR_MASS_BLACK_HOLE
      ? 2 * GRAVITATIONAL_CONSTANT * hostKg / LIGHT_SPEED ** 2 / AU_M : 0;
    if (periastronAu <= Math.max(rocheLimitAu, horizonAu * 10)) {
      return []; // All-or-nothing: no hidden invalid partial systems.
    }
    if (planets.length > 0) {
      const mutualHill = (previousA + a) / 2 *
        ((previousMassEarth + massEarth) * EARTH_KG / (3 * hostKg)) ** (1 / 3);
      if (periastronAu <= previousApoastron || a - previousA <= 8 * mutualHill) {
        return [];
      }
    }
    const periodDays = 2 * Math.PI * Math.sqrt((a * AU_M) ** 3 /
      (GRAVITATIONAL_CONSTANT * (hostKg + planetKg))) / SECONDS_PER_DAY;
    const meanDensityKgM3 = planetKg / (4 / 3 * Math.PI * radiusM ** 3);
    if (![massEarth, radiusEarth, a, e, periastronAu, apoastronAu,
      rocheLimitAu, periodDays, meanDensityKgM3].every(Number.isFinite)) {
      throw new RangeError('Non-finite intrinsic compact planet.');
    }
    planets.push(Object.freeze({
      locator: new BodyLocator(locator.galaxyIndex, locator.sectorKey,
        locator.galacticObjectIndex, BigInt(i)),
      ordinal: i + 1,
      bulkKind,
      massEarth,
      radiusEarth,
      meanDensityKgM3,
      semiMajorAxisAu: a,
      eccentricity: e,
      periastronAu,
      apoastronAu,
      orbitalPeriodDays: periodDays,
      rocheLimitAu,
    }));
    previousA = a;
    previousApoastron = apoastronAu;
    previousMassEarth = massEarth;
  }
  return planets;
}

function draw(material: string, slot: string): number {
  const digest = sha256(utf8ToBytes(`${material}:${slot}`));
  const view = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  // 53 uniform bits; never Math.random(), Date, or a mutable PRNG.
  return (view.getUint32(0, false) * 2 ** 21 + (view.getUint32(4, false) >>> 11)) / 2 ** 53;
}
function spread(material: string, slot: string, min: number, max: number): number {
  return min + (max - min) * draw(material, slot);
}
function logSpread(material: string, slot: string, min: number, max: number): number {
  return min * (max / min) ** draw(material, slot);
}
