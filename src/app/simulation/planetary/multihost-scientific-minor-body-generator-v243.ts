import { type MultihostFormedPlanetarySystemV22, type MultihostFormationDiskV22 } from '../../domain/planetary/multihost-formed-planetary-system';
import {
  type MultihostMinorHostV243, type MultihostScientificBeltV243,
  type MultihostScientificMinorBodyV243, type MultihostMinorHostInventoryV243,
  type MultihostScientificMinorBodyCatalogV243, type MultihostAsteroidCompositionV243,
  type MultihostCometReservoirV243, type MultihostCometOrbitClassV243,
} from '../../domain/planetary/multihost-scientific-minor-bodies-v243';

const YEAR_DAYS = 365.25;
const EARTH_MASS_KG = 5.9722e24;
const MAX_ASTEROIDS_PER_BELT = 5;
const MAX_COMETS_PER_HOST = 3;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function hash(seed: string, host: string, domain: string): number {
  let n = 0x811c9dc5;
  for (const c of `GENESIS:V2.4.3:${seed}:${host}:${domain}`)
    n = Math.imul(n ^ c.charCodeAt(0), 0x01000193);
  n ^= n >>> 16;
  n = Math.imul(n, 0x7feb352d);
  n ^= n >>> 15;
  n = Math.imul(n, 0x846ca68b);
  return (n ^ (n >>> 16)) >>> 0;
}
function roll(seed: string, host: string, domain: string): number {
  return hash(seed, host, domain) / 0x1_0000_0000;
}
function identity(seed: string, host: string, kind: string, ordinal: number): string {
  return Array.from({length: 4}, (_, n) => hash(seed, host, `${kind}:${ordinal}:${n}`)
    .toString(16).padStart(8, '0')).join('').toUpperCase();
}
function massOf(diameterKm: number, densityGcm3: number): number {
  return Math.PI / 6 * (diameterKm * 1000) ** 3 * densityGcm3 * 1000 / EARTH_MASS_KG;
}
function orbitalPeriod(axisAu: number, solarMass: number): number {
  return YEAR_DAYS * Math.sqrt(axisAu ** 3 / solarMass);
}

/** Materializes scientific, host-local minor bodies from the *unspent* V2.2
 * solid inventory, independent of V2.3 QA bodies, renderer budgets and V1 RNG.
 * The allocation is a non-mutating read-only sub-budget of remaining solids;
 * it is NOT fed back to V2.2 formation or V1 persisted inventories. */
export function generateMultihostScientificMinorBodiesV243(
  formed: MultihostFormedPlanetarySystemV22,
  luminosities: Readonly<Partial<Record<MultihostMinorHostV243, number | null>>>,
): MultihostScientificMinorBodyCatalogV243 {
  if (!/^[0-9A-F]{32}$/.test(formed.sourceSystemSeed)) {
    throw new RangeError('V2.4.3 requires a normalized V2 SystemSeed.');
  }
  const hosts: MultihostMinorHostInventoryV243[] = [];
  for (const hostId of ['A', 'B'] as const) {
    const disk = formed.disks.find(value => value.hostId === hostId && value.family === 'S_TYPE');
    if (disk === undefined) continue;
    const luminosity = luminosities[hostId];
    if (luminosity != null && !(Number.isFinite(luminosity) && luminosity > 0))
      throw new RangeError(`V2.4.3 invalid luminosity for ${hostId}.`);
    hosts.push(buildHostInventory(formed.sourceSystemSeed, disk, luminosity ?? null));
  }
  const belts = Object.freeze(hosts.flatMap(item => item.belts));
  const bodies = Object.freeze(hosts.flatMap(item => item.bodies));
  if (new Set([...belts, ...bodies].map(item => item.id)).size !== belts.length + bodies.length ||
      new Set(bodies.map(item => item.formationSeedHex)).size !== bodies.length) {
    throw new RangeError('V2.4.3 minor-body identities must be unique across A and B.');
  }
  return Object.freeze({
    version: 'V2_4_3_MINOR_BODY_SCIENCE' as const,
    sourceSystemSeed: formed.sourceSystemSeed,
    hosts: Object.freeze(hosts), belts, bodies,
    limitations: Object.freeze([
      'Per-host V2.2 residual solids are used as non-mutating inventory upper bounds; they are not V1 phase-17.7 residual dust or a retroactive subtraction from V2.2.',
      'Belt/asteroid radial exclusions are maintained; inbound comet reference orbits may cross planetary radial envelopes without implying a collision or a long-term stability proof.',
      'Cometary S-type reservoirs require a cold annulus inside the same host stable window. No unsupported companion-host Oort cloud, P-type reservoir or interstellar import is fabricated.',
      'Estimated asteroid/comet populations are statistical only. Only individually modeled relevant objects have deterministic V2 IDs, masses and Keplerian orbits.',
      'V1-style visiting comets use log-sampled inner periapsis, high eccentricity and broad inclination, constrained to the host S-type window; cold reservoir members can remain dynamically quiet and are not necessarily displayed.',
      'Comet nuclei and irradiation use a host-only reference, not companion radiation or time-resolved volatile loss. No V1 BodyLocator, discovery state, save write or TRIPLE modification.',
    ]),
  });
}

