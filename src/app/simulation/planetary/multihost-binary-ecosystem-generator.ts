import { type MultihostFormedPlanetarySystemV22, type MultihostFormedPlanetV22 } from '../../domain/planetary/multihost-formed-planetary-system';

export type BinaryVisualPlanetKindV23 =
  'ROCKY' | 'DESERT' | 'OCEAN' | 'VOLCANIC' | 'ICE' | 'GAS_GIANT' | 'ICE_GIANT';
export type BinaryStellarHostV23 = 'A' | 'B';

export interface BinaryPlanetAppearanceV23 {
  readonly planetId: string;
  readonly hostId: BinaryStellarHostV23;
  readonly visualKind: BinaryVisualPlanetKindV23;
  readonly incidentFluxReferenceEarth: number | null;
  readonly tentativeMoonCount: number;
  readonly colorHex: string;
}
export interface BinaryMinorBodyV23 {
  readonly id: string;
  readonly hostId: BinaryStellarHostV23;
  readonly kind: 'ASTEROID' | 'COMET';
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly periodDays: number;
  readonly rotationDegrees: number;
  readonly inclinationDegrees: number;
  readonly epochMeanAnomalyDegrees: number;
  readonly diameterKilometers: number;
  readonly composition: 'CARBONACEOUS' | 'SILICACEOUS' | 'METALLIC' | 'ICE_RICH';
}
export interface BinaryAsteroidBeltV23 {
  readonly id: string;
  readonly hostId: BinaryStellarHostV23;
  readonly innerEdgeAu: number;
  readonly outerEdgeAu: number;
  readonly peakAu: number;
  readonly populationIndex01: number;
}
export interface BinaryEcosystemV23 {
  readonly version: 'V2_3_EXPERIMENTAL_ECOSYSTEM';
  /** Independent V2 seeds; these are NOT V1 planet/moon/asteroid/comet Ground Truth. */
  readonly planets: readonly BinaryPlanetAppearanceV23[];
  readonly minorBodies: readonly BinaryMinorBodyV23[];
  readonly belts: readonly BinaryAsteroidBeltV23[];
  readonly limitations: readonly string[];
}

/**
 * Deterministic and read-only experimental BINARY presentation. Physical masses,
 * periods and host windows come from formed V2.2, not copies of V1 bodies. V1
 * surface/ring/asteroid/comet render algorithms are reused downstream; styles,
 * moons and small-body inventory remain non-authoritative until V2 generators
 * for environment, satellite formation and debris are integrated.
 */
export function generateBinaryEcosystemV23(
  formed: MultihostFormedPlanetarySystemV22,
  luminosities: Readonly<{A: number | null | undefined; B: number | null | undefined}>,
): BinaryEcosystemV23 {
  const planets: BinaryPlanetAppearanceV23[] = [];
  const minorBodies: BinaryMinorBodyV23[] = [];
  const belts: BinaryAsteroidBeltV23[] = [];
  for (const host of ['A', 'B'] as const) {
    const disk = formed.disks.find(item => item.hostId === host);
    if (disk === undefined || !disk.window.usable ||
        !(disk.window.innerStableAu > 0)) continue;
    const starLuminosity = luminosities[host];
    for (const planet of disk.planets) {
      const flux = starLuminosity !== null && starLuminosity !== undefined &&
        Number.isFinite(starLuminosity) && starLuminosity > 0
        ? starLuminosity / planet.semiMajorAxisAu ** 2 : null;
      const visualKind = classifyPlanet(formed.sourceSystemSeed, planet, flux);
      const rollMoon = unit(formed.sourceSystemSeed, host, `moons:${planet.id}`);
      const moonCount = planet.bulkType === 'GAS_ENVELOPE'
        ? 1 + Math.floor(rollMoon * 3)
        : planet.massEarth >= 0.5 && rollMoon > 0.38
          ? 1 + Number(rollMoon > 0.84) : 0;
      planets.push(Object.freeze({
        planetId: planet.id, hostId: host, visualKind,
        incidentFluxReferenceEarth: flux,
        tentativeMoonCount: moonCount,
        colorHex: PLANET_PALETTE[visualKind],
      }));
    }

    const outer = Math.min(disk.window.referenceOuterAu,
      disk.window.outerStableAu ?? disk.window.referenceOuterAu);
    const inner = disk.window.innerStableAu;
    if (!(outer > inner * 1.6 && disk.remainingSolidsEarth > 0)) continue;
    // Pick the largest genuinely unoccupied annulus (including edges), in AU.
    const sorted = [...disk.planets].sort((a, b) => a.periapsisAu - b.periapsisAu);
    const gaps: {lo: number; hi: number}[] = [];
    let previous = inner;
    for (const planet of sorted) {
      if (planet.periapsisAu > previous) gaps.push({lo: previous, hi: planet.periapsisAu});
      previous = Math.max(previous, planet.apoapsisAu);
    }
    if (outer > previous) gaps.push({lo: previous, hi: outer});
    const candidates = gaps.filter(gap => gap.hi > gap.lo * 1.35);
    const gap = candidates.sort((a, b) =>
      (b.hi / b.lo) - (a.hi / a.lo))[0];
    if (gap === undefined) continue;
    const beltProbability = unit(formed.sourceSystemSeed, host, 'belt');
    const hasBelt = beltProbability > 0.16;
    const beltInner = gap.lo * 1.09;
    const beltOuter = gap.hi / 1.09;
    if (hasBelt && beltOuter > beltInner * 1.08) {
      const peak = Math.sqrt(beltInner * beltOuter);
      belts.push(Object.freeze({
        id: `v23-${formed.sourceSystemSeed}-${host}-belt`, hostId: host,
        innerEdgeAu: beltInner, outerEdgeAu: beltOuter, peakAu: peak,
        populationIndex01: 0.18 + 0.68 * beltProbability,
      }));
      const count = 1 + Math.floor(3 * unit(formed.sourceSystemSeed, host, 'asteroid-count'));
      for (let i = 0; i < count; i++) {
        const fraction = (i + 0.5) / count;
        const axis = beltInner * Math.pow(beltOuter / beltInner, fraction);
        const e = Math.min(0.08, 0.35 * (axis - beltInner) / axis,
          0.35 * (beltOuter - axis) / axis) * unit(formed.sourceSystemSeed, host, `ast-e:${i}`);
        minorBodies.push(makeMinor(formed.sourceSystemSeed, host, disk.window.gravitatingMassSolar,
          'ASTEROID', i, axis, e));
      }
    }
    // A comet may be absent in compact windows. Its periapsis/apoapsis must
    // both remain inside the host's S-type stability approximation.
    const cometProbability = unit(formed.sourceSystemSeed, host, 'comet');
    if (outer > inner * 3 && cometProbability > 0.24) {
      const count = cometProbability > 0.78 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const peri = inner * (1.18 + 0.14 * i);
        const apo = outer * (0.72 + 0.08 * i);
        if (!(apo > peri * 1.5 && apo < outer)) continue;
        const axis = (peri + apo) / 2;
        minorBodies.push(makeMinor(formed.sourceSystemSeed, host, disk.window.gravitatingMassSolar,
          'COMET', i, axis, (apo - peri) / (apo + peri)));
      }
    }
  }
  return Object.freeze({
    version: 'V2_3_EXPERIMENTAL_ECOSYSTEM' as const,
    planets: Object.freeze(planets), minorBodies: Object.freeze(minorBodies),
    belts: Object.freeze(belts),
    limitations: Object.freeze([
      'Los planetas y sus órbitas físicas proceden de V2.2; colores y clases de superficie son escenarios visuales V2.3, no océanos/atmósferas confirmados.',
      'Lunas, asteroides, cometas y cinturones son inventario de laboratorio V2.3, no objetos formados por los motores científicos V1 ni persistibles.',
      'Las ventanas S-type son aproximadas; no se modelan perturbaciones seculares ni irradiación variable de la estrella compañera.',
    ]),
  });
}

