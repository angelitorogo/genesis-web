import { type MultihostFormedPlanetarySystemV22, type MultihostFormedPlanetV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import { type MultihostScientificPlanetCatalogV241, type MultihostScientificPlanetV241 } from '../../domain/planetary/multihost-scientific-planet-v241';
import {
  type MultihostScientificMoonCatalogV242, type MultihostScientificMoonV242,
  type MultihostMoonSystemV242,
} from '../../domain/planetary/multihost-scientific-moon-v242';
import { PlanetType } from '../../domain/planetary/planet-type';

const EARTH_MASS_PER_SOLAR = 332_946.0487;
const EARTH_RADIUS_AU = 4.26352124542639e-5;
const EARTH_RADIUS_KM = 6_371;
const EARTH_MASS_KG = 5.9722e24;
const GRAVITATIONAL_CONSTANT = 6.67430e-11;
const EARTH_DENSITY = 5.514;
const MAX_RELEVANT_MOONS = 8; // V1 bounds materialized major/relevant giant moons at eight.
const PROGRADE_HILL_FRACTION = 0.35; // tighter than V1's 0.45 due to companion perturbations
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** V2-local sample stream; does not consume any V1 PRNG or invent V1 identities. */
function sample(seed: string, domain: string): number {
  let h = 0x811c9dc5;
  for (const char of `GENESIS:V2.4.2:MOON:${seed}:${domain}`) h = Math.imul(h ^ char.charCodeAt(0), 0x01000193);
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 0x1_0000_0000;
}
function moonSeed(planetSeed: string, ordinal: number): string {
  return Array.from({length: 4}, (_, index) => Math.floor(
    sample(planetSeed, `identity:${ordinal}:${index}`) * 0x1_0000_0000,
  ).toString(16).padStart(8, '0')).join('').toUpperCase();
}
function giant(type: PlanetType): boolean {
  return type === PlanetType.GAS_GIANT || type === PlanetType.ICE_GIANT ||
    type === PlanetType.MINI_NEPTUNE;
}

/** Builds scientific mass, Roche/Hill bounded orbits, and reference environment
 * for ALL V2.2 S-type A/B planets, independent of the renderer's visibility cap.
 * Reuses the physical formulae behind phase-21 (Hill, Roche, Kepler and thermal
 * reference), but does not call MoonGenerator with forged V1 Planet/BodyLocator.
 */
export function generateMultihostScientificMoonsV242(
  formed: MultihostFormedPlanetarySystemV22,
  scientific: MultihostScientificPlanetCatalogV241,
): MultihostScientificMoonCatalogV242 {
  if (formed.sourceSystemSeed !== scientific.sourceSystemSeed) {
    throw new RangeError('V2.4.2 requires a matching formed planet and scientific planet catalogue.');
  }
  const sourcePlanets = formed.disks.filter(disk => disk.family === 'S_TYPE' &&
    (disk.hostId === 'A' || disk.hostId === 'B')).flatMap(disk => disk.planets);
  const scienceById = new Map(scientific.planets.map(planet => [planet.id, planet]));
  if (scienceById.size !== scientific.planets.length || scienceById.size !== sourcePlanets.length) {
    throw new RangeError('V2.4.2 requires exactly one scientific record per A/B S-type planet.');
  }
  const systems: MultihostMoonSystemV242[] = [];
  const ids = new Set<string>();
  for (const planet of sourcePlanets) {
    const science = scienceById.get(planet.id);
    if (science === undefined || science.formationSeedHex !== planet.formationSeedHex ||
      science.hostId !== planet.hostId || science.physics.massEarth !== planet.massEarth ||
      science.physics.radiusEarth !== planet.radiusEarth) {
      throw new RangeError(`V2.4.2 source mismatch: ${planet.id}.`);
    }
    const system = generateForPlanet(planet, science);
    for (const moon of system.moons) {
      if (ids.has(moon.id)) throw new RangeError(`Duplicate V2 moon: ${moon.id}.`);
      ids.add(moon.id);
    }
    systems.push(system);
  }
  return Object.freeze({
    version: 'V2_4_2_MOON_SCIENCE' as const,
    sourceSystemSeed: formed.sourceSystemSeed,
    systems: Object.freeze(systems),
    moons: Object.freeze(systems.flatMap(system => system.moons)),
    limitations: Object.freeze([
      'Modelo científico V2 de referencia, independiente del agregado MoonGenerator V1: no copia ni inventa MoonLocator/MoonSeed V1.',
      'Hasta ocho lunas relevantes materializadas por gigante; el recuento total estimado de satélites pequeños/irregulares no añade identidades, masas ni órbitas. Masa de las relevantes desde una fracción satelital modelada del planeta y órbitas Keplerianas fuera de Roche y dentro de Hill. No hay reserva lunar en el disco V2.2, estabilidad N-body secular ni captura irregular.',
      'Temperatura, agua, atmósfera, bloqueo y mareas son estimaciones potenciales, NO análisis confirmados ni habitabilidad demostrada; sin irradiación variable de B sobre las lunas de A o viceversa.',
      'El renderer selecciona hasta 36 lunas de catálogo, repartidas entre anfitriones y planetas; no altera conteos físicos. Laboratorio binario, sin escribir partidas ni modificar SINGLE/TRIPLE.',
    ]),
  });
}

function generateForPlanet(
  planet: MultihostFormedPlanetV22,
  science: MultihostScientificPlanetV241,
): MultihostMoonSystemV242 {
  if ((planet.hostId !== 'A' && planet.hostId !== 'B') || !(planet.massEarth > 0 &&
    planet.radiusEarth > 0 && planet.periapsisAu > 0 && planet.gravitatingMassSolar > 0)) {
    throw new RangeError(`Invalid V2 moon host: ${planet.id}.`);
  }
  const planetRadiusAu = planet.radiusEarth * EARTH_RADIUS_AU;
  const hill = planet.periapsisAu * Math.cbrt(
    planet.massEarth / (3 * planet.gravitatingMassSolar * EARTH_MASS_PER_SOLAR)) / planetRadiusAu;
  const capacity = hill <= 8 ? 0 : clamp01(Math.log10(hill / 8) / Math.log10(1200 / 8));
  const isGiant = giant(science.type);
  const seed = planet.formationSeedHex;
  // V1 materializes at most eight *relevant* moons, not the whole irregular/
  // kilometre-scale satellite population. Keep this a finite scientific model.
  const maximum = science.type === PlanetType.GAS_GIANT || science.type === PlanetType.ICE_GIANT
    ? MAX_RELEVANT_MOONS
    : science.type === PlanetType.MINI_NEPTUNE || science.type === PlanetType.ICE
      ? 6
      : science.type === PlanetType.SUPER_EARTH ? 5
        : science.type === PlanetType.OCEAN ? 4 : 3;
  const massSupport = clamp01(Math.log1p(planet.massEarth) /
    Math.log1p(isGiant ? 80 : 5));
  const candidateDensities = Array.from({length: maximum}, (_, i) => {
    const icy = clamp01(science.internalComposition.iceBearingFractionOfSolids01);
    const lo = isGiant ? 1.1 : 1.6;
    const hi = isGiant ? 3.3 : 4.4;
    return lo + (hi - lo) * (0.15 + 0.7 * sample(seed, `density:${i + 1}`)) * (1 - 0.32 * icy);
  });
  const hostDensity = EARTH_DENSITY * planet.massEarth / planet.radiusEarth ** 3;
  const roche = candidateDensities.map(density => 2.44 * Math.cbrt(hostDensity / density));
  const inner = Math.max(2.2, ...roche.map(r => r * 1.08));
  const outer = Math.min(isGiant ? 75 : 110, hill * PROGRADE_HILL_FRACTION);
  // Roche/Hill define the available *planetocentric* annulus. When it is
  // closed, no probabilistic abundance may manufacture a moon.
  const usable = outer > inner * 1.55;
  const orbitalSlots = usable
    ? Math.max(0, Math.floor(Math.log(outer * 0.90 / inner) / Math.log(1.22)))
    : 0;
  const effectiveMaximum = Math.min(maximum, orbitalSlots);
  const moonlessProbability = clamp01(
    (isGiant ? 0.035 : science.type === PlanetType.ICE ? 0.26 : 0.42) +
    (1 - capacity) * (isGiant ? 0.20 : 0.43),
  );
  const possible = usable && effectiveMaximum > 0 &&
    sample(seed, 'presence') >= moonlessProbability;
  const count = possible ? Math.min(effectiveMaximum, Math.max(1,
    1 + Math.floor(effectiveMaximum *
      (0.38 + 0.62 * sample(seed, 'abundance')) *
      (0.72 + 0.28 * massSupport)),
  )) : 0;
  // Approximate satellite mass budget as a tiny fraction of V2 host mass. This
  // is not a separate reservation from the frozen V2.2 circumstellar disk:
  // it must not be added to disk accretion or falsely advertised as global
  // planet+moon mass conservation. Giants receive a smaller satellite fraction.
  const massFraction = isGiant ? 0.00002 + 0.00018 * sample(seed, 'mass-budget')
    : 0.001 + 0.012 * sample(seed, 'mass-budget');
  const moonMassBudget = planet.massEarth * massFraction;
  // Keep V2 mass/identity draws independent of rendering and of all V1 RNG.
  // The orbital window and moon density draws above remain valid when count=0.
  const weights = Array.from({length: count}, (_, i) => 0.4 + sample(seed, `weight:${i + 1}`));
  const weightTotal = weights.reduce((sum, weight) => sum + weight, 0);
  const moons: MultihostScientificMoonV242[] = [];
  let previousApoapsis = inner;
  if (possible) for (let index = 0; index < count; index++) {
    const ordinal = index + 1;
    const mass = moonMassBudget * weights[index]! / weightTotal;
    const density = candidateDensities[index]!;
    const radius = Math.cbrt(mass * EARTH_DENSITY / density);
    const axisRadii = inner * Math.pow((outer * 0.90) / inner, ordinal / (count + 1));
    const eccentricity = 0.005 + 0.045 * sample(seed, `eccentricity:${ordinal}`);
    const peri = axisRadii * (1 - eccentricity);
    const apo = axisRadii * (1 + eccentricity);
    const previousMoon = moons.at(-1);
    const mutualClearance = previousMoon === undefined ? 0 :
      1.10 * (previousMoon.radiusEarth + radius) / planet.radiusEarth;
    if (peri <= roche[index]! * 1.03 ||
        peri <= previousApoapsis + mutualClearance ||
        apo >= outer || !(mass > 0 && Number.isFinite(radius))) continue;
    const axisAu = axisRadii * planetRadiusAu;
    const distanceMetres = axisRadii * planet.radiusEarth * EARTH_RADIUS_KM * 1_000;
    const periodDays = 2 * Math.PI * Math.sqrt(distanceMetres ** 3 /
      (GRAVITATIONAL_CONSTANT * (planet.massEarth + mass) * EARTH_MASS_KG)) / 86_400;
    if (!(Number.isFinite(periodDays) && periodDays > 0)) continue;
    const ice = clamp01((3.6 - density) / 2);
    const tideRelativeIo = (planet.massEarth / 317.8) ** 2 * (radius / 0.286) ** 5 *
      (eccentricity / 0.0041) ** 2 * (421_700 /
        (axisRadii * planet.radiusEarth * EARTH_RADIUS_KM)) ** 6;
    const tide = tideRelativeIo > 0 && Number.isFinite(tideRelativeIo)
      ? clamp01((Math.log10(tideRelativeIo) + 3) / 3) : 0;
    const flux = science.referenceMeanInsolationEarth;
    const temperature = flux === null ? null :
      278.33 * Math.pow(flux * (1 - (0.14 + 0.41 * ice)), 0.25) + 35 * tide;
    const escape = Math.sqrt(mass / radius);
    const retention = temperature === null ? 0 : clamp01(
      0.55 * clamp01((escape - 0.08) / 0.45) + 0.37 * ice + 0.08 * tide -
      0.35 * clamp01((temperature - 180) / 420));
    const subsurfacePotential = clamp01(ice * (0.25 + 0.75 * tide));
    const surfaceLiquidPotential = temperature !== null &&
      temperature >= 260 && temperature <= 330 && retention >= 0.32
      ? clamp01(ice * retention) : 0;
    const waterRegime = ice < 0.22 ? 'NONE' as const :
      surfaceLiquidPotential >= 0.28 ? 'SURFACE_LIQUID' as const :
      subsurfacePotential >= 0.37 ? 'SUBSURFACE_OCEAN' as const : 'SURFACE_ICE' as const;
    const atmosphereRegime = retention >= 0.68 ? 'THIN' as const :
      retention >= 0.32 ? 'TRACE' as const : 'NONE' as const;
    const geologyRegime = tide >= 0.5 ? 'TIDALLY_ACTIVE' as const :
      tide >= 0.15 ? 'LOW_ACTIVITY' as const : 'INERT' as const;
    const lockRelative = planet.massEarth ** 2 * (radius / 0.2727) ** 3 *
      (0.0123 / mass) * (384_400 / (axisRadii * planet.radiusEarth * EARTH_RADIUS_KM)) ** 6;
    const locking = Number.isFinite(lockRelative) && lockRelative > 0.1
      ? 'LIKELY_SYNCHRONOUS' as const : 'UNDETERMINED' as const;
    const id = `${planet.id}-v242-m${ordinal.toString().padStart(2, '0')}`;
    moons.push(Object.freeze({
      version: 'V2_4_2_S_TYPE_MOON' as const,
      id, hostId: planet.hostId, hostPlanetId: planet.id,
      hostPlanetOrdinal: planet.ordinal, ordinal,
      designation: `${planet.designation} · luna ${ordinal}`,
      formationSeedHex: moonSeed(seed, ordinal),
      origin: 'V2_4_2_DETERMINISTIC_SATELLITE_MODEL' as const,
      massEarth: mass, radiusEarth: radius, densityGramsPerCubicCentimeter: density,
      surfaceGravityEarth: mass / radius ** 2,
      semiMajorAxisAu: axisAu, semiMajorAxisPlanetRadii: axisRadii,
      eccentricity, inclinationDegrees: 8 * sample(seed, `inclination:${ordinal}`),
      rotationDegrees: 360 * sample(seed, `rotation:${ordinal}`),
      epochMeanAnomalyDegrees: 360 * sample(seed, `phase:${ordinal}`),
      periodDays, rocheLimitPlanetRadii: roche[index]!, hillRadiusPlanetRadii: hill,
      progradeOuterLimitPlanetRadii: outer,
      tidalHeatingIndex01: tide, locking,
      environment: Object.freeze({
        provenance: 'V2_4_2_REFERENCE_ESTIMATE' as const,
        inferredIceRichnessIndex01: ice,
        waterInventoryPotentialIndex01: ice,
        subsurfaceOceanPotentialIndex01: subsurfacePotential,
        surfaceLiquidWaterPotentialIndex01: surfaceLiquidPotential,
        estimatedSurfaceTemperatureKelvin: temperature,
        atmosphereRetentionIndex01: retention, atmosphereRegime, geologyRegime,
        waterRegime,
      }),
    }));
    previousApoapsis = apo;
  }
  const modeledMass = moons.reduce((sum, moon) => sum + moon.massEarth, 0);
  if (modeledMass > moonMassBudget * (1 + 1e-10)) {
    throw new RangeError(`V2.4.2 satellite mass conservation violation: ${planet.id}.`);
  }
  // Preserve V1's crucial population/relevant distinction. Giant systems may
  // plausibly host dozens of smaller satellites, but only the individually
  // generated relevant moons above have a physical mass, orbit and identity.
  const populationMaximum = science.type === PlanetType.GAS_GIANT ? 120 :
    science.type === PlanetType.ICE_GIANT ? 60 :
      science.type === PlanetType.MINI_NEPTUNE ? 16 : maximum;
  const estimatedTotalMoonCount = moons.length === 0 ? 0 : Math.max(
    moons.length,
    Math.min(populationMaximum, Math.floor(populationMaximum * capacity *
      (0.32 + 0.68 * massSupport) *
      Math.pow(sample(seed, 'total-population'), isGiant ? 1.25 : 1.5)) + 1),
  );
  return Object.freeze({
    hostPlanetId: planet.id, hostId: planet.hostId,
    hillRadiusPlanetRadii: hill, satelliteCapacityIndex01: capacity,
    estimatedTotalMoonCount,
    modeledMoonCount: moons.length, modeledMoonMassEarth: modeledMass,
    moons: Object.freeze(moons),
  });
}