interface Gap {readonly lo: number; readonly hi: number}
function buildHostInventory(seed: string, disk: MultihostFormationDiskV22,
  luminosity: number | null): MultihostMinorHostInventoryV243 {
  const hostId = disk.hostId as MultihostMinorHostV243;
  const remaining = disk.remainingSolidsEarth;
  const outer = Math.min(disk.window.referenceOuterAu,
    disk.window.outerStableAu ?? disk.window.referenceOuterAu);
  if (!(Number.isFinite(remaining) && remaining >= 0 &&
      Number.isFinite(outer) && outer >= 0 && disk.window.innerStableAu > 0 &&
      disk.window.gravitatingMassSolar > 0)) {
    throw new RangeError(`V2.4.3 malformed source disk ${hostId}.`);
  }
  const belts: MultihostScientificBeltV243[] = [];
  const bodies: MultihostScientificMinorBodyV243[] = [];
  const available = disk.window.usable && remaining > 0 &&
    outer > disk.window.innerStableAu * 1.35;
  const planetEdges = [...disk.planets].sort((a, b) => a.periapsisAu - b.periapsisAu);
  const gaps: Gap[] = [];
  let previousOuter = disk.window.innerStableAu;
  if (available) {
    for (const planet of planetEdges) {
      if (planet.hostId !== hostId || !(planet.periapsisAu > disk.window.innerStableAu &&
          planet.apoapsisAu < outer && planet.periapsisAu < planet.apoapsisAu)) {
        throw new RangeError(`V2.4.3 ${hostId}: malformed planetary interval.`);
      }
      if (planet.periapsisAu > previousOuter * 1.22) gaps.push(Object.freeze({lo: previousOuter, hi: planet.periapsisAu}));
      previousOuter = Math.max(previousOuter, planet.apoapsisAu);
    }
    if (outer > previousOuter * 1.22) gaps.push(Object.freeze({lo: previousOuter, hi: outer}));
  }
  // Each belt is strictly between planet radial envelopes with clearance;
  // two profiles maximum, as in V1: INNER / OUTER. No belt in a closed gap.
  const candidates = gaps.filter(gap => gap.hi / gap.lo > 1.42)
    .sort((a, b) => b.hi / b.lo - a.hi / a.lo)
    .slice(0, 2).sort((a, b) => a.lo - b.lo);
  const presence = roll(seed, hostId, 'presence');
  const selected = candidates.filter((gap, i) =>
    roll(seed, hostId, `belt-presence:${i}`) < (presence > 0.12 ? 0.91 : 0.55));
  const beltBudget = selected.length ? Math.min(0.23, remaining *
    (0.0015 + 0.026 * roll(seed, hostId, 'belt-retention'))) : 0;
  // The old generator picked the WIDEST planetary gap, often next to the star.
  // A nucleus source must instead be COLD, explicitly within this star's own
  // S-type stability frontier, and associated with an actual planet-free annulus.
  // A close binary may have no such annulus: it then forms NO local comets.
  const snowLineAu = luminosity === null ? null : 2.7 * Math.sqrt(luminosity);
  const outerColdGaps = snowLineAu === null ? [] : gaps.map(gap => ({
    lo: Math.max(gap.lo * 1.015, snowLineAu * 1.06),
    hi: gap.hi / 1.015,
  })).filter(gap => gap.hi > gap.lo * 1.035 && gap.hi >= outer * 0.45)
    .sort((a, b) => b.hi - a.hi);
  const coldGap = outerColdGaps[0];
  const cometReservoir: MultihostCometReservoirV243 | null = coldGap === undefined || snowLineAu === null
    ? null : Object.freeze({
      id: `v243-${seed}-${hostId}-comet-reservoir`, hostId,
      innerEdgeAu: coldGap.lo, outerEdgeAu: coldGap.hi, snowLineAu,
      source: 'V2_4_3_COLD_S_TYPE_REFERENCE' as const,
    });
  const cometBudget = available && cometReservoir !== null
    ? Math.min(0.045, Math.max(0, remaining - beltBudget) *
      (0.0001 + 0.003 * roll(seed, hostId, 'comet-retention'))) : 0;
  const densitySupport = clamp01(Math.log1p(remaining) / Math.log1p(15));
  let asteroidMass = 0;
  let cometMass = 0;
  let estimatedAsteroids = 0;
  let estimatedComets = 0;
  for (let i = 0; i < selected.length; i++) {
    const gap = selected[i]!;
    const innerEdgeAu = gap.lo * 1.09;
    const outerEdgeAu = gap.hi / 1.09;
    if (!(outerEdgeAu > innerEdgeAu * 1.10)) continue;
    const region = i === 0 ? 'INNER' as const : 'OUTER' as const;
    const mass = beltBudget / selected.length;
    const peakAu = Math.sqrt(innerEdgeAu * outerEdgeAu);
    const cold = luminosity !== null && peakAu > 2.7 * Math.sqrt(luminosity);
    const comp = asteroidComposition(seed, hostId, `belt:${i}`, cold);
    const estimate = Math.max(1, Math.floor((180 + 1800 * densitySupport) *
      (0.35 + 0.65 * roll(seed, hostId, `belt-population:${i}`))));
    const belt: MultihostScientificBeltV243 = Object.freeze({
      version: 'V2_4_3_S_TYPE_BELT' as const,
      id: `v243-${seed}-${hostId}-belt-${String(i + 1).padStart(2, '0')}`,
      hostId, region, innerEdgeAu, outerEdgeAu, peakAu, massEarth: mass,
      estimatedPopulation: estimate,
      populationIndex01: clamp01(0.18 + 0.72 * densitySupport),
      composition: comp,
      source: 'V2_4_3_RESIDUAL_SOLIDS_REFERENCE' as const,
    });
    belts.push(belt);
    estimatedAsteroids += estimate;
    const count = Math.min(MAX_ASTEROIDS_PER_BELT, Math.max(1, 2 +
      Math.floor(4 * roll(seed, hostId, `asteroid-count:${i}`))));
    for (let n = 0; n < count; n++) {
      const axis = innerEdgeAu * (outerEdgeAu / innerEdgeAu) ** ((n + 0.5) / count);
      const allowance = Math.min((axis - innerEdgeAu) / axis,
        (outerEdgeAu - axis) / axis);
      const eccentricity = Math.min(0.09, allowance * 0.65) *
        roll(seed, hostId, `asteroid-e:${i}:${n}`);
      const diameter = 14 + 160 * roll(seed, hostId, `asteroid-size:${i}:${n}`);
      const composition = asteroidComposition(seed, hostId, `asteroid:${i}:${n}`, cold);
      const porosity = 0.12 + 0.54 * roll(seed, hostId, `asteroid-porosity:${i}:${n}`);
      const density = (composition === 'METALLIC' ? 5.1 :
        composition === 'ICE_RICH' ? 1.65 : composition === 'CARBONACEOUS' ? 2.1 : 3.2) *
        (1 - 0.42 * porosity);
      const massEarth = massOf(diameter, density);
      if (asteroidMass + massEarth > beltBudget * (1 + 1e-10)) continue;
      bodies.push(makeBody(seed, hostId, 'ASTEROID', bodies.length + 1, belt.id,
        axis, eccentricity, disk.window.gravitatingMassSolar, diameter, massEarth,
        density, porosity, composition, roll(seed, hostId, `asteroid-phase:${i}:${n}`)));
      asteroidMass += massEarth;
    }
  }
  // Model two distinguishable populations sourced by the SAME cold annulus:
  // bound reservoir nuclei (q and Q remain outside the snow line) and inbound
  // visitors (Q in that reservoir, q may cross planet RADII, not necessarily a
  // planet's actual position). Both orbits stay within their host's S window.
  if (cometBudget > 0 && cometReservoir !== null &&
      roll(seed, hostId, 'comet-presence') < 0.90) {
    const count = 1 + Math.floor(MAX_COMETS_PER_HOST *
      roll(seed, hostId, 'comet-count'));
    const lastPlanetApoAu = planetEdges.at(-1)?.apoapsisAu ?? disk.window.innerStableAu;
    for (let n = 0; n < Math.min(MAX_COMETS_PER_HOST, count); n++) {
      const outerDraw = roll(seed, hostId, `comet-outer:${n}`);
      const apo = cometReservoir.innerEdgeAu +
        (cometReservoir.outerEdgeAu - cometReservoir.innerEdgeAu) * (0.42 + 0.55 * outerDraw);
      // V1's visiting-comet geometry samples periapsis logarithmically and
      // derives e from a and q. The old V2 q ~ 0.6 * last planetary apoapsis
      // made most supposed visitors look like circular belt objects. Keep the
      // apoapsis IN this host's cold stable source, and sample a much smaller
      // periapsis only if the same S-type window physically accommodates it.
      const visitorFloor = Math.max(
        disk.window.innerStableAu * 1.08,
        Math.min(0.20, apo * 0.07), // V1's 0.20 AU where allowed.
      );
      const visitorCeiling = Math.min(
        apo * 0.16, // e >= (1 - 0.16)/(1 + 0.16) = 0.724.
        lastPlanetApoAu * 0.82, cometReservoir.innerEdgeAu * 0.72, 5,
      );
      const mayVisit = planetEdges.length > 0 &&
        visitorCeiling > visitorFloor * 1.025 &&
        lastPlanetApoAu > visitorFloor * 1.025;
      const visitorPeri = mayVisit
        ? visitorFloor * (visitorCeiling / visitorFloor) **
          roll(seed, hostId, `comet-inbound-peri:${n}`)
        : null;
      const visitorCrosses = visitorPeri !== null &&
        planetEdges.some(planet => visitorPeri <= planet.apoapsisAu &&
          apo >= planet.periapsisAu);
      // Prioritize at least the first physical inbound visitor, retain a
      // reservoir member when possible. Nothing is forced through a closed
      // annulus and the source catalogue remains independent of rendering.
      const inboundDraw = roll(seed, hostId, `comet-inbound-class:${n}`);
      const inbound = visitorCrosses && (n === 0 || n === 2 || inboundDraw < 0.60);
      // Dormant source residents stay *inside* the reservoir; their naturally
      // low-e orbits are valid science but not visually active V1-like comets.
      const residentPeri = cometReservoir.innerEdgeAu *
        (1.005 + 0.018 * roll(seed, hostId, `comet-resident-peri:${n}`));
      const peri = inbound ? visitorPeri! : residentPeri;
      if (!(peri > disk.window.innerStableAu && apo > peri * 1.012 &&
        apo < outer && (inbound || peri > cometReservoir.snowLineAu))) continue;
      const axis = (peri + apo) / 2;
      const e = (apo - peri) / (apo + peri);
      if (inbound && e < 0.724 - 1e-10) {
        throw new RangeError('V2.4.3 V1-like inbound orbit unexpectedly lost eccentricity.');
      }
      const diameter = 2 + 18 * roll(seed, hostId, `comet-size:${n}`);
      const porosity = 0.4 + 0.37 * roll(seed, hostId, `comet-porosity:${n}`);
      const density = 0.85 * (1 - 0.32 * porosity);
      const massEarth = massOf(diameter, density);
      if (cometMass + massEarth > cometBudget * (1 + 1e-10)) continue;
      const regime: MultihostCometOrbitClassV243 = inbound ? 'INBOUND_VISITOR' : 'RESERVOIR_BOUND';
      bodies.push(makeBody(seed, hostId, 'COMET', n + 1, null, axis, e,
        disk.window.gravitatingMassSolar, diameter, massEarth, density,
        porosity, 'ICE_RICH', roll(seed, hostId, `comet-phase:${n}`), {
          reservoirId: cometReservoir.id, regime, crossesPlanets: inbound,
        }));
      cometMass += massEarth;
    }
    const modeledComets = bodies.filter(body => body.kind === 'COMET').length;
    estimatedComets = modeledComets === 0 ? 0 : Math.max(modeledComets,
      Math.floor(20 + 120 * densitySupport * roll(seed, hostId, 'comet-population')));
  }
  if (beltBudget + cometBudget > remaining * (1 + 1e-10) ||
      asteroidMass > beltBudget * (1 + 1e-10) || cometMass > cometBudget * (1 + 1e-10)) {
    throw new RangeError(`V2.4.3 minor-body residual-solid conservation violation for ${hostId}.`);
  }
  return Object.freeze({
    hostId, remainingSolidsEarth: remaining,
    allocatedBeltMassEarth: belts.reduce((sum, belt) => sum + belt.massEarth, 0),
    allocatedCometReservoirEarth: cometBudget,
    cometReservoir,
    modeledAsteroidMassEarth: asteroidMass, modeledCometMassEarth: cometMass,
    estimatedAsteroidPopulation: estimatedAsteroids,
    estimatedCometPopulation: estimatedComets,
    belts: Object.freeze(belts), bodies: Object.freeze(bodies),
  });
}

