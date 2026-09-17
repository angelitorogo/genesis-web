import {
  type MultihostOrbitalHostId,
} from '../../domain/planetary/multihost-planetary-catalog';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';
import {
  type SystemSceneMultihostLayoutEnvelopeV222,
  type SystemSceneMultihostLayoutPlanV222,
} from './system-scene-multihost-hierarchical-layout';
import {
  systemSceneMultihostProjectedRadiusV22,
  type SystemSceneMultihostRadialProjectionV22,
} from './system-scene-multihost-radial-projection';
import {
  type MultihostCircumstellarHabitableZoneV23,
} from '../../simulation/planetary/multihost-circumstellar-habitable-zone-generator';
import { buildSystemSceneFirstOrbitAnchorV53 } from './system-scene-first-orbit-anchor';
import {
  buildSingleAdaptiveSystemScaleV3,
  systemSceneProjectedRadiusAu,
  systemSceneProjectedRadiusAuInSpace,
  SystemSceneProjectionSpace,
} from './system-scene-scale-projection';

/**
 * Binary-only QA composition.  Everything here is presentation-only: the
 * scientific AU, periods, seeds and frozen V1 snapshot remain unchanged.
 *
 * The two local disks are budgeted against the MINIMUM separation of the
 * binary, not only against the instantaneous position of its stars.  AB is
 * budgeted against both stars' MAXIMUM barycentric excursions.  All bodies and
 * orbit guides consume exactly the same host radial projection.
 */
