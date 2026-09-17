import {
  type MultihostCandidateOrbit,
  type MultihostOrbitalHostId,
  type MultihostPlanetaryCatalog,
  type MultihostStableWindow,
} from '../../domain/planetary/multihost-planetary-catalog';

/** Physical inputs are frozen phase-16 masses and hierarchy, not renderer sizes. */
export interface MultihostStellarInput {
  readonly seed: string;
  readonly massA: number;
  readonly massB: number | null;
  readonly massC: number | null;
  readonly radiusAAu: number;
  readonly radiusBAu: number | null;
  readonly radiusCAu: number | null;
  readonly innerBinaryAxisAu: number | null;
  readonly innerBinaryEccentricity: number | null;
  readonly outerBinaryAxisAu: number | null;
  readonly outerBinaryEccentricity: number | null;
  readonly frozenPAbInnerAu: number | null;
  readonly frozenPAbOuterAu: number | null;
  /** Reference *sampling* extent only; NEVER a claimed stability cutoff. */
  readonly samplingOuterAu: number;
}

const DAYS_PER_YEAR = 365.25;
const MIN_SPAN_RATIO = 1.55;
const STELLAR_SURFACE_MARGIN = 3;
const STABILITY_MARGIN = 1.12;
const MAX_CANDIDATES_PER_HOST = 3;

/**
 * Holman & Wiegert (1999) coplanar empirical test-particle fits, restricted to
 * their broad calibrated domain. These are approximate, not an N-body proof.
 * For an S orbit, mu = companion / (host + companion). For P, mu is the
 * less massive component / total. Application is limited to e <= 0.8.
 */
export function criticalSTypeOuterAu(
  binaryAxisAu: number,
  binaryEccentricity: number,
  hostMass: number,
  companionMass: number,
): number {
  assertBinary(binaryAxisAu, binaryEccentricity, hostMass, companionMass);
  const mu = companionMass / (hostMass + companionMass);
  return binaryAxisAu * (
    0.464 - 0.380 * mu - 0.631 * binaryEccentricity +
    0.586 * mu * binaryEccentricity +
    0.150 * binaryEccentricity ** 2 -
    0.198 * mu * binaryEccentricity ** 2
  );
}

export function criticalPTypeInnerAu(
  binaryAxisAu: number,
  binaryEccentricity: number,
  firstMass: number,
  secondMass: number,
): number {
  assertBinary(binaryAxisAu, binaryEccentricity, firstMass, secondMass);
  const mu = Math.min(firstMass, secondMass) / (firstMass + secondMass);
  return binaryAxisAu * (
    1.60 + 5.10 * binaryEccentricity -
    2.22 * binaryEccentricity ** 2 + 4.12 * mu -
    4.27 * binaryEccentricity * mu - 5.09 * mu ** 2 +
    4.61 * binaryEccentricity ** 2 * mu ** 2
  );
}

/**
 * Generates deterministic, physically bounded *laboratory candidates* for
 * all available hosts. It intentionally does not change V1 planet identities,
 * assume disks around B/C, invent climate, or persist experimental candidates.
 * Future V2 production generation must supply independent per-host disks and
 * a new GeneratorVersion before converting candidates into real planets.
 */