const PLANET_PALETTE: Readonly<Record<BinaryVisualPlanetKindV23, string>> = Object.freeze({
  ROCKY: '#9C8D81', DESERT: '#CAA17A', OCEAN: '#528BB5',
  VOLCANIC: '#AF5D39', ICE: '#B1D8E9', GAS_GIANT: '#D9B48B', ICE_GIANT: '#7CA7C4',
});

function classifyPlanet(seed: string, planet: MultihostFormedPlanetV22,
  flux: number | null): BinaryVisualPlanetKindV23 {
  const roll = unit(seed, planet.hostId, `planet-style:${planet.id}`);
  if (planet.bulkType === 'GAS_ENVELOPE') return planet.semiMajorAxisAu > 3 || roll > 0.78
    ? 'ICE_GIANT' : 'GAS_GIANT';
  if (planet.bulkType === 'ICY' || (flux !== null && flux < 0.18)) return 'ICE';
  if (flux !== null && flux > 2.1) return roll > 0.78 ? 'VOLCANIC' : roll > 0.25 ? 'DESERT' : 'ROCKY';
  if (flux !== null && flux >= 0.45 && flux <= 1.55 && roll > 0.53)
    return 'OCEAN'; // appearance hypothesis, NOT a water inventory prediction
  return roll > 0.75 ? 'DESERT' : roll < 0.09 ? 'VOLCANIC' : 'ROCKY';
}

function makeMinor(seed: string, host: BinaryStellarHostV23, massSolar: number,
  kind: BinaryMinorBodyV23['kind'], ordinal: number, axis: number,
  eccentricity: number): BinaryMinorBodyV23 {
  const key = `${kind}:${ordinal}`;
  const e = Math.max(0, Math.min(0.89, eccentricity));
  const compositionRoll = unit(seed, host, `${key}:composition`);
  const composition = kind === 'COMET' || compositionRoll > 0.86 ? 'ICE_RICH' :
    compositionRoll < 0.36 ? 'CARBONACEOUS' :
      compositionRoll < 0.77 ? 'SILICACEOUS' : 'METALLIC';
  return Object.freeze({
    id: `v23-${seed}-${host}-${kind.toLowerCase()}-${ordinal + 1}`,
    hostId: host, kind, semiMajorAxisAu: axis, eccentricity: e,
    periapsisAu: axis * (1 - e), apoapsisAu: axis * (1 + e),
    periodDays: 365.25 * Math.sqrt(axis ** 3 / massSolar),
    rotationDegrees: 360 * unit(seed, host, `${key}:node`),
    inclinationDegrees: 12 * unit(seed, host, `${key}:inclination`),
    epochMeanAnomalyDegrees: 360 * unit(seed, host, `${key}:phase`),
    diameterKilometers: kind === 'COMET' ? 2 + 16 * unit(seed, host, `${key}:size`) :
      8 + 160 * unit(seed, host, `${key}:size`),
    composition,
  });
}
function unit(seed: string, host: string, domain: string): number {
  let value = 0x811c9dc5;
  for (const char of `GENESIS:V2.3:${seed}:${host}:${domain}`)
    value = Math.imul(value ^ char.charCodeAt(0), 0x01000193);
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) / 0x1_0000_0000;
}
