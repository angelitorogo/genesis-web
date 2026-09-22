import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';

import { type PulsarSecondGenerationPlanet, type PulsarSecondGenerationPopulation } from
  '../../domain/planetary/pulsar-second-generation-planet';
import { StellarPulsar } from '../../domain/stellar/stellar-pulsar';

const G = 6.67430e-11;
const SOLAR_KG = 1.98847e30;
const EARTH_KG = 5.9722e24;
const EARTH_RADIUS_M = 6_371_000;
const AU_M = 149_597_870_700;
const C = 299_792_458;

/**
 * 27.9 V2: rare, automatically generated second-generation population for an
 * ACTUAL existing pulsar. This is a separate physical lineage: no ancestral
 * planets are re-labelled as survivors and no V1/V2 body indices are shifted.
 *
 * Fallback disk occurrence, retained solid budget and growth times are
 * explicit model assumptions, NOT observed historical evidence; do not grant
 * scientific knowledge or PD based solely on this private generator.
 * Uses domain-separated SHA-256; zero draws from the frozen procedural PRNG.
 */
export class PulsarSecondGenerationGenerator {
  private constructor() {}

  static generate(
    pulsar: StellarPulsar | null,
    hostSystemSeedHex: string,
  ): PulsarSecondGenerationPopulation | null {
    if (pulsar === null) return null;
    if (!(pulsar instanceof StellarPulsar) || !/^[0-9A-F]{32}$/.test(hostSystemSeedHex)) {
      throw new TypeError('27.9 V2 requires a real pulsar and its exact canonical SystemSeed.');
    }
    const remnant = pulsar.neutronStar;
    // Our fallback channel does not pretend to infer a disk from mass transfer
    // or the electron-capture case: neither is modelled with a fallback budget.
    if (pulsar.kind !== 'ORDINARY' || remnant.formationChannel.name !== 'IRON_CORE_COLLAPSE' ||
        remnant.ageSinceFormationBillionYears < 0.003) return null;
    const star = remnant.star;
    const material = [
      'GENESIS-PULSAR-SECOND-GENERATION-27.9-V2',
      star.generationKey.universeSeed.normalizedValue,
      star.generationKey.generatorVersion.code,
      star.locator.galaxyIndex,
      star.locator.sectorKey,
      star.locator.galacticObjectIndex,
      hostSystemSeedHex,
    ].join(':');
    const bytes = sha256(utf8ToBytes(material));
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const draw = (index: number) => view.getUint32(index * 4, false) / 0x1_0000_0000;
    // Explicit rarity of the GENESIS model; not an observed occurrence rate.
    if (draw(0) >= 0.004) return null;
    const diskMassEarth = 2 + 12 * draw(1);
    const formationDelayGyr = 0.003 + 0.006 * draw(2);
    if (remnant.ageSinceFormationBillionYears < formationDelayGyr) return null;
    const totalSolidBudget = diskMassEarth * (0.12 + 0.19 * draw(3));
    const count = 1 + (draw(4) < 0.18 ? 2 : draw(4) < 0.57 ? 1 : 0);
    const bodyWeights = Array.from({ length: count }, (_, i) => 0.55 + bodyDraw(material, i, 0));
    const totalWeights = bodyWeights.reduce((sum, weight) => sum + weight, 0);
    const baseAxisAu = 0.23 + 0.22 * draw(5);
    const planets: PulsarSecondGenerationPlanet[] = [];
    for (let i = 0; i < count; i += 1) {
      const massEarth = totalSolidBudget * bodyWeights[i]! / totalWeights;
      const radiusEarth = Math.pow(massEarth, 0.28); // rocky-body approximation
      const a = baseAxisAu * (2.35 ** i) * (1 + 0.08 * bodyDraw(material, i, 1));
      const e = 0.005 + 0.045 * bodyDraw(material, i, 2);
      const periastronAu = a * (1 - e);
      const apoastronAu = a * (1 + e);
      const neutronKg = remnant.massSolar * SOLAR_KG;
      const planetKg = massEarth * EARTH_KG;
      const rocheAu = 2.44 * radiusEarth * EARTH_RADIUS_M *
        (neutronKg / planetKg) ** (1 / 3) / AU_M;
      if (periastronAu <= rocheAu || periastronAu * AU_M <= remnant.radiusKm * 1_000) {
        return null;
      }
      const period = 2 * Math.PI * Math.sqrt((a * AU_M) ** 3 /
        (G * (neutronKg + planetKg))) / 86_400;
      const identityHex = bytesToHex(sha256(utf8ToBytes(`${material}:PLANET:${i}`)))
        .slice(0, 32).toUpperCase();
      const candidate: PulsarSecondGenerationPlanet = Object.freeze({
        identityHex, ordinal: i + 1, origin: 'MODELLED_SUPERNOVA_FALLBACK',
        hostSystemSeedHex,
        parentPulsarHostSeedHex: hostSystemSeedHex,
        massEarth, radiusEarth, semiMajorAxisAu: a, eccentricity: e,
        periastronAu, apoastronAu,
        orbitalPeriodDays: period,
        formedAtAgeBillionYears: remnant.formationAgeBillionYears + formationDelayGyr,
        diskMassEarth,
        edgeOnTimingSemiAmplitudeSeconds: a * AU_M * planetKg / (neutronKg + planetKg) / C,
        isotropicEquivalentSpinDownFluxWm2: pulsar.rotationalEnergyLossWatts /
          (4 * Math.PI * (a * AU_M) ** 2),
      });
      if (![massEarth, radiusEarth, period, candidate.edgeOnTimingSemiAmplitudeSeconds,
        candidate.isotropicEquivalentSpinDownFluxWm2].every(value => Number.isFinite(value) && value > 0)) {
        throw new RangeError('Invalid second-generation pulsar planet physical reference.');
      }
      if (planets.length) {
        const previous = planets[planets.length - 1]!;
        const mutualHill = (previous.semiMajorAxisAu + a) / 2 *
          (((previous.massEarth + massEarth) * EARTH_KG) / (3 * neutronKg)) ** (1 / 3);
        if (previous.apoastronAu >= periastronAu || a - previous.semiMajorAxisAu <= 3.5 * mutualHill) {
          return null;
        }
      }
      planets.push(candidate);
    }
    if (planets.reduce((sum, planet) => sum + planet.massEarth, 0) > diskMassEarth ||
        planets.length === 0) throw new Error('27.9 V2 fallback mass budget invalid.');
    return Object.freeze({
      modelVersion: 'PULSAR_SECOND_GENERATION_V1',
      origin: 'MODELLED_SUPERNOVA_FALLBACK', hostSystemSeedHex,
      parentPulsarHostSeedHex: hostSystemSeedHex,
      diskMassEarth,
      diskFormationAgeBillionYears: remnant.formationAgeBillionYears,
      planetFormationAgeBillionYears: remnant.formationAgeBillionYears + formationDelayGyr,
      planets: Object.freeze(planets),
      scientificStatus: 'SPECULATIVE_FORMATION_MODEL',
    });
  }
}

function bodyDraw(material: string, index: number, slot: number): number {
  const bytes = sha256(utf8ToBytes(`${material}:BODY:${index}:${slot}`));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return view.getUint32(0, false) / 0x1_0000_0000;
}
