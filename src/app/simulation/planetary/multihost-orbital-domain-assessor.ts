import {
  type MultihostOrbitalDiagnosticsV21,
  type MultihostOrbitalHostV21,
  type MultihostOrbitalAssessmentV21,
  type MultihostOrbitalVerdictV21,
  type MultihostHostDomainV21,
  type MultihostPlanetHostAssignmentV21,
} from '../../domain/planetary/multihost-orbital-domain';
import {
  type MultihostOrbitalHostId,
  type MultihostPlanetaryCatalog,
  type MultihostStableWindow,
} from '../../domain/planetary/multihost-planetary-catalog';

export interface FrozenMultihostPlanetV21 {
  readonly id: string;
  readonly label: string;
}

/** Immutable read-only bridge: freezes V1 provenance, never modifies V1 bodies. */
export interface MultihostDomainAssessmentInputV21 {
  readonly catalog: MultihostPlanetaryCatalog;
  readonly legacyHostId: MultihostOrbitalHostId;
  readonly legacyPlanets: readonly FrozenMultihostPlanetV21[];
}

const COMPONENTS: Readonly<Record<MultihostOrbitalHostId,
  readonly ('A' | 'B' | 'C')[]>> = Object.freeze({
  A: Object.freeze(['A'] as const),
  B: Object.freeze(['B'] as const),
  C: Object.freeze(['C'] as const),
  AB: Object.freeze(['A', 'B'] as const),
  ABC: Object.freeze(['A', 'B', 'C'] as const),
});
const TOLERANCE = 1e-10;

/**
 * V2.1 diagnostic only: evaluates FULL q..Q excursions using each planet's
 * own host window. Never infers planet formation, secular long-term stability,
 * V2 HZ or migration. A missing outer cutoff is *unknown*, not infinity.
 */