function asteroidComposition(seed: string, host: string, domain: string,
  cold: boolean): MultihostAsteroidCompositionV243 {
  const r = roll(seed, host, `composition:${domain}`);
  if (cold && r > 0.42) return r > 0.8 ? 'ICE_RICH' : 'MIXED_ROCK_ICE';
  if (r < 0.35) return 'CARBONACEOUS';
  if (r < 0.72) return 'SILICACEOUS';
  return 'METALLIC';
}

function makeBody(seed: string, hostId: MultihostMinorHostV243,
  kind: 'ASTEROID' | 'COMET', ordinal: number, beltId: string | null,
  axis: number, eccentricity: number, hostMass: number,
  diameter: number, massEarth: number, density: number, porosity: number,
  composition: MultihostAsteroidCompositionV243, phase: number,
  cometOrbit: Readonly<{
    reservoirId: string; regime: MultihostCometOrbitClassV243; crossesPlanets: boolean;
  }> | null = null,
): MultihostScientificMinorBodyV243 {
  const ice = kind === 'COMET' ? 0.58 + 0.24 * phase :
    composition === 'ICE_RICH' ? 0.68 : composition === 'MIXED_ROCK_ICE' ? 0.40 : 0.05;
  const e = Math.max(0, Math.min(kind === 'COMET' ? 0.97 : 0.95, eccentricity));
  return Object.freeze({
    version: 'V2_4_3_S_TYPE_MINOR_BODY' as const,
    id: `v243-${seed}-${hostId}-${kind.toLowerCase()}-${String(ordinal).padStart(2, '0')}`,
    formationSeedHex: identity(seed, hostId, kind, ordinal), hostId, kind, ordinal,
    designation: `${hostId} · ${kind === 'COMET' ? 'COM' : 'AST'}-${String(ordinal).padStart(2, '0')}`,
    beltId,
    ...(cometOrbit === null ? {} : {
      cometReservoirId: cometOrbit.reservoirId,
      cometOrbitClass: cometOrbit.regime,
      crossesPlanetaryRadialEnvelope: cometOrbit.crossesPlanets,
    }),
    semiMajorAxisAu: axis, eccentricity: e,
    periapsisAu: axis * (1 - e), apoapsisAu: axis * (1 + e),
    periodDays: orbitalPeriod(axis, hostMass),
    inclinationDegrees: kind === 'COMET'
      ? v1CometInclination(orbitalPeriod(axis, hostMass) / YEAR_DAYS,
          roll(seed, hostId, `${kind}:${ordinal}:inclination`))
      : 8 * roll(seed, hostId, `${kind}:${ordinal}:inclination`),
    rotationDegrees: kind === 'COMET'
      ? (360 * roll(seed, hostId, `${kind}:${ordinal}:node`) +
        360 * roll(seed, hostId, `${kind}:${ordinal}:arg-periapsis`)) % 360
      : 360 * roll(seed, hostId, `${kind}:${ordinal}:node`),
    ...(kind === 'COMET' ? {
      longitudeAscendingNodeDegrees: 360 * roll(seed, hostId, `${kind}:${ordinal}:node`),
      argumentOfPeriapsisDegrees: 360 * roll(seed, hostId, `${kind}:${ordinal}:arg-periapsis`),
    } : {}),
    epochMeanAnomalyDegrees: 360 * phase,
    diameterKilometers: diameter, massEarth,
    densityGramsPerCubicCentimeter: density, porosityIndex01: porosity,
    geometricAlbedo01: kind === 'COMET' ? 0.03 + 0.035 * phase :
      composition === 'ICE_RICH' ? 0.32 : composition === 'METALLIC' ? 0.22 : 0.11,
    composition, structure: kind === 'COMET' ? 'RUBBLE_PILE' as const :
      porosity > 0.5 ? 'RUBBLE_PILE' as const : porosity > 0.27 ? 'FRACTURED' as const : 'COHERENT' as const,
    iceFraction01: ice, dustFraction01: 1 - ice,
    volatileRichnessIndex01: kind === 'COMET' ? 0.65 + 0.32 * phase : 0.15 + 0.4 * ice,
    source: 'V2_4_3_DETERMINISTIC_RESIDUAL_FORMATION' as const,
  });
}

/** Same inclination laws as V1 cometOrbitV1: short-period objects span 0–85°
 * with a power-law draw; long-period ones are isotropic, 0–180°. The S-type
 * stability boundary still limits orbital period independently for each host. */
function v1CometInclination(periodYears: number, sample: number): number {
  return periodYears < 200
    ? 85 * sample ** 1.6
    : Math.acos(1 - 2 * sample) * 180 / Math.PI;
}
