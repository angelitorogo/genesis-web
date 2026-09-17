import {
  type MultihostFormedPlanetV22,
  type MultihostFormedPlanetarySystemV22,
} from '../../domain/planetary/multihost-formed-planetary-system';
import {
  type MultihostPlanetaryCatalog,
  type MultihostStableWindow,
} from '../../domain/planetary/multihost-planetary-catalog';
import {
  systemSceneMultihostProjectedRadiusV22,
} from './system-scene-multihost-radial-projection';
import {
  SystemSceneProjectionSpace,
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

export type SystemSceneBinaryPTypePhysicalVerdictV225 =
  | 'WITHIN_APPROXIMATE_DOMAIN'
  | 'INNER_BOUNDARY_CROSSED'
  | 'OUTER_BOUNDARY_CROSSED'
  | 'BOTH_BOUNDARIES_CROSSED'
  | 'INVALID_ORBITAL_ELEMENTS';

export interface SystemSceneBinaryPTypePlanetAuditV225 {
  readonly bodyId: string;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
  readonly physicalVerdict: SystemSceneBinaryPTypePhysicalVerdictV225;
  readonly rendered: boolean;
  /** The projected periapsis is evaluated with the planet's actual host mapping. */
  readonly projectedPeriapsisScene: number | null;
  /** Distance between the entire P-type planet and the maximum A/B local envelopes. */
  readonly visualClearanceScene: number | null;
  readonly hasCompleteRenderBinding: boolean;
  readonly visuallySeparated: boolean | null;
}

export interface SystemSceneBinaryPTypeAuditV225 {
  readonly version: 'V2_2_5_BINARY_P_TYPE_AUDIT_V1';
  readonly innerStableAu: number | null;
  /** Null is UNKNOWN, not physically infinite; do not substitute samplingOuterAu. */
  readonly outerStableAu: number | null;
  readonly samplingOuterAu: number | null;
  readonly formedPlanetCount: number;
  readonly renderedPlanetCount: number;
  readonly rejectedByPhysicalDomain: number;
  readonly requiredVisualInnerScene: number | null;
  readonly minimumVisualClearanceScene: number | null;
  readonly physicalStatus: 'NO_DOMAIN' | 'NO_P_TYPE_PLANETS' | 'APPROXIMATELY_ADMISSIBLE' | 'VIOLATION';
  readonly visualStatus: 'NOT_RENDERED' | 'SEPARATED' | 'OVERLAP_OR_UNBOUND';
  readonly cameraContainsPType: boolean | null;
  readonly planets: readonly SystemSceneBinaryPTypePlanetAuditV225[];
  readonly limitations: readonly string[];
}

const PHYSICAL_RELATIVE_TOLERANCE = 1e-8;
const MINIMUM_PLANET_TO_LOCAL_ENVELOPE_SCENE = 0.20;

/** The audit uses the same worst-case, epoch-independent envelope as V2.2.4. */
export function binaryStellarMaximumExcursionSceneV225(
  snapshot: SystemSceneSnapshot,
  star: SystemSceneBodySnapshot,
): number | null {
  let maximum = 0;
  for (const contribution of star.motionContributions) {
    const motion = snapshot.motions.find(item => item.id === contribution.motionId);
    if (motion === undefined) return null;
    const excursion = systemSceneProjectedRadiusAuInSpace(
      motion.semiMajorAxisAu * (1 + motion.eccentricity),
      snapshot.scale,
      contribution.projectionSpace ?? SystemSceneProjectionSpace.GLOBAL,
    ) * Math.abs(contribution.scale * (contribution.postProjectionScale ?? 1));
    if (!Number.isFinite(excursion)) return null;
    maximum += excursion;
  }
  return maximum;
}

export function binaryPTypeOrbitWithinApproximateDomainV225(
  planet: MultihostFormedPlanetV22,
  window: MultihostStableWindow | undefined,
): boolean {
  return physicalVerdict(planet, window) === 'WITHIN_APPROXIMATE_DOMAIN';
}

/**
 * Diagnostic ONLY. No new P-type stability formula, invented HZ or GT. Do not
 * infer long-term N-body stability from passing these empirical boundaries.
 */
export function auditSystemSceneBinaryPTypeV225(
  snapshot: SystemSceneSnapshot,
  catalog: MultihostPlanetaryCatalog,
  formed: MultihostFormedPlanetarySystemV22,
): SystemSceneBinaryPTypeAuditV225 {
  const window = catalog.windows.find(item => item.hostId === 'AB' && item.family === 'P_TYPE');
  const all = formed.planets.filter(planet => planet.hostId === 'AB');
  const a = snapshot.stars.find(star => star.label === 'A');
  const b = snapshot.stars.find(star => star.label === 'B');
  const envelopes = snapshot.multihostLayoutV222?.hostEnvelopes ?? [];
  const projection = snapshot.orbits.find(orbit =>
    snapshot.planets.some(planet =>
      planet.multihostOrbitV221?.hostId === 'AB' && planet.orbitId === orbit.id),
  )?.hostRadialProjectionV22;
  const radius = (star: SystemSceneBodySnapshot | undefined, host: 'A' | 'B') => {
    if (star === undefined) return null;
    const excursion = binaryStellarMaximumExcursionSceneV225(snapshot, star);
    if (excursion === null) return null;
    const local = envelopes.find(item => item.hostId === host);
    return excursion + (local?.outerEnvelopeScene ??
      Math.max(star.radiusScene, star.opticalRadiusScene ?? star.radiusScene));
  };
  const aExtent = radius(a, 'A');
  const bExtent = radius(b, 'B');
  const required = aExtent === null || bExtent === null ? null : Math.max(aExtent, bExtent);
  const camera = snapshot.laboratoryFrameRadiusSceneV224;
  const shared = envelopes.find(item => item.hostId === 'AB');
  const cameraContainsPType = camera === undefined || shared === undefined ? null :
    camera >= shared.outerEnvelopeScene - 1e-7;
  const motionIds = new Set(snapshot.motions.map(motion => motion.id));
  const planets: SystemSceneBinaryPTypePlanetAuditV225[] = all.map(formedPlanet => {
    const rendered = snapshot.planets.find(item => item.id === formedPlanet.id &&
      item.multihostOrbitV221?.hostId === 'AB');
    const orbit = rendered === undefined ? undefined : snapshot.orbits.find(item => item.id === rendered.orbitId);
    const motionId = rendered?.multihostOrbitV221?.motionId;
    const complete = rendered !== undefined && orbit !== undefined && motionId !== undefined &&
      orbit.motionId === motionId && motionIds.has(motionId) &&
      rendered.multihostOrbitV221?.translationState === 'ACTIVE' &&
      rendered.motionContributions.some(part => part.motionId === motionId) &&
      rendered.motionContributions.length === 1 && orbit.anchorMotionContributions.length === 0 &&
      orbit.hostRadialProjectionV22 === rendered.motionContributions[0]?.hostRadialProjectionV22;
    const hostProjection = orbit?.hostRadialProjectionV22 ?? projection;
    const peri = rendered === undefined || hostProjection === undefined ? null :
      safeProjectedPeriapsis(formedPlanet.periapsisAu, hostProjection);
    const clearance = peri === null || required === null || rendered === undefined ? null :
      peri - required - rendered.radiusScene;
    const visuallySeparated = rendered === undefined ? null :
      complete && clearance !== null &&
      clearance >= MINIMUM_PLANET_TO_LOCAL_ENVELOPE_SCENE - 1e-7;
    return Object.freeze({
      bodyId: formedPlanet.id,
      periapsisAu: formedPlanet.periapsisAu,
      apoapsisAu: formedPlanet.apoapsisAu,
      physicalVerdict: physicalVerdict(formedPlanet, window),
      rendered: rendered !== undefined,
      projectedPeriapsisScene: peri,
      visualClearanceScene: clearance,
      hasCompleteRenderBinding: complete,
      visuallySeparated,
    });
  });
  const displayed = planets.filter(item => item.rendered);
  const rejected = planets.filter(item => item.physicalVerdict !== 'WITHIN_APPROXIMATE_DOMAIN');
  const clearances = displayed.map(item => item.visualClearanceScene)
    .filter((value): value is number => value !== null);
  const physicalStatus = window === undefined ? 'NO_DOMAIN' as const :
    all.length === 0 ? 'NO_P_TYPE_PLANETS' as const :
      rejected.length === 0 ? 'APPROXIMATELY_ADMISSIBLE' as const : 'VIOLATION' as const;
  const visualStatus = displayed.length === 0 ? 'NOT_RENDERED' as const :
    displayed.every(item => item.visuallySeparated === true) && cameraContainsPType === true
      ? 'SEPARATED' as const : 'OVERLAP_OR_UNBOUND' as const;
  return Object.freeze({
    version: 'V2_2_5_BINARY_P_TYPE_AUDIT_V1' as const,
    innerStableAu: window?.innerStableAu ?? null,
    outerStableAu: window?.outerStableAu ?? null,
    samplingOuterAu: window?.referenceOuterAu ?? null,
    formedPlanetCount: all.length,
    renderedPlanetCount: displayed.length,
    rejectedByPhysicalDomain: rejected.length,
    requiredVisualInnerScene: required,
    minimumVisualClearanceScene: clearances.length > 0 ? Math.min(...clearances) : null,
    physicalStatus,
    visualStatus,
    cameraContainsPType,
    planets: Object.freeze(planets),
    limitations: Object.freeze([
      'Estabilidad aproximada: ventana S/P V2.1 (incluye límites congelados cuando existen); no demuestra estabilidad secular ni N-body.',
      'q y Q se verifican en UA físicas; la distancia de pantalla se verifica aparte, usando la excursión estelar máxima y las envolventes locales A/B.',
      'Exterior dinámico desconocido no significa estabilidad infinita. El límite de muestreo nunca se usa como frontera física.',
      'Solo laboratorio BINARY: este diagnóstico no modifica generación V1/V2, periodos, coordenadas físicas, partidas ni Ground Truth.',
    ]),
  });
}

function physicalVerdict(
  planet: MultihostFormedPlanetV22,
  window: MultihostStableWindow | undefined,
): SystemSceneBinaryPTypePhysicalVerdictV225 {
  if (window === undefined || !window.usable || planet.hostId !== 'AB' ||
      planet.family !== 'P_TYPE' ||
      ![planet.semiMajorAxisAu, planet.eccentricity, planet.periapsisAu,
        planet.apoapsisAu, planet.periodDays].every(Number.isFinite) ||
      planet.semiMajorAxisAu <= 0 || planet.periodDays <= 0 ||
      planet.eccentricity < 0 || planet.eccentricity >= 1 ||
      planet.periapsisAu <= 0 || planet.apoapsisAu < planet.periapsisAu) {
    return 'INVALID_ORBITAL_ELEMENTS';
  }
  const tolerance = PHYSICAL_RELATIVE_TOLERANCE * Math.max(1, planet.semiMajorAxisAu);
  if (Math.abs(planet.periapsisAu - planet.semiMajorAxisAu * (1 - planet.eccentricity)) > tolerance ||
      Math.abs(planet.apoapsisAu - planet.semiMajorAxisAu * (1 + planet.eccentricity)) > tolerance) {
    return 'INVALID_ORBITAL_ELEMENTS';
  }
  const crossesInner = planet.periapsisAu < window.innerStableAu - tolerance;
  const crossesOuter = window.outerStableAu !== null &&
    planet.apoapsisAu > window.outerStableAu + tolerance;
  return crossesInner && crossesOuter ? 'BOTH_BOUNDARIES_CROSSED' :
    crossesInner ? 'INNER_BOUNDARY_CROSSED' :
      crossesOuter ? 'OUTER_BOUNDARY_CROSSED' : 'WITHIN_APPROXIMATE_DOMAIN';
}

function safeProjectedPeriapsis(
  au: number,
  projection: NonNullable<SystemSceneSnapshot['orbits'][number]['hostRadialProjectionV22']>,
): number | null {
  try {
    const result = systemSceneMultihostProjectedRadiusV22(au, projection);
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}