export function buildSystemSceneBinarySubsystemLayoutV224(
  bodies: readonly {
    readonly hostId: MultihostOrbitalHostId;
    readonly periapsisAu: number;
    readonly apoapsisAu: number;
    readonly semiMajorAxisAu?: number;
  }[],
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
  fallback: SystemSceneMultihostLayoutPlanV222,
  zones: readonly MultihostCircumstellarHabitableZoneV23[] = [],
): SystemSceneMultihostLayoutPlanV222 {
  if (snapshot.multiplicityName !== 'BINARY') return fallback;
  const starA = stars.get('A');
  const starB = stars.get('B');
  if (starA === undefined || starB === undefined) return fallback;

  const motions = new Map(snapshot.motions.map(motion => [motion.id, motion]));
  const shared = starA.motionContributions.find(part =>
    starB.motionContributions.some(other => other.motionId === part.motionId));
  const motion = shared === undefined ? undefined : motions.get(shared.motionId);
  const other = shared === undefined ? undefined : starB.motionContributions.find(part =>
    part.motionId === shared.motionId);
  const projectedPeri = motion === undefined || shared === undefined || other === undefined
    ? NaN
    : systemSceneProjectedRadiusAuInSpace(
        motion.semiMajorAxisAu * (1 - motion.eccentricity),
        snapshot.scale,
        SystemSceneProjectionSpace.GLOBAL,
      ) * Math.abs(
        shared.scale * (shared.postProjectionScale ?? 1) -
        other.scale * (other.postProjectionScale ?? 1),
      );
  const currentSeparation = distance(starA.position, starB.position);
  const minimumSeparation = Number.isFinite(projectedPeri) && projectedPeri > 0
    ? projectedPeri
    : currentSeparation;

  // Maximum trajectory extent, not just today's snapshot position.
  const maxExcursion = (star: SystemSceneBodySnapshot): number =>
    star.motionContributions.reduce((sum, contribution) => {
      const definition = motions.get(contribution.motionId);
      if (definition === undefined) return sum;
      return sum + systemSceneProjectedRadiusAuInSpace(
        definition.semiMajorAxisAu * (1 + definition.eccentricity),
        snapshot.scale,
        contribution.projectionSpace ?? SystemSceneProjectionSpace.GLOBAL,
      ) * Math.abs(contribution.scale * (contribution.postProjectionScale ?? 1));
    }, 0);

  const projections = new Map(fallback.radialProjections);
  const envelopes: SystemSceneMultihostLayoutEnvelopeV222[] = [];
  // Two independent full-resolution SINGLE disks. Their stellar spacing
  // is reserved before this stage by binaryPhysicalSeparationTargetSceneV226.
  // Neither disk changes its own scale in response to its companion.
  const singleOuterScene = 4.8;
  for (const hostId of ['A', 'B'] as const) {
    const star = hostId === 'A' ? starA : starB;
    const selected = bodies.filter(body => body.hostId === hostId);
    if (selected.length === 0) continue;
    const innerAu = Math.min(...selected.map(body => body.periapsisAu));
    const outerAu = Math.max(...selected.map(body => body.apoapsisAu));
    if (!(innerAu > 0 && outerAu > innerAu)) continue;
    const optical = Math.max(star.radiusScene, star.opticalRadiusScene ?? star.radiusScene);
    const referenceHz = zones.find(zone => zone.hostId === hostId);
    // Identical SINGLE inputs and pipeline: always pass real radiative HZ
    // bounds, even when they extend past the last formed planet.
    const initialScale = buildSingleAdaptiveSystemScaleV3({
      outerRadiusAu: outerAu,
      targetOuterRadiusScene: singleOuterScene,
      innerPeriapsisAu: innerAu,
      starRadiusScene: star.radiusScene,
      maxPlanetRadiusScene: 0.081,
      habitableZoneInnerAu: referenceHz?.radiativeInnerEdgeAu ?? null,
      habitableZoneOuterAu: referenceHz?.radiativeOuterEdgeAu ?? null,
    });
    const firstOrbitAnchor = buildSystemSceneFirstOrbitAnchorV53({
      architecture: 'SINGLE',
      projectionSpace: SystemSceneProjectionSpace.GLOBAL,
      nearestPeriapsisAu: innerAu,
      originalPeriapsisScene: systemSceneProjectedRadiusAu(innerAu, initialScale),
      localOuterRadiusScene: initialScale.targetOuterRadiusScene,
      basePrimaryRadiusScene: star.radiusScene,
      baseSecondaryRadiusScene: 0,
      firstPlanetRadiusScene: 0.081,
    });
    const singleScale = Object.freeze({...initialScale, firstOrbitAnchor});
    const firstOrbitScene = systemSceneProjectedRadiusAu(innerAu, singleScale);
    // Reserve the WHOLE 4.8-unit SINGLE presentation domain, including HZ
    // beyond the last formed orbit, not merely the currently populated disk.
    const outerEnvelopeScene = singleScale.targetOuterRadiusScene;
    if (!(firstOrbitScene > optical + 0.081 &&
        outerEnvelopeScene > firstOrbitScene + 0.20 &&
        outerEnvelopeScene * 2 + 0.40 < minimumSeparation + 1e-8)) {
      throw new RangeError('V2.3.4 BINARY cannot reserve two complete SINGLE disks at stellar periastron.');
    }
    const projection: SystemSceneMultihostRadialProjectionV22 = Object.freeze({
      firstPeriapsisAu: innerAu,
      firstPeriapsisScene: firstOrbitScene,
      lastApoapsisAu: outerAu,
      lastApoapsisScene: systemSceneProjectedRadiusAu(outerAu, singleScale),
      singleSystemScaleV233: singleScale,
      // V2.3.3's uniform orbit ladder is deliberately REMOVED.
    });
    projections.set(hostId, projection);
    envelopes.push(Object.freeze({
      hostId,
      family: 'S_TYPE' as const,
      centerScene: star.position,
      firstOrbitScene,
      outerEnvelopeScene,
      renderedPlanetCount: selected.length,
    }));
  }

  const ab = bodies.filter(body => body.hostId === 'AB');
  if (ab.length > 0) {
    const innerAu = Math.min(...ab.map(body => body.periapsisAu));
    const outerAu = Math.max(...ab.map(body => body.apoapsisAu));
    if (innerAu > 0 && outerAu > innerAu) {
      const naturalInner = systemSceneProjectedRadiusAuInSpace(
        innerAu, snapshot.scale, SystemSceneProjectionSpace.GLOBAL,
      );
      const localA = envelopes.find(item => item.hostId === 'A');
      const localB = envelopes.find(item => item.hostId === 'B');
      const required = Math.max(
        maxExcursion(starA) + (localA?.outerEnvelopeScene ?? starA.radiusScene),
        maxExcursion(starB) + (localB?.outerEnvelopeScene ?? starB.radiusScene),
      );
      const firstOrbitScene = Math.max(naturalInner, required + 0.68);
      const outerEnvelopeScene = Math.max(
        firstOrbitScene + 0.55,
        systemSceneProjectedRadiusAuInSpace(
          outerAu, snapshot.scale, SystemSceneProjectionSpace.GLOBAL,
        ),
      );
      projections.set('AB', Object.freeze({
        firstPeriapsisAu: innerAu,
        firstPeriapsisScene: firstOrbitScene,
        lastApoapsisAu: outerAu,
        lastApoapsisScene: outerEnvelopeScene,
      }));
      envelopes.push(Object.freeze({
        hostId: 'AB', family: 'P_TYPE' as const,
        centerScene: Object.freeze({x: 0, y: 0, z: 0}),
        firstOrbitScene, outerEnvelopeScene, renderedPlanetCount: ab.length,
      }));
    }
  }

  const visualExtent = Math.max(
    snapshot.scale.targetOuterRadiusScene,
    maxExcursion(starA) + (envelopes.find(item => item.hostId === 'A')?.outerEnvelopeScene ?? 0),
    maxExcursion(starB) + (envelopes.find(item => item.hostId === 'B')?.outerEnvelopeScene ?? 0),
    ...envelopes.filter(item => item.family === 'P_TYPE').map(item => item.outerEnvelopeScene),
  );
  return Object.freeze({
    radialProjections: projections,
    layout: Object.freeze({
      ...fallback.layout,
      version: 'V2_2_4_BINARY_LAYOUT_V1' as const,
      stellarInnerSpreadScale: Math.max(
        ...starA.motionContributions.map(part => part.postProjectionScale ?? 1),
        ...starB.motionContributions.map(part => part.postProjectionScale ?? 1),
      ),
      globalOuterSceneLimit: visualExtent,
      hostEnvelopes: Object.freeze(envelopes),
      notes: Object.freeze([
        'V2.3.4 BINARY: dos proyecciones SINGLE V3 + ancla V5.3 completas, 4,8 unidades cada una, sin escalado afín ni escalera uniforme; separación estelar reservada en periastro y contraste físico 3/93 UA preservado.',
        'Vista general: cámara para ambas excursiones estelares y sus discos completos. Vista local: seguimiento de la estrella A o B con el disco SINGLE completo, sin alterar el catálogo científico.',
        'Las órbitas planetarias V1 no se superponen a V2 en el modo BINARY QA. El sistema V1 original sigue disponible al desactivar el modo experimental.',
        'La HZ radiativa por estrella se añade en V2.3.1; V2.4.3 sustituye los menores QA por inventarios científicos V2 separados por anfitrión, sin escribir datos de generación V1.',
      ]),
    }),
  });
}

function distance(
  a: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
  b: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
