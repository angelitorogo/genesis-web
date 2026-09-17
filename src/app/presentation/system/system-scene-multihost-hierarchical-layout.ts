import {
  type MultihostOrbitalHostId,
} from '../../domain/planetary/multihost-planetary-catalog';

import {
  type SystemSceneBodySnapshot,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

import {
  type SystemSceneMultihostRadialProjectionV22,
} from './system-scene-multihost-radial-projection';

import {
  SystemSceneProjectionSpace,
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';

export interface SystemSceneMultihostLayoutEnvelopeV222 {
  readonly hostId: MultihostOrbitalHostId;
  readonly family: 'S_TYPE' | 'P_TYPE';
  readonly centerScene: Readonly<{readonly x: number; readonly y: number; readonly z: number}>;
  readonly firstOrbitScene: number;
  readonly outerEnvelopeScene: number;
  readonly renderedPlanetCount: number;
}

export interface SystemSceneMultihostLayoutV222 {
  readonly version: 'V2_2_3_LAYOUT_V1' | 'V2_2_4_BINARY_LAYOUT_V1';
  readonly stellarInnerSpreadScale: number;
  readonly stellarOuterSpreadScale: number;
  readonly globalOuterSceneLimit: number;
  readonly hostEnvelopes: readonly SystemSceneMultihostLayoutEnvelopeV222[];
  readonly notes: readonly string[];
}

export interface SystemSceneMultihostLayoutPlanV222 {
  readonly radialProjections: ReadonlyMap<MultihostOrbitalHostId, SystemSceneMultihostRadialProjectionV22>;
  readonly layout: SystemSceneMultihostLayoutV222;
}

interface MultihostBodyLikeV222 {
  readonly hostId: MultihostOrbitalHostId;
  readonly periapsisAu: number;
  readonly apoapsisAu: number;
}

const V223_LOCAL_FIRST_CLEARANCE_SCENE = 0.22;
const V223_LOCAL_PLANET_MARGIN_SCENE = 0.12;
const V223_LOCAL_MIN_SPAN_SCENE = 0.44;
const V223_LOCAL_NEIGHBOR_SHARE = 0.46;
const V223_SHARED_CLEARANCE_SCENE = 0.86;
const V223_SHARED_LAYER_GAP_SCENE = 1.08;

export function multihostStellarPostProjectionScaleV222(
  multiplicity: string | null,
  contribution: SystemSceneMotionContributionSnapshot,
): number {
  if (multiplicity === 'TRIPLE') {
    return contribution.projectionSpace === SystemSceneProjectionSpace.TRIPLE_OUTER
      ? 4.4
      : 3.2;
  }
  if (multiplicity === 'BINARY') {
    return 3.1;
  }
  return 1;
}

export function buildSystemSceneMultihostHierarchicalLayoutV222(
  bodies: readonly MultihostBodyLikeV222[],
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
): SystemSceneMultihostLayoutPlanV222 {
  const radialProjections = new Map<MultihostOrbitalHostId, SystemSceneMultihostRadialProjectionV22>();
  const hostEnvelopes: SystemSceneMultihostLayoutEnvelopeV222[] = [];
  const localOuterByHost = new Map<'A' | 'B' | 'C', number>();
  const centers = buildHostCentersV222(snapshot, stars);
  const multiplicity = snapshot.multiplicityName;
  const targetOuter = snapshot.scale.targetOuterRadiusScene;

  for (const hostId of ['A', 'B', 'C'] as const) {
    const hostBodies = bodies.filter(body => body.hostId === hostId);
    const star = stars.get(hostId);
    const center = centers.get(hostId);
    if (star === undefined || center === undefined || hostBodies.length === 0) continue;

    const innerAu = Math.min(...hostBodies.map(body => body.periapsisAu));
    const outerAu = Math.max(...hostBodies.map(body => body.apoapsisAu));
    if (!(outerAu > innerAu)) continue;

    const naturalSpace = multiplicity === 'TRIPLE'
      ? SystemSceneProjectionSpace.TRIPLE_LOCAL
      : SystemSceneProjectionSpace.GLOBAL;
    const naturalInner = systemSceneProjectedRadiusAuInSpace(innerAu, snapshot.scale, naturalSpace);
    const naturalOuter = systemSceneProjectedRadiusAuInSpace(outerAu, snapshot.scale, naturalSpace);
    const nearest = nearestNeighbourDistanceScene(hostId, star.position, stars);
    const maxOuterEnvelope = Math.min(
      targetOuter * (multiplicity === 'TRIPLE' ? 0.42 : 0.50),
      // Do not expand each binary planetary disk in lockstep with its stellar
      // gap: that would cancel the perceptible AU contrast when HOME auto-fits.
      // Follow/zoom still uses the FULL local disk, even for wide binaries.
      multiplicity === 'BINARY' ? 1.9 : Number.POSITIVE_INFINITY,
      Math.max(
        targetOuter * 0.26,
        nearest === Number.POSITIVE_INFINITY
          ? targetOuter * (multiplicity === 'TRIPLE' ? 0.24 : 0.3)
          : nearest * V223_LOCAL_NEIGHBOR_SHARE,
      ),
    );

    const firstOrbitScene = Math.max(
      multiplicity === 'BINARY' ? Math.min(naturalInner, 0.82) : naturalInner,
      (star.opticalRadiusScene ?? star.radiusScene) +
        V223_LOCAL_FIRST_CLEARANCE_SCENE +
        V223_LOCAL_PLANET_MARGIN_SCENE,
    );
    const outerEnvelopeScene = clamp(
      Math.max(
        naturalOuter,
        firstOrbitScene + V223_LOCAL_MIN_SPAN_SCENE,
      ),
      firstOrbitScene + V223_LOCAL_MIN_SPAN_SCENE,
      maxOuterEnvelope,
    );

    radialProjections.set(hostId, Object.freeze({
      firstPeriapsisAu: innerAu,
      firstPeriapsisScene: firstOrbitScene,
      lastApoapsisAu: outerAu,
      lastApoapsisScene: outerEnvelopeScene,
    }));
    localOuterByHost.set(hostId, outerEnvelopeScene);
    hostEnvelopes.push(Object.freeze({
      hostId,
      family: 'S_TYPE',
      centerScene: center,
      firstOrbitScene,
      outerEnvelopeScene,
      renderedPlanetCount: hostBodies.length,
    }));
  }

  const abBodies = bodies.filter(body => body.hostId === 'AB');
  const abCenter = centers.get('AB') ?? ORIGIN_SCENE;
  if (abBodies.length > 0) {
    const innerAu = Math.min(...abBodies.map(body => body.periapsisAu));
    const outerAu = Math.max(...abBodies.map(body => body.apoapsisAu));
    if (outerAu > innerAu) {
      const naturalSpace = multiplicity === 'TRIPLE'
        ? SystemSceneProjectionSpace.TRIPLE_OUTER
        : SystemSceneProjectionSpace.GLOBAL;
      const naturalInner = systemSceneProjectedRadiusAuInSpace(innerAu, snapshot.scale, naturalSpace);
      const naturalOuter = systemSceneProjectedRadiusAuInSpace(outerAu, snapshot.scale, naturalSpace);
      const requiredInner = ['A', 'B']
        .map(hostId => requiredSharedStartScene(hostId as 'A' | 'B', abCenter, stars, localOuterByHost))
        .reduce((max, value) => Math.max(max, value), 0) + V223_SHARED_CLEARANCE_SCENE;
      const firstOrbitScene = Math.max(naturalInner, requiredInner);
      const outerEnvelopeScene = clamp(
        Math.max(naturalOuter, firstOrbitScene + 0.82),
        firstOrbitScene + 0.82,
        targetOuter * (multiplicity === 'TRIPLE' ? 1.02 : 1.08),
      );
      radialProjections.set('AB', Object.freeze({
        firstPeriapsisAu: innerAu,
        firstPeriapsisScene: firstOrbitScene,
        lastApoapsisAu: outerAu,
        lastApoapsisScene: outerEnvelopeScene,
      }));
      hostEnvelopes.push(Object.freeze({
        hostId: 'AB',
        family: 'P_TYPE',
        centerScene: abCenter,
        firstOrbitScene,
        outerEnvelopeScene,
        renderedPlanetCount: abBodies.length,
      }));
    }
  }

  const abcBodies = bodies.filter(body => body.hostId === 'ABC');
  const abcCenter = centers.get('ABC') ?? ORIGIN_SCENE;
  if (abcBodies.length > 0) {
    const innerAu = Math.min(...abcBodies.map(body => body.periapsisAu));
    const outerAu = Math.max(...abcBodies.map(body => body.apoapsisAu));
    if (outerAu > innerAu) {
      const naturalInner = systemSceneProjectedRadiusAuInSpace(
        innerAu,
        snapshot.scale,
        SystemSceneProjectionSpace.TRIPLE_OUTER,
      );
      const naturalOuter = systemSceneProjectedRadiusAuInSpace(
        outerAu,
        snapshot.scale,
        SystemSceneProjectionSpace.TRIPLE_OUTER,
      );
      const requiredFromLocalStars = (['A', 'B', 'C'] as const)
        .map(hostId => requiredSharedStartScene(hostId, abcCenter, stars, localOuterByHost))
        .reduce((max, value) => Math.max(max, value), 0);
      const requiredFromAb = hostEnvelopes
        .filter(envelope => envelope.hostId === 'AB')
        .map(envelope => distanceScene(envelope.centerScene, abcCenter) + envelope.outerEnvelopeScene)
        .reduce((max, value) => Math.max(max, value), 0);
      const firstOrbitScene = Math.max(
        naturalInner,
        Math.max(requiredFromLocalStars, requiredFromAb) + V223_SHARED_LAYER_GAP_SCENE,
      );
      const outerEnvelopeScene = clamp(
        Math.max(naturalOuter, firstOrbitScene + 1.02),
        firstOrbitScene + 1.02,
        targetOuter * 1.18,
      );
      radialProjections.set('ABC', Object.freeze({
        firstPeriapsisAu: innerAu,
        firstPeriapsisScene: firstOrbitScene,
        lastApoapsisAu: outerAu,
        lastApoapsisScene: outerEnvelopeScene,
      }));
      hostEnvelopes.push(Object.freeze({
        hostId: 'ABC',
        family: 'P_TYPE',
        centerScene: abcCenter,
        firstOrbitScene,
        outerEnvelopeScene,
        renderedPlanetCount: abcBodies.length,
      }));
    }
  }

  const layout = Object.freeze({
    version: 'V2_2_3_LAYOUT_V1' as const,
    stellarInnerSpreadScale: multiplicity === 'BINARY'
      ? Math.max(1, ...snapshot.stars.flatMap(star =>
          star.motionContributions.map(part => part.postProjectionScale ?? 1)))
      : multihostStellarPostProjectionScaleV222(
          multiplicity,
          {motionId: 'inner', scale: 1},
        ),
    stellarOuterSpreadScale: multihostStellarPostProjectionScaleV222(
      multiplicity,
      {motionId: 'outer', scale: 1, projectionSpace: SystemSceneProjectionSpace.TRIPLE_OUTER},
    ),
    globalOuterSceneLimit: targetOuter,
    hostEnvelopes: Object.freeze(hostEnvelopes),
    notes: Object.freeze([
      'V2.2.3 trata cada anfitrión S-type como un mini sistema simple expandido y abre mucho más la jerarquía visual multihost.',
      'Las estrellas se abren solo en la escena del laboratorio: no cambia la física, el Ground Truth ni los periodos orbitales científicos.',
      'Las capas compartidas AB/ABC se desplazan bastante más hacia fuera para que los subsistemas locales no queden apelmazados ni se confundan entre sí.',
    ]),
  });

  return Object.freeze({
    radialProjections,
    layout,
  });
}

function buildHostCentersV222(
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
): Map<MultihostOrbitalHostId, Readonly<{readonly x: number; readonly y: number; readonly z: number}>> {
  const centers = new Map<MultihostOrbitalHostId, Readonly<{readonly x: number; readonly y: number; readonly z: number}>>();
  const starA = stars.get('A');
  const starB = stars.get('B');
  const starC = stars.get('C');
  if (starA !== undefined) centers.set('A', starA.position);
  if (starB !== undefined) centers.set('B', starB.position);
  if (starC !== undefined) centers.set('C', starC.position);

  if (snapshot.multiplicityName === 'BINARY') {
    centers.set('AB', ORIGIN_SCENE);
  } else if (snapshot.multiplicityName === 'TRIPLE') {
    if (starA !== undefined && starB !== undefined) {
      centers.set('AB', averageScene(starA.position, starB.position));
    }
    centers.set('ABC', ORIGIN_SCENE);
  }
  return centers;
}

function requiredSharedStartScene(
  hostId: 'A' | 'B' | 'C',
  center: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
  localOuterByHost: ReadonlyMap<'A' | 'B' | 'C', number>,
): number {
  const star = stars.get(hostId);
  if (star === undefined) return 0;
  return distanceScene(star.position, center) + (localOuterByHost.get(hostId) ?? star.radiusScene);
}

function nearestNeighbourDistanceScene(
  label: 'A' | 'B' | 'C',
  position: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
): number {
  let nearest = Number.POSITIVE_INFINITY;
  for (const candidate of ['A', 'B', 'C'] as const) {
    if (candidate === label) continue;
    const star = stars.get(candidate);
    if (star === undefined) continue;
    nearest = Math.min(nearest, distanceScene(position, star.position));
  }
  return nearest;
}

function averageScene(
  left: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
  right: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
): Readonly<{readonly x: number; readonly y: number; readonly z: number}> {
  return Object.freeze({
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  });
}

function distanceScene(
  left: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
  right: Readonly<{readonly x: number; readonly y: number; readonly z: number}>,
): number {
  return Math.hypot(left.x - right.x, left.y - right.y, left.z - right.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const ORIGIN_SCENE = Object.freeze({x: 0, y: 0, z: 0});
