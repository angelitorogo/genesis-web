import { generateMultihostPlanetEnvironmentV241 } from './multihost-planet-environment-v241';
import { BodySeed } from '../../domain/seed/hierarchical-seeds';
import { type MultihostFormedPlanetarySystemV22, type MultihostFormedPlanetV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import { type MultihostFormationDiskV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import { type MultihostScientificPlanetV241, type MultihostScientificPlanetCatalogV241 } from '../../domain/planetary/multihost-scientific-planet-v241';
import { PlanetType } from '../../domain/planetary/planet-type';
import { PlanetaryOrbitHabitableZoneRelation as Relation } from '../../domain/planetary/planetary-orbit-habitable-zone-relation';
import { PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR, PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR } from './planetary-system-habitable-zone-generator';
import { weightedMaterialProfileV1 } from './planet-internal-composition-generator';
import { classifyPlanetTypeFromBulkV1 } from './planet-type-generator';
import { buildPlanetSurfaceFromInputsV1 } from './planet-surface-base-generator';

const EARTH_DENSITY = 5.514;

/** V2.4.1 reads V2.2's mass/orbit/host budgets; reuses V1's *pure* 19.4,
 * 19.5 and 19.6 scientific algorithms. It never pretends V2 worlds are V1
 * entities and never writes saves, invents water, or runs V1 atmosphere engines
 * with the wrong host context. Any mixture unavailable in V2.2 is a prior. */
export function generateMultihostScientificPlanetsV241(
  formed: MultihostFormedPlanetarySystemV22,
  luminosities: Readonly<Partial<Record<'A' | 'B', number | null>>>,
): MultihostScientificPlanetCatalogV241 {
  if (!/^[0-9A-F]{32}$/.test(formed.sourceSystemSeed)) {
    throw new RangeError('V2.4.1 requires the normalized V2.2 SystemSeed.');
  }
  const planets: MultihostScientificPlanetV241[] = [];
  const ids = new Set<string>();
  for (const host of ['A', 'B'] as const) {
    const disk = formed.disks.find(item => item.hostId === host && item.family === 'S_TYPE');
    if (disk === undefined) continue;
    const luminosity = luminosities[host];
    const validLuminosity = luminosity != null && Number.isFinite(luminosity) && luminosity > 0
      ? luminosity : null;
    for (const planet of disk.planets) {
      if (planet.hostId !== host || planet.family !== 'S_TYPE' || ids.has(planet.id)) {
        throw new RangeError('V2.4.1 requires unique V2.2 planet IDs and matching S-type hosts.');
      }
      ids.add(planet.id);
      planets.push(derivePlanet(disk, planet, validLuminosity));
    }
  }
  return Object.freeze({
    version: 'V2_4_1_PLANET_SCIENCE' as const,
    sourceSystemSeed: formed.sourceSystemSeed,
    planets: Object.freeze(planets),
    limitations: Object.freeze([
      'V1 compartida: clasificación física 19.4, perfil de materiales 19.5 y cálculo superficial/albedo 19.6; nunca se fabrica un Planet/BodyLocator V1.',
      'V2.2 conserva conteos, masa, radio y órbitas: V2.4.1 no ejecuta la formación física V1 ni crea nuevos planetas; mezcla individual de materiales es hipótesis por BodySeed V2, no química confirmada.',
      'Atmósfera, clima y agua V2.4.1: estimaciones de laboratorio a partir de inventarios previos V2 y funciones físicas compartidas V1; no son fase-20 V1 ni observaciones.',
      'El clima estimado usa únicamente luminosidad de la anfitriona; no evalúa perturbaciones radiativas de la compañera, estabilidad climática a largo plazo ni migración N-body.',
      'Laboratorio V2 sin persistencia nueva: lunas y cuerpos menores científicos, fichas y guardado quedan para V2.4.2–V2.4.5.',
    ]),
  });
}

function derivePlanet(disk: MultihostFormationDiskV22, planet: MultihostFormedPlanetV22,
  luminosity: number | null): MultihostScientificPlanetV241 {
  const outer = Math.min(disk.window.referenceOuterAu, disk.window.outerStableAu ?? Number.POSITIVE_INFINITY);
  if (!disk.window.usable || !(planet.periapsisAu > disk.window.innerStableAu) ||
      !(planet.apoapsisAu < outer) ||
      !(planet.coreMassEarth > 0 && planet.envelopeMassEarth >= 0 && planet.massEarth > 0 &&
        planet.radiusEarth > 0 && planet.gravitatingMassSolar > 0 && planet.periodDays > 0) ||
      Math.abs(planet.coreMassEarth + planet.envelopeMassEarth - planet.massEarth) > 1e-8 * planet.massEarth ||
      !/^[0-9A-F]{32}$/.test(planet.formationSeedHex)) {
    throw new RangeError(`V2.4.1 planet outside its frozen stable S-type disk or inconsistent bulk: ${planet.id}.`);
  }
  const density = EARTH_DENSITY * planet.massEarth / planet.radiusEarth ** 3;
  const envelopeFraction = planet.envelopeMassEarth / planet.massEarth;
  const flux = luminosity === null ? null : luminosity /
    (planet.semiMajorAxisAu ** 2 * Math.sqrt(1 - planet.eccentricity ** 2));
  const frostLineAu = luminosity === null ? null : 2.7 * Math.sqrt(luminosity);
  // A V2.2 bulk class is NOT an individual chemical analysis. These source
  // fractions are labeled priors and never substituted for original V1 history.
  // V2.2 has no individual chemistry. Preserve its bulk and use a *distinct*,
  // mass-conserving host/planet-seed prior. Do not repaint all 20 worlds from
  // one ROCKY template or secretly copy the V1 host's disk inventory.
  const iceLineReached = frostLineAu !== null && planet.semiMajorAxisAu >= frostLineAu;
  const iceCandidate = planet.bulkType === 'ICY' || iceLineReached;
  const diversity = samplePlanetPrior(planet.formationSeedHex);
  const icePrior = planet.bulkType === 'ICY' ? 0.48 + diversity * 0.18 :
    iceCandidate ? 0.15 + diversity * 0.40 : 0.03 + diversity * 0.24;
  const volatilePrior = 0.04 + 0.14 * samplePlanetPrior(planet.formationSeedHex + ':volatile');
  const refractoryPrior = 0.06 + 0.17 * samplePlanetPrior(planet.formationSeedHex + ':refractory');
  const rockyPrior = 1 - icePrior - volatilePrior - refractoryPrior;
  const prior = [refractoryPrior, rockyPrior, icePrior, volatilePrior] as const;
  const fractions = weightedMaterialProfileV1(prior[0], prior[1], prior[2], prior[3]);
  const solid = planet.coreMassEarth;
  const metal = solid * fractions.metallicCoreFraction01;
  const silicate = solid * fractions.silicateInteriorFraction01;
  const ice = solid * fractions.condensedIceFraction01;
  const volatile = Math.max(0, solid - metal - silicate - ice);
  const iceBearing = prior[2] + prior[3];
  const relation = referenceZoneRelation(planet, luminosity);
  const tidal = planet.gravitatingMassSolar ** 2 * planet.radiusEarth ** 5 *
    planet.eccentricity ** 2 / (planet.massEarth * planet.semiMajorAxisAu ** 6);
  // V2.2 has no validated dissipation/Q or stellar evolution. Passing the raw
  // V1 tidal *proxy* as confirmed heat made ~half the worlds VOLCANIC. Hold
  // tidal/thermal claims at unknown and derive a separate *reference-only*
  // appearance using V1's existing conditional classifier.
  const bulk = {
    massEarth: planet.massEarth, radiusEarth: planet.radiusEarth,
    envelopeMassFraction01: envelopeFraction,
  };
  const v1Classification = planet.bulkType === 'GAS_ENVELOPE' || envelopeFraction >= 0.03
    ? classifyEnvelopeWorldType(planet, envelopeFraction, iceBearing, frostLineAu)
    : classifyPlanetTypeFromBulkV1(
        bulk, relation, iceBearing, flux ?? 0, 0, false,
      );
  const referenceAppearanceType = luminosity === null
    ? v1Classification
    : planet.bulkType === 'GAS_ENVELOPE' || envelopeFraction >= 0.03
      ? classifyEnvelopeWorldType(planet, envelopeFraction, iceBearing, frostLineAu)
      : classifyPlanetTypeFromBulkV1(bulk, relation, iceBearing, flux ?? 0, 0, true);
  const type = planet.bulkType === 'ICY' &&
    (v1Classification === PlanetType.ROCKY || v1Classification === PlanetType.SUPER_EARTH)
    ? PlanetType.ICE : v1Classification;
  const surface = buildPlanetSurfaceFromInputsV1({
    planetType: type, bodySeed: new BodySeed(planet.formationSeedHex),
    iceBearingFractionOfSolids01: iceBearing,
    // The V1 proxy is not a measured dissipation rate for V2.2 bodies.
    tidalHeatingProxy: 0, referenceMeanInsolationEarth: flux ?? 0,
  });
  const environment = generateMultihostPlanetEnvironmentV241({
    planetType: type, formationSeedHex: planet.formationSeedHex,
    massEarth: planet.massEarth, radiusEarth: planet.radiusEarth,
    envelopeMassFraction01: envelopeFraction,
    iceBearingFractionOfSolids01: iceBearing,
    volatileRichFraction01: prior[3], referenceMeanInsolationEarth: flux,
    referenceBondAlbedo01: surface.referenceBondAlbedo01,
  });
  const temperature = environment.equilibriumTemperatureKelvin;
  const formationPath = planet.formationPathV241 ?? Object.freeze({
    regime: 'UNRESOLVED' as const, estimatedBirthAxisAu: null,
    sourceSnowLineAu: frostLineAu,
    explanation: 'V2.2 histórico sin registro de formación/migración por anfitrión.',
  });
  return Object.freeze({
    version: 'V2_4_1_HOST_PLANET' as const,
    id: planet.id, formationSeedHex: planet.formationSeedHex,
    hostId: planet.hostId, designation: planet.designation,
    source: 'V2_2_FROZEN_BULK_V1_SHARED_CLASSIFICATION' as const,
    physics: Object.freeze({
      massEarth: planet.massEarth, coreMassEarth: planet.coreMassEarth,
      envelopeMassEarth: planet.envelopeMassEarth, radiusEarth: planet.radiusEarth,
      densityGramsPerCubicCentimeter: density,
      surfaceGravityEarth: planet.massEarth / planet.radiusEarth ** 2,
      rotationPeriodHours: planet.rotationPeriodHours,
      semiMajorAxisAu: planet.semiMajorAxisAu, periapsisAu: planet.periapsisAu,
      apoapsisAu: planet.apoapsisAu, periodDays: planet.periodDays,
    }),
    internalComposition: Object.freeze({
      confidence: 'V2_4_1_BULK_DERIVED_PRIOR' as const,
      refractoryRichFraction01: prior[0], rockyFraction01: prior[1],
      iceRichFraction01: prior[2], volatileRichFraction01: prior[3],
      iceBearingFractionOfSolids01: iceBearing,
      metallicCoreMassEarth: metal, silicateInteriorMassEarth: silicate,
      condensedIceMassEarth: ice, volatileRichInteriorMassEarth: volatile,
      gaseousEnvelopeMassEarth: planet.envelopeMassEarth,
    }),
    type, referenceAppearanceType: planet.bulkType === 'ICY' &&
      referenceAppearanceType === PlanetType.ROCKY ? PlanetType.ICE : referenceAppearanceType,
    appearanceConfidence: 'REFERENCE_ONLY_NO_ATMOSPHERE_OR_COMPANION' as const,
    environment, formationPath,
    referenceMeanInsolationEarth: flux, tidalHeatingProxy: tidal,
    surface: Object.freeze({source: 'V1_SHARED_SURFACE_BASE_FROM_V2_PRIORS' as const, ...surface}),
    thermal: Object.freeze({
      source: 'V1_EQUILIBRIUM_APPROXIMATION_HOST_ONLY' as const,
      equilibriumTemperatureKelvin: temperature,
      surfaceTemperatureKelvin: environment.climate.meanSurfaceTemperatureKelvin,
      atmosphereSurfacePressurePascal: environment.atmosphere.pressurePascal,
      liquidOceanCoverageFraction01: environment.water.surfaceLiquidWaterCoverageFraction01,
      surfaceIceCoverageFraction01: environment.water.surfaceIceCoverageFraction01,
      companionIrradianceIncluded: false as const,
    }),
  });
}

function referenceZoneRelation(planet: MultihostFormedPlanetV22, luminosity: number | null): Relation {
  if (luminosity === null) return Relation.WHOLLY_EXTERIOR_TO_ZONE;
  const inner = Math.sqrt(luminosity / PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR);
  const outer = Math.sqrt(luminosity / PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR);
  if (planet.apoapsisAu < inner) return Relation.WHOLLY_INTERIOR_TO_ZONE;
  if (planet.periapsisAu > outer) return Relation.WHOLLY_EXTERIOR_TO_ZONE;
  if (planet.periapsisAu >= inner && planet.apoapsisAu <= outer) return Relation.WHOLLY_WITHIN_ZONE;
  if (planet.periapsisAu < inner && planet.apoapsisAu > outer) return Relation.SPANS_BOTH_EDGES;
  return planet.periapsisAu < inner ? Relation.CROSSES_INNER_EDGE : Relation.CROSSES_OUTER_EDGE;
}

/** Deterministic 0..1 source-prior draw, isolated from every V1/SystemSeed RNG. */
function samplePlanetPrior(seedAndDomain: string): number {
  let hash = 0x811c9dc5;
  for (const character of `GENESIS:V2.4.1:SOLID-PRIOR:${seedAndDomain}`) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x1_0000_0000;
}


function classifyEnvelopeWorldType(
  planet: MultihostFormedPlanetV22,
  envelopeFraction: number,
  iceBearing: number,
  frostLineAu: number | null,
): PlanetType {
  const cold = frostLineAu !== null && planet.semiMajorAxisAu >= frostLineAu * 0.85;
  // Never assert a hot giant from a warm-disk assignment alone. A cold birth
  // site and explicit migration provenance must exist within the same host.
  if (frostLineAu !== null && planet.semiMajorAxisAu < frostLineAu &&
      planet.formationPathV241?.regime !== 'MIGRATION_SCENARIO') {
    return PlanetType.MINI_NEPTUNE;
  }
  if (
    (envelopeFraction >= 0.32 && planet.massEarth >= 18) ||
    (planet.massEarth >= 40 && planet.radiusEarth >= 5)
  ) {
    return cold && iceBearing >= 0.35
      ? PlanetType.ICE_GIANT
      : PlanetType.GAS_GIANT;
  }

  if (
    cold && (
      (envelopeFraction >= 0.10 && planet.massEarth >= 6) ||
      planet.radiusEarth >= 2.6
    )
  ) {
    return PlanetType.ICE_GIANT;
  }

  if (
    (envelopeFraction >= 0.14 && planet.massEarth >= 8) ||
    planet.radiusEarth >= 3.5
  ) {
    return PlanetType.GAS_GIANT;
  }

  return PlanetType.MINI_NEPTUNE;
}
