import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { type CompactHostPlanet } from '../../domain/planetary/compact-host-planetary-system';
import { type CompactHostSecondaryPopulation, type CompactHostMoon, type CompactHostMinorBody, type CompactHostDebrisBelt } from '../../domain/planetary/compact-host-secondary-population';
import { type CompactPlanetaryHost } from '../../domain/stellar/compact-planetary-host';
import { type CompactHostPlanetEnvironment } from '../../domain/planetary/compact-host-planetary-environment';

const AU_METERS = 149597870700;
const EARTH_RADIUS_M = 6371000;
const SOLAR_EARTH_MASS = 332946.05;
const DAYS_PER_YEAR = 365.25;
const DOMAIN = 'GENESIS-V2-COMPACT-31.4G-SECONDARIES-V1';
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Conditional snapshot population. Domain-separated SHA256 draws never advance
 * the original V2 generator streams or rewrite any existing planet/host values.
 * Only a bounded Roche/Hill/non-crossing screen is claimed, not N-body stability.
 */
export class CompactHostSecondaryPopulationGenerator {
  private constructor() {}

  static generate(host: CompactPlanetaryHost, planets: readonly CompactHostPlanet[],
    environments: readonly CompactHostPlanetEnvironment[]): CompactHostSecondaryPopulation {
    const system = host.systemLocator;
    const key = [DOMAIN, host.generationKey.universeSeed.normalizedValue,
      system.galaxyIndex, system.sectorKey, system.galacticObjectIndex].join('|');
    const hostEarth = host.scientificState.massSolar * SOLAR_EARTH_MASS;
    const moons: CompactHostMoon[] = [];
    for (const [index, planet] of planets.entries()) {
      const prefix = `${key}|P${planet.ordinal}`;
      if (draw(prefix, 'MOONS') > clamp01(0.14 + 0.15 * Math.sqrt(planet.massEarth))) continue;
      const maximum = draw(prefix, 'MOON_COUNT') < 0.78 ? 1 : 2;
      const planetRadiusAu = planet.radiusEarth * EARTH_RADIUS_M / AU_METERS;
      const planetDensity = planet.meanDensityKgM3 / 1000;
      const moonDensity = 2.0 + draw(prefix, 'DENSITY') * 2.0;
      // Fluid-body Roche screen using mean densities; 0.40 Hill at periapsis.
      const roche = 2.44 * planetRadiusAu * Math.cbrt(planetDensity / moonDensity);
      const hill = planet.periastronAu * Math.cbrt(planet.massEarth / (3 * hostEarth));
      const inner = Math.max(2.2 * roche, 5.0 * planetRadiusAu);
      const outer = 0.40 * hill;
      if (outer <= inner * 1.65) continue;
      for (let i = 0; i < maximum; i++) {
        // Enforce generous separation for multiple moons; skip invalid candidates.
        const distance = inner * (i === 0 ? 1.35 : 3.55) * (1 + draw(prefix, `A${i}`) * 0.35);
        const e = 0.003 + draw(prefix, `E${i}`) * 0.043;
        if (distance * (1-e) <= roche * 2 || distance * (1+e) >= outer) continue;
        const mass = Math.min(0.06, planet.massEarth * (0.0009 + draw(prefix, `M${i}`) * 0.014));
        const radius = Math.cbrt(mass * (5.51 / moonDensity));
        const periodDays = DAYS_PER_YEAR * Math.sqrt(distance ** 3 * SOLAR_EARTH_MASS / (planet.massEarth + mass));
        const ice = draw(prefix, `ICE${i}`);
        moons.push(Object.freeze({ parentPlanetOrdinal: planet.ordinal, ordinal:i+1,
          massEarth:mass, radiusEarth:radius, densityGramsCm3:moonDensity,
          semiMajorAxisAu:distance, semiMajorAxisPlanetRadii:distance/planetRadiusAu,
          eccentricity:e, inclinationDegrees:draw(prefix, `I${i}`)*8,
          orbitalPeriodDays:periodDays, rocheLimitAu:roche, hillLimitAu:hill,
          waterInventoryIndex01:ice*0.7, iceRichnessIndex01:ice,
          tidalHeatingIndex01:clamp01(0.12 * e / 0.04 * (inner / distance)**3),
          temperatureScenarioK:environments[index]?.referenceRadiativeTemperatureK ?? null,
        }));
      }
    }

    // Keep all small-body orbits outside the planets and host tidal boundary.
    // Nothing here asserts an actual Kuiper belt or historical capture channel.
    const outerPlanet = planets.length ? Math.max(...planets.map(p => p.apoastronAu)) : 0;
    const safeInner = Math.max(0.25, outerPlanet * 1.55);
    const debrisBelts: CompactHostDebrisBelt[] = [];
    const innerBeltStart = safeInner * 1.18;
    if (draw(key, 'BELT') < 0.78) debrisBelts.push(Object.freeze({
      region:'INNER', innerEdgeAu:innerBeltStart, outerEdgeAu:innerBeltStart * 1.5,
      populationIndex01:0.2 + 0.6*draw(key, 'BELT-DENSITY'),
    }));
    const outerBeltStart = Math.max(12, safeInner * 4.2);
    if (draw(key, 'OUTER-BELT') < 0.55) debrisBelts.push(Object.freeze({
      region:'OUTER', innerEdgeAu:outerBeltStart, outerEdgeAu:outerBeltStart*1.65,
      populationIndex01:0.15 + 0.55*draw(key, 'OUTER-DENSITY'),
    }));

    const minorBodies: CompactHostMinorBody[] = [];
    const specs = [
      {kind:MinorBodyKind.ASTEROID, amount:3, start:innerBeltStart, factor:1.43, e:0.085, family:'INNER_DEBRIS' as const},
      {kind:MinorBodyKind.COMET, amount:2, start:safeInner*3, factor:2, e:0.54, family:'HIGH_ECCENTRICITY' as const},
      {kind:MinorBodyKind.TRANS_NEPTUNIAN_OBJECT, amount:2, start:outerBeltStart, factor:1.58, e:0.17, family:'OUTER_DEBRIS' as const},
      {kind:MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT, amount:1, start:safeInner*5, factor:1, e:0.34, family:'CAPTURED_CANDIDATE' as const},
    ];
    for (const spec of specs) {
      for (let i=0; i<spec.amount; i++) {
        const slot = `${spec.kind.name}|${i}`;
        if (draw(key, `${slot}|PRESENT`) > (spec.kind===MinorBodyKind.ASTEROID ? 0.8:0.48)) continue;
        const a = spec.start * spec.factor**i * (1.05 + 0.35*draw(key,`${slot}|A`));
        const e = 0.01 + spec.e * (0.2 + 0.8*draw(key,`${slot}|E`));
        const peri = a*(1-e);
        // Physical guard: no radial overlap with the already-generated planets.
        if (peri <= Math.max(0.10,outerPlanet*1.20)) continue;
        const period = DAYS_PER_YEAR * Math.sqrt(a**3 / host.scientificState.massSolar);
        const digest = sha256(utf8ToBytes(`${key}|${slot}|IDENTITY`));
        const id = [...digest.slice(0,16)].map(b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
        const ice = spec.kind===MinorBodyKind.ASTEROID ? 0.08 + draw(key,`${slot}|ICE`)*0.28 :
          0.5 + draw(key,`${slot}|ICE`)*0.44;
        minorBodies.push(Object.freeze({ proceduralId:id, kind:spec.kind,
          ordinal:i+1, diameterKilometers:2+draw(key,`${slot}|SIZE`)*120,
          bulkDensityGramsCm3:2.6-1.4*ice, iceFraction01:ice,
          geometricAlbedo01:0.035+0.28*draw(key,`${slot}|ALBEDO`),
          semiMajorAxisAu:a, eccentricity:e, inclinationDegrees:2+draw(key,`${slot}|INCL`)*20,
          longitudeNodeDegrees:draw(key,`${slot}|NODE`)*360, orbitalPeriodDays:period,
          periapsisAu:peri, apoapsisAu:a*(1+e), orbitFamily:spec.family,
        }));
      }
    }
    return Object.freeze({version:'COMPACT_SECONDARIES_31_4G_V1' as const,
      moons:Object.freeze(moons), minorBodies:Object.freeze(minorBodies),
      debrisBelts:Object.freeze(debrisBelts),
      assessment:'ROCHE_HILL_AND_PLANET_CLEARANCE_SCREEN_NOT_N_BODY' as const});
  }
}

function draw(key:string, slot:string):number {
  const digest = sha256(utf8ToBytes(`${key}|${slot}`));
  const view = new DataView(digest.buffer, digest.byteOffset, digest.byteLength);
  return (view.getUint32(0,false)*2**21 + (view.getUint32(4,false)>>>11))/2**53;
}