export function assessMultihostOrbitalDomainsV21(
  input: MultihostDomainAssessmentInputV21,
): MultihostOrbitalDiagnosticsV21 {
  const { catalog, legacyHostId, legacyPlanets } = input;
  if (catalog.version !== 'V2_EXPERIMENTAL') {
    throw new RangeError('V2.1 requires an experimental multihost catalogue.');
  }
  if (catalog.windows.length === 0) {
    throw new RangeError('V2.1 requires at least one stellar host.');
  }
  const windows = new Map<MultihostOrbitalHostId, MultihostStableWindow>();
  for (const window of catalog.windows) {
    if (windows.has(window.hostId)) {
      throw new RangeError(`Duplicate V2.1 orbital host: ${window.hostId}.`);
    }
    const expectedFamily = window.hostId.length === 1 ? 'S_TYPE' : 'P_TYPE';
    if (window.family !== expectedFamily || COMPONENTS[window.hostId] === undefined) {
      throw new RangeError(`V2.1 host/family mismatch: ${window.hostId}.`);
    }
    if (!(Number.isFinite(window.gravitatingMassSolar) && window.gravitatingMassSolar > 0) ||
        !(Number.isFinite(window.innerStableAu) && window.innerStableAu > 0) ||
        !(Number.isFinite(window.referenceOuterAu) && window.referenceOuterAu > 0) ||
        (window.outerStableAu !== null &&
          !(Number.isFinite(window.outerStableAu) && window.outerStableAu >= 0))) {
      throw new RangeError(`Invalid V2.1 host domain: ${window.hostId}.`);
    }
    windows.set(window.hostId, window);
  }
  const legacyWindow = windows.get(legacyHostId);
  if (legacyWindow === undefined) {
    throw new RangeError('Frozen V1 planet host is absent from the V2.1 host catalogue.');
  }
  const seenBodyIds = new Set<string>();
  const assign = (
    bodyId: string,
    label: string,
    window: MultihostStableWindow,
    origin: 'V1_FROZEN' | 'V2_TEST_PARTICLE',
  ): MultihostPlanetHostAssignmentV21 => {
    if (!bodyId || seenBodyIds.has(bodyId)) {
      throw new RangeError(`Missing or duplicate multihost planet identity: ${bodyId}.`);
    }
    seenBodyIds.add(bodyId);
    return Object.freeze({
      bodyId, label, hostId: window.hostId, family: window.family,
      gravitatingMassSolar: window.gravitatingMassSolar, origin,
      stability: origin === 'V1_FROZEN' ? 'NOT_REASSESSED_V1' as const
        : 'TEST_PARTICLE_ONLY' as const,
    });
  };
  const assignments: MultihostPlanetHostAssignmentV21[] = legacyPlanets.map(planet =>
    assign(planet.id, planet.label, legacyWindow, 'V1_FROZEN'));

  const sampleBounds = catalog.windows.flatMap(window =>
    [window.innerStableAu, window.referenceOuterAu]);
  const displayMinimumAu = Math.min(...sampleBounds);
  const displayMaximumAu = Math.max(...sampleBounds);
  const percent = (radius: number): number => {
    if (!(displayMaximumAu > displayMinimumAu)) return 0;
    const normalized = (Math.log(Math.max(radius, displayMinimumAu)) -
      Math.log(displayMinimumAu)) /
      (Math.log(displayMaximumAu) - Math.log(displayMinimumAu));
    return Math.max(0, Math.min(100, 100 * normalized));
  };

  const physicallyClosed = (window: MultihostStableWindow): boolean =>
    window.outerStableAu !== null && window.outerStableAu <= window.innerStableAu;

  const assessments: MultihostOrbitalAssessmentV21[] = [];
  for (const candidate of catalog.candidates) {
    const window = windows.get(candidate.hostId);
    if (window === undefined || window.family !== candidate.family) {
      throw new RangeError(`Candidate ${candidate.id} has no matching S/P orbital host.`);
    }
    const expectedPeriodDays = 365.25 * Math.sqrt(
      candidate.semiMajorAxisAu ** 3 / window.gravitatingMassSolar);
    if (!(Number.isFinite(candidate.periodDays) && candidate.periodDays > 0) ||
        Math.abs(candidate.periodDays - expectedPeriodDays) >
          TOLERANCE * Math.max(1, expectedPeriodDays)) {
      throw new RangeError(`Candidate ${candidate.id} does not use its own orbital host mass.`);
    }
    if (!(Number.isFinite(candidate.semiMajorAxisAu) && candidate.semiMajorAxisAu > 0) ||
        !(Number.isFinite(candidate.eccentricity) && candidate.eccentricity >= 0 && candidate.eccentricity < 1) ||
        !(Number.isFinite(candidate.periapsisAu) && candidate.periapsisAu > 0) ||
        !(Number.isFinite(candidate.apoapsisAu) && candidate.apoapsisAu > 0) ||
        Math.abs(candidate.periapsisAu - candidate.semiMajorAxisAu *
          (1 - candidate.eccentricity)) > TOLERANCE * Math.max(1, candidate.semiMajorAxisAu) ||
        Math.abs(candidate.apoapsisAu - candidate.semiMajorAxisAu *
          (1 + candidate.eccentricity)) > TOLERANCE * Math.max(1, candidate.semiMajorAxisAu)) {
      throw new RangeError(`Candidate ${candidate.id} has inconsistent orbital elements.`);
    }
    const innerClearanceAu = candidate.periapsisAu - window.innerStableAu;
    const outerClearanceAu = window.outerStableAu === null ? null :
      window.outerStableAu - candidate.apoapsisAu;
    const crossesInner = innerClearanceAu < -TOLERANCE;
    const crossesOuter = outerClearanceAu !== null && outerClearanceAu < -TOLERANCE;
    let verdict: MultihostOrbitalVerdictV21;
    if (physicallyClosed(window)) verdict = 'CLOSED_HOST_DOMAIN';
    else if (!window.usable) verdict = 'NO_USABLE_SAMPLE';
    else if (crossesInner && crossesOuter) verdict = 'BOTH_BOUNDARIES_CROSSED';
    else if (crossesInner) verdict = 'INNER_BOUNDARY_CROSSED';
    else if (crossesOuter) verdict = 'OUTER_BOUNDARY_CROSSED';
    else verdict = 'WITHIN_APPROXIMATE_WINDOW';
    assessments.push(Object.freeze({
      bodyId: candidate.id, hostId: candidate.hostId,
      periapsisAu: candidate.periapsisAu, apoapsisAu: candidate.apoapsisAu,
      innerClearanceAu, outerClearanceAu, verdict,
      startPercent: percent(candidate.periapsisAu),
      widthPercent: Math.max(0, percent(candidate.apoapsisAu) -
        percent(candidate.periapsisAu)),
    }));
    assignments.push(assign(candidate.id, `${candidate.hostId} · ${candidate.ordinal} (QA)`,
      window, 'V2_TEST_PARTICLE'));
  }

  const domains: MultihostHostDomainV21[] = catalog.windows.map(window => {
    const host: MultihostOrbitalHostV21 = Object.freeze({
      id: window.hostId, family: window.family,
      components: COMPONENTS[window.hostId],
      gravitatingMassSolar: window.gravitatingMassSolar,
    });
    return Object.freeze({
      host,
      state: physicallyClosed(window) ? 'CLOSED' as const :
        !window.usable ? 'UNSAMPLED' as const :
        window.outerStableAu === null ? 'OPEN_SAMPLING_LIMITED' as const :
          'OPEN_BOUNDED' as const,
      innerStableAu: window.innerStableAu,
      outerStableAu: window.outerStableAu,
      samplingOuterAu: window.referenceOuterAu,
      candidateCount: catalog.candidates.filter(candidate =>
        candidate.hostId === window.hostId).length,
      startPercent: percent(window.innerStableAu),
      widthPercent: window.usable ? Math.max(0,
        percent(window.referenceOuterAu) - percent(window.innerStableAu)) : 0,
      limitation: window.limitation,
    });
  });

  return Object.freeze({
    version: 'V2_1_QA' as const,
    domains: Object.freeze(domains),
    assignments: Object.freeze(assignments),
    assessments: Object.freeze(assessments),
    displayMinimumAu, displayMaximumAu,
    limitations: Object.freeze([
      'V1: anfitrión heredado y sin reevaluar; ninguna identidad ni partida modificada.',
      'V2: órbitas testigo, no planetas formados. Ajustes S/P coplanares aproximados; sin estabilidad secular/N-body.',
      'Ventana sin muestra suficiente NO implica cierre dinámico. Exterior desconocido no significa estabilidad infinita; el extremo de muestreo NO es un límite dinámico.',
      'No se calculan HZ, lunas ni composición V2. Velocidades visuales QA distintas de los periodos físicos.',
    ]),
  });
}