export function generateMultihostPlanetaryCatalog(
  input: MultihostStellarInput,
): MultihostPlanetaryCatalog {
  if (!/^[0-9a-fA-F]{32}$/.test(input.seed)) {
    throw new RangeError('Multihost candidates require a normalized 128-bit SystemSeed.');
  }
  positive(input.massA, 'massA');
  positive(input.radiusAAu, 'radiusAAu');
  positive(input.samplingOuterAu, 'samplingOuterAu');
  const multiple = input.massB !== null;
  if (multiple !== (input.innerBinaryAxisAu !== null && input.innerBinaryEccentricity !== null)) {
    throw new RangeError('A+B masses and inner orbit must be present together.');
  }
  if ((input.massC !== null) !== (input.outerBinaryAxisAu !== null && input.outerBinaryEccentricity !== null)) {
    throw new RangeError('C mass and outer orbit must be present together.');
  }
  if (input.massC !== null && input.massB === null) {
    throw new RangeError('The V2 triple hierarchy requires inner A+B.');
  }

  const windows: MultihostStableWindow[] = [];
  const limitations = [
    'Candidatos de laboratorio: sin planetas definitivos, discos independientes de B/C, clima ni Ground Truth V2.',
    'Límites coplanares aproximados; no sustituyen integraciones gravitatorias a largo plazo.',
  ];
  const push = (
    hostId: MultihostOrbitalHostId,
    family: 'S_TYPE' | 'P_TYPE',
    mass: number,
    inner: number,
    outer: number | null,
    note: string,
  ) => {
    const safeInner = Number.isFinite(inner) && inner > 0 ? inner : Number.POSITIVE_INFINITY;
    const safeOuter = outer === null ? null : Math.max(0, outer);
    const samplingOuter = input.samplingOuterAu;
    const referenceOuterAu = safeOuter === null
      ? samplingOuter
      : Math.min(safeOuter, samplingOuter);
    windows.push(Object.freeze({
      hostId, family, gravitatingMassSolar: mass,
      innerStableAu: safeInner,
      outerStableAu: safeOuter,
      referenceOuterAu,
      usable: Number.isFinite(safeInner) &&
        referenceOuterAu / safeInner >= MIN_SPAN_RATIO,
      limitation: note,
    }));
  };

  const massB = input.massB;
  if (massB === null) {
    push('A', 'S_TYPE', input.massA,
      input.radiusAAu * STELLAR_SURFACE_MARGIN,
      null, 'Estrella única: límite exterior del muestreo no equivale a estabilidad infinita.');
  } else {
    const axis = input.innerBinaryAxisAu!;
    const e = input.innerBinaryEccentricity!;
    positive(input.radiusBAu, 'radiusBAu');
    const abMass = input.massA + massB;
    const outerC = input.massC === null ? null :
      criticalSTypeOuterAu(input.outerBinaryAxisAu!, input.outerBinaryEccentricity!,
        abMass, input.massC) / STABILITY_MARGIN;
    // The individual-star annuli are constrained by the other inner star.
    push('A', 'S_TYPE', input.massA,
      input.radiusAAu * STELLAR_SURFACE_MARGIN,
      Math.min(criticalSTypeOuterAu(axis, e, input.massA, massB) / STABILITY_MARGIN,
        outerC ?? Number.POSITIVE_INFINITY), 'S-A perturbada por B y, en triples, por C.');
    push('B', 'S_TYPE', massB,
      input.radiusBAu! * STELLAR_SURFACE_MARGIN,
      Math.min(criticalSTypeOuterAu(axis, e, massB, input.massA) / STABILITY_MARGIN,
        outerC ?? Number.POSITIVE_INFINITY), 'S-B perturbada por A y, en triples, por C.');
    const frozenInner = input.frozenPAbInnerAu;
    const criticalInner = criticalPTypeInnerAu(axis, e, input.massA, massB) * STABILITY_MARGIN;
    const inner = Math.max(criticalInner, frozenInner ?? 0);
    const outer = Math.min(input.frozenPAbOuterAu ?? Number.POSITIVE_INFINITY,
      outerC ?? Number.POSITIVE_INFINITY);
    push('AB', 'P_TYPE', abMass, inner,
      Number.isFinite(outer) ? outer : null,
      'P-AB: se intersecta el umbral analítico con los límites congelados de fase 16.5.');
    if (input.massC !== null) {
      positive(input.radiusCAu, 'radiusCAu');
      const outerAxis = input.outerBinaryAxisAu!;
      const outerE = input.outerBinaryEccentricity!;
      push('C', 'S_TYPE', input.massC,
        input.radiusCAu! * STELLAR_SURFACE_MARGIN,
        criticalSTypeOuterAu(outerAxis, outerE, input.massC, abMass) / STABILITY_MARGIN,
        'S-C: masa del par interior aproximada por su baricentro.');
      push('ABC', 'P_TYPE', abMass + input.massC,
        criticalPTypeInnerAu(outerAxis, outerE, abMass, input.massC) * STABILITY_MARGIN,
        null, 'P-ABC: par interior tratado como cuerpo efectivo; estabilidad secular sin verificar.');
    }
  }

  const candidates: MultihostCandidateOrbit[] = [];
  for (const window of windows) {
    if (!window.usable) continue;
    const roll = uniform01(input.seed, window.hostId, 0);
    // A candidate is not guaranteed just because the annulus is dynamically open.
    const occupancy = Math.min(0.74, 0.26 + 0.12 * Math.log2(
      window.referenceOuterAu / window.innerStableAu));
    if (roll > occupancy) continue;
    const count = Math.min(MAX_CANDIDATES_PER_HOST,
      1 + Math.floor(uniform01(input.seed, window.hostId, 1) * 3));
    const lo = window.innerStableAu * 1.10;
    const hi = window.referenceOuterAu / 1.10;
    if (!(hi > lo * 1.18)) continue;
    for (let ordinal = 1; ordinal <= count; ordinal++) {
      const fraction = (ordinal - 0.5) / count;
      const a = Math.exp(Math.log(lo) + fraction * (Math.log(hi) - Math.log(lo)));
      const leftNeighbour = ordinal === 1 ? lo : Math.exp(Math.log(lo) +
        ((ordinal - 1.5) / count) * (Math.log(hi) - Math.log(lo)));
      const rightNeighbour = ordinal === count ? hi : Math.exp(Math.log(lo) +
        ((ordinal + 0.5) / count) * (Math.log(hi) - Math.log(lo)));
      const maxE = Math.min(0.16, (a - leftNeighbour) / (3.0 * a),
        (rightNeighbour - a) / (3.0 * a),
        1 - window.innerStableAu / a,
        window.referenceOuterAu / a - 1);
      const eccentricity = Math.max(0, maxE) * uniform01(input.seed, window.hostId, ordinal + 10);
      const periapsisAu = a * (1 - eccentricity);
      const apoapsisAu = a * (1 + eccentricity);
      if (periapsisAu <= window.innerStableAu || apoapsisAu >= window.referenceOuterAu) continue;
      candidates.push(Object.freeze({
        id: `preview-${window.hostId}-${ordinal}`,
        hostId: window.hostId,
        family: window.family,
        ordinal,
        semiMajorAxisAu: a,
        eccentricity,
        periapsisAu,
        apoapsisAu,
        periodDays: DAYS_PER_YEAR * Math.sqrt(a ** 3 / window.gravitatingMassSolar),
        inclinationDegrees: uniform01(input.seed, window.hostId, ordinal + 30) * 4,
        rotationDegrees: uniform01(input.seed, window.hostId, ordinal + 40) * 360,
        epochMeanAnomalyDegrees: uniform01(input.seed, window.hostId, ordinal + 50) * 360,
        experimental: true,
      }));
    }
  }
  return Object.freeze({
    version: 'V2_EXPERIMENTAL' as const,
    sourceSystemSeed: input.seed,
    windows: Object.freeze(windows),
    candidates: Object.freeze(candidates),
    limitations: Object.freeze(limitations),
  });
}

function assertBinary(a: number, e: number, m1: number, m2: number): void {
  positive(a, 'binaryAxisAu');
  positive(m1, 'firstMass');
  positive(m2, 'secondMass');
  if (!Number.isFinite(e) || e < 0 || e > 0.8) {
    throw new RangeError('The empirical stability fits support eccentricity in [0, 0.8].');
  }
}
function positive(value: number | null, name: string): asserts value is number {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be finite and positive.`);
  }
}
/** Independent, draw-order-free deterministic laboratory stream. */
function uniform01(seed: string, host: string, ordinal: number): number {
  let state = 2166136261;
  const text = `${seed}:${host}:${ordinal}:GENESIS-MULTIHOST-V2`;
  for (let i = 0; i < text.length; i++) {
    state = Math.imul(state ^ text.charCodeAt(i), 16777619);
  }
  state ^= state >>> 16;
  state = Math.imul(state, 0x7feb352d);
  state ^= state >>> 15;
  state = Math.imul(state, 0x846ca68b);
  state ^= state >>> 16;
  return (state >>> 0) / 4294967296;
}
