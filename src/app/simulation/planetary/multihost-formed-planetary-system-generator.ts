import {
  type MultihostOrbitalHostId,
  type MultihostStableWindow,
} from '../../domain/planetary/multihost-planetary-catalog';
import {
  type MultihostFormedPlanetarySystemV22,
  type MultihostFormationDiskV22,
  type MultihostFormedPlanetV22,
} from '../../domain/planetary/multihost-formed-planetary-system';

export interface MultihostFormationInputV22 {
  readonly systemSeed: string;
  /** Only V2.1 host *windows* are read. Its test particles are never consulted. */
  readonly windows: readonly MultihostStableWindow[];
  /** Real metallicity may be supplied when V2's per-host formation handoff exists. */
  readonly metallicitySolarRatio?: number;
  /** V2.4 lab-only: measured/reference luminosity for each S-type snow line.
   * Omission preserves frozen historical V2.2 generation bit for bit. */
  readonly hostLuminositiesSolarV241?: Readonly<Partial<Record<'A' | 'B', number>>>;
}

const EARTH_PER_SOLAR_MASS = 332_946.0487;
const YEAR_DAYS = 365.25;
const HOST_ORDER: readonly MultihostOrbitalHostId[] = ['A', 'B', 'C', 'AB', 'ABC'];
const MAX_PLANETS_PER_HOST = 12;
const EPSILON = 1e-10;

/**
 * V2.2 host-local formation prototype. Unlike the V2 test-particle catalogue,
 * this derives a separate disk and solid/gas inventory for every admissible
 * stellar host; yields independently seeded formed planet identities, physical
 * masses and orbits. Disk parameters are an explicit V2.2 approximation, not
 * phase-17 V1 disks reused five times. No V1 generator outputs are modified.
 */
export function generateMultihostFormedPlanetarySystemV22(
  input: MultihostFormationInputV22,
): MultihostFormedPlanetarySystemV22 {
  const seed = input.systemSeed.toUpperCase();
  if (!/^[0-9A-F]{32}$/.test(seed)) {
    throw new RangeError('V2.2 requires a normalized 128-bit SystemSeed.');
  }
  const metallicity = input.metallicitySolarRatio ?? 1;
  if (!Number.isFinite(metallicity) || metallicity < 0 || metallicity > 5) {
    throw new RangeError('V2.2 requires metallicity in [0,5] solar.');
  }
  const ids = new Set<MultihostOrbitalHostId>();
  for (const window of input.windows) {
    if (!HOST_ORDER.includes(window.hostId) || ids.has(window.hostId) ||
        window.family !== (window.hostId.length === 1 ? 'S_TYPE' : 'P_TYPE') ||
        !finitePositive(window.gravitatingMassSolar) ||
        !finitePositive(window.innerStableAu) ||
        (!Number.isFinite(window.referenceOuterAu) || window.referenceOuterAu < 0) ||
        (window.outerStableAu !== null &&
          (!Number.isFinite(window.outerStableAu) || window.outerStableAu < 0))) {
      throw new RangeError(`Invalid or duplicate V2.2 host window: ${window.hostId}.`);
    }
    ids.add(window.hostId);
  }
  if (!ids.has('A')) throw new RangeError('V2.2 requires stellar component A.');

  const disks: MultihostFormationDiskV22[] = [];
  for (const hostId of HOST_ORDER) {
    const window = input.windows.find(item => item.hostId === hostId);
    if (window === undefined) continue;
    const luminosity = (hostId === 'A' || hostId === 'B')
      ? input.hostLuminositiesSolarV241?.[hostId] : undefined;
    if (luminosity !== undefined && !(Number.isFinite(luminosity) && luminosity > 0)) {
      throw new RangeError(`Invalid V2.4 host luminosity: ${hostId}.`);
    }
    disks.push(formDisk(seed, window, metallicity, luminosity));
  }
  const planets = Object.freeze(disks.flatMap(disk => disk.planets));
  if (new Set(planets.map(planet => planet.id)).size !== planets.length ||
      new Set(planets.map(planet => planet.formationSeedHex)).size !== planets.length) {
    throw new RangeError('V2.2 planet identities must be unique across all hosts.');
  }
  return Object.freeze({
    version: 'V2_2_FORMATION_V1' as const,
    sourceSystemSeed: seed,
    disks: Object.freeze(disks),
    planets,
    limitations: Object.freeze([
      'V2.2: formación aproximada por disco/anfitrión; las ventanas S/P no sustituyen estabilidad secular N-body.',
      'Discos V2.2 sintéticos e independientes: pendientes de conexión con los discos físicos históricos y la metalicidad del sector.',
      'Masa, composición gruesa y órbitas V2.2 generadas; física detallada, lunas, HZ, fichas y BodyLocator V2 aún no integrados.',
      'Solo laboratorio: NO sustituye PlanetarySystem V1, NO modifica saves ni activa GeneratorVersion V2.',
    ]),
  });
}

function formDisk(
  systemSeed: string,
  window: MultihostStableWindow,
  metallicity: number,
  luminositySolarV241?: number,
): MultihostFormationDiskV22 {
  const { hostId, gravitatingMassSolar: hostMass } = window;
  // Independently seeded hypothetical disks: distinguish stellar circumstellar
  // environments from circumbinary material WITHOUT double-spending a V1 disk.
  const massFraction = 0.010 + 0.064 * roll(systemSeed, hostId, 'disk', 0);
  const diskMassEarth = hostMass * EARTH_PER_SOLAR_MASS * massFraction;
  const solidsFraction = Math.min(0.07, 0.022 * metallicity);
  const initialSolidsEarth = diskMassEarth * solidsFraction;
  const initialGasEarth = diskMassEarth - initialSolidsEarth;
  const outer = window.outerStableAu === null ? window.referenceOuterAu :
    Math.min(window.referenceOuterAu, window.outerStableAu);
  const ratio = outer / window.innerStableAu;
  const viable = window.usable && Number.isFinite(ratio) && ratio >= 1.55;
  const formed: MultihostFormedPlanetV22[] = [];
  // A dynamically open annulus does not guarantee a disk or any planet.
  const diskForms = viable && roll(systemSeed, hostId, 'formation', 0) <
    Math.min(0.95, 0.38 + 0.11 * Math.log2(ratio) + 0.06 * metallicity);
  if (diskForms && metallicity > 0) {
    const lo = window.innerStableAu * 1.065;
    const hi = outer / 1.065;
    const logSpan = Math.log(hi / lo);
    if (logSpan > Math.log(1.25)) {
      const expected = Math.min(MAX_PLANETS_PER_HOST,
        Math.max(1, Math.floor(0.75 + 1.85 * logSpan +
          2.3 * roll(systemSeed, hostId, 'population', 0))));
      // A single allocation of the disk's accretable solid reservoir; host
      // populations are not copied/multiplied from V1 or QA candidates.
      const totalAccretableSolids = initialSolidsEarth *
        (0.045 + 0.23 * roll(systemSeed, hostId, 'efficiency', 0));
      const snowLineAu = 2.7 * Math.sqrt(luminositySolarV241 ?? hostMass);
      const coldFormationCapacity = hi > snowLineAu * 1.05;
      const warmEnvelopeCapacity = expected >= 4 && ratio >= 2.0 && totalAccretableSolids >= 1.8;
      const hostEnvelopeGate = roll(systemSeed, hostId, 'envelope-population', 0);
      const targetEnvelopeWorlds = coldFormationCapacity && totalAccretableSolids >= 3.2
        ? totalAccretableSolids >= 12 && expected >= 7 && ratio >= 5
          ? 2
          : 1
        : warmEnvelopeCapacity && hostEnvelopeGate < 0.68
          ? 1
          : 0;
      const weights = Array.from({length: expected}, (_, ordinal) => {
        const outerBias = 1 + 0.55 * ((ordinal + 1) / expected);
        return (0.30 + 1.6 * roll(systemSeed, hostId, 'mass-weight', ordinal)) * outerBias;
      });
      const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
      let previousApoapsis = window.innerStableAu;
      let remainingGasBudget = initialGasEarth;
      let formedEnvelopeWorlds = 0;
      for (let ordinal = 0; ordinal < expected; ordinal++) {
        const fraction = (ordinal + 0.5 +
          0.28 * (roll(systemSeed, hostId, 'location', ordinal) - 0.5)) / expected;
        const semiMajorAxisAu = Math.exp(Math.log(lo) + fraction * logSpan);
        const rightBoundary = ordinal === expected - 1 ? outer :
          Math.exp(Math.log(lo) + ((ordinal + 1) / expected) * logSpan);
        const eCap = Math.max(0, Math.min(0.21,
          (semiMajorAxisAu - previousApoapsis) / (3 * semiMajorAxisAu),
          (rightBoundary - semiMajorAxisAu) / (3 * semiMajorAxisAu),
          1 - window.innerStableAu / semiMajorAxisAu,
          outer / semiMajorAxisAu - 1));
        const eccentricity = eCap * roll(systemSeed, hostId, 'eccentricity', ordinal);
        const periapsisAu = semiMajorAxisAu * (1 - eccentricity);
        const apoapsisAu = semiMajorAxisAu * (1 + eccentricity);
        // Do not force candidates into closed or crossing orbits.
        if (periapsisAu <= previousApoapsis + EPSILON ||
            periapsisAu <= window.innerStableAu || apoapsisAu >= outer) continue;
        const coreMassEarth = totalAccretableSolids * weights[ordinal]! / weightSum;
        const beyondSnowLine = semiMajorAxisAu > snowLineAu;
        const remainingCandidates = expected - ordinal;
        const remainingTargets = targetEnvelopeWorlds - formedEnvelopeWorlds;
        const reserveEnvelopeWorld = remainingTargets > 0 &&
          remainingCandidates <= remainingTargets + 2;
        const envelopeCandidateCoreFloor = beyondSnowLine ? 1.6 : 1.05;
        const probabilisticEnvelopeWorld = remainingTargets > 0 &&
          coreMassEarth >= envelopeCandidateCoreFloor &&
          roll(systemSeed, hostId, 'giant-preference', ordinal) > (beyondSnowLine ? 0.24 : 0.46);
        const targetEnvelopeWorld = remainingTargets > 0 &&
          coreMassEarth >= envelopeCandidateCoreFloor &&
          (reserveEnvelopeWorld || probabilisticEnvelopeWorld);
        const spontaneousEnvelopeWorld = beyondSnowLine
          ? coreMassEarth >= 4.2 && roll(systemSeed, hostId, 'gas-giant', ordinal) > 0.34
          : coreMassEarth >= 15 && roll(systemSeed, hostId, 'gas-giant', ordinal) > 0.96;
        const gasPotential = targetEnvelopeWorld || spontaneousEnvelopeWorld;
        const remainingGasCeiling = Math.max(0, remainingGasBudget / Math.max(1, expected - formed.length));
        const envelopeRoll = roll(systemSeed, hostId, 'envelope', ordinal);
        // A hot giant cannot be created by assigning gas to a tiny warm core.
        // A migration scenario needs a *real* exterior formation radius inside
        // this SAME host's stable/disk annulus, plus a sufficiently massive core.
        // The path is a hypothesis only; no N-body migration is simulated.
        const birthAxisCandidate = Math.min(outer / 1.065, Math.max(
          snowLineAu * 1.12, semiMajorAxisAu * 1.50,
        ));
        const migrationAvailable = luminositySolarV241 !== undefined &&
          window.family === 'S_TYPE' && !beyondSnowLine &&
          coreMassEarth >= 3.2 &&
          birthAxisCandidate > Math.max(semiMajorAxisAu * 1.2, snowLineAu) &&
          birthAxisCandidate < outer && birthAxisCandidate > window.innerStableAu;
        const canAccreteGiantGas = beyondSnowLine || migrationAvailable;
        const envelopeMassEarth = gasPotential
          ? Math.min(
              remainingGasCeiling,
              beyondSnowLine
                ? coreMassEarth * (0.45 + 8.5 * envelopeRoll)
                : migrationAvailable
                  ? coreMassEarth * (0.45 + 7 * envelopeRoll)
                  : coreMassEarth * (0.07 + (luminositySolarV241 === undefined ? 0.72 : 0.22) * envelopeRoll),
            )
          : beyondSnowLine && coreMassEarth >= 1.8 && envelopeRoll > 0.72
            ? Math.min(remainingGasCeiling * 0.45, coreMassEarth * (0.025 + 0.22 * envelopeRoll))
            : Math.min(remainingGasCeiling * 0.06, coreMassEarth * 0.006 * envelopeRoll);
        // A warm mini-Neptune may accrete a modest atmosphere in situ; a gas
        // giant may only use the gas reservoir after a viable cold birth site.
        const cappedEnvelope = !canAccreteGiantGas && luminositySolarV241 !== undefined
          ? Math.min(envelopeMassEarth, coreMassEarth * 0.24)
          : envelopeMassEarth;
        const massEarth = coreMassEarth + cappedEnvelope;
        const envelopeFraction = massEarth > 0 ? cappedEnvelope / massEarth : 0;
        const icy = beyondSnowLine && roll(systemSeed, hostId, 'composition', ordinal) > 0.22;
        const bulkType = envelopeFraction >= 0.03 ? 'GAS_ENVELOPE' as const :
          icy ? 'ICY' as const : 'ROCKY' as const;
        const radiusEarth = bulkType === 'GAS_ENVELOPE'
          ? envelopeFraction < 0.20 || massEarth < 8
            ? Math.min(4.2, Math.max(1.65, 1.35 + 0.72 * Math.log10(1 + massEarth) + 2.4 * envelopeFraction))
            : Math.min(11.5, 3.7 + 1.65 * Math.log10(1 + massEarth) + 1.2 * envelopeFraction)
          : Math.max(0.15, Math.pow(massEarth, 0.27) * (icy ? 1.18 : 1));
        const n = ordinal + 1;
        const identity = `${hostId}-${n.toString().padStart(2, '0')}`;
        formed.push(Object.freeze({
          id: `v22-${systemSeed}-${identity}`,
          formationSeedHex: hex128(systemSeed, hostId, n),
          origin: 'V2_2_FORMED' as const,
          hostId, family: window.family, ordinal: n,
          designation: `${hostId} · ${String.fromCharCode(98 + ordinal)}`,
          gravitatingMassSolar: hostMass,
          semiMajorAxisAu, eccentricity, periapsisAu, apoapsisAu,
          periodDays: YEAR_DAYS * Math.sqrt(semiMajorAxisAu ** 3 / hostMass),
          inclinationDegrees: roll(systemSeed, hostId, 'inclination', ordinal) * 4,
          rotationDegrees: roll(systemSeed, hostId, 'node', ordinal) * 360,
          epochMeanAnomalyDegrees: roll(systemSeed, hostId, 'phase', ordinal) * 360,
          coreMassEarth, envelopeMassEarth: cappedEnvelope, massEarth, radiusEarth, bulkType,
          ...(luminositySolarV241 === undefined || window.family !== 'S_TYPE' ? {} : {
            formationPathV241: Object.freeze({
              regime: migrationAvailable && cappedEnvelope / massEarth >= 0.24
                ? 'MIGRATION_SCENARIO' as const : 'IN_SITU' as const,
              estimatedBirthAxisAu: migrationAvailable && cappedEnvelope / massEarth >= 0.24
                ? birthAxisCandidate : semiMajorAxisAu,
              sourceSnowLineAu: snowLineAu,
              explanation: migrationAvailable && cappedEnvelope / massEarth >= 0.24
                ? 'Escenario de formación fría en este disco y migración hacia dentro; trayectoria no simulada.'
                : 'Acreción local; envoltura de gas templada limitada sin origen migratorio demostrado.',
            }),
          }),
          rotationPeriodHours: 8 + 52 * roll(systemSeed, hostId, 'spin', ordinal),
        }));
        if (bulkType === 'GAS_ENVELOPE') formedEnvelopeWorlds += 1;
        remainingGasBudget = Math.max(0, remainingGasBudget - cappedEnvelope);
        previousApoapsis = apoapsisAu;
      }
    }
  }
  const accretedSolidsEarth = formed.reduce((sum, p) => sum + p.coreMassEarth, 0);
  const accretedGasEarth = formed.reduce((sum, p) => sum + p.envelopeMassEarth, 0);
  if (accretedSolidsEarth > initialSolidsEarth + EPSILON ||
      accretedGasEarth > initialGasEarth + EPSILON) {
    throw new RangeError(`V2.2 disk ${hostId} mass conservation violated.`);
  }
  return Object.freeze({
    hostId, family: window.family,
    status: !viable ? 'NO_USABLE_WINDOW' as const :
      formed.length > 0 ? 'FORMED' as const : 'NO_FORMATION' as const,
    window, diskMassEarth, initialSolidsEarth, initialGasEarth,
    accretedSolidsEarth, accretedGasEarth,
    remainingSolidsEarth: initialSolidsEarth - accretedSolidsEarth,
    remainingGasEarth: initialGasEarth - accretedGasEarth,
    planets: Object.freeze(formed),
  });
}

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

/** Frozen order-independent V2.2 stream, separate from V1 and V2 test particles. */
function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    h = Math.imul(h ^ text.charCodeAt(index), 0x01000193);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x7feb352d);
  h ^= h >>> 15;
  h = Math.imul(h, 0x846ca68b);
  return (h ^ (h >>> 16)) >>> 0;
}
function roll(seed: string, host: string, domain: string, ordinal: number): number {
  return hash32(`GENESIS:V2.2:${seed}:${host}:${domain}:${ordinal}`) / 0x1_0000_0000;
}
function hex128(seed: string, host: string, ordinal: number): string {
  return Array.from({length: 4}, (_, n) => hash32(
    `GENESIS:V2.2:FORMATION-ID:${n}:${seed}:${host}:${ordinal}`
  ).toString(16).padStart(8, '0')).join('').toUpperCase();
}
