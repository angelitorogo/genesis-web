import {
  MinorBodyKind,
} from '../../domain/planetary/minor-body-kind';

import {
  type SystemSceneBodySnapshot,
  type SystemSceneMinorBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneOrbitalRiskTargetSnapshot,
  type SystemSceneOrbitSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

export interface SystemSceneBodyCardRisk {
  readonly severity:
    SystemSceneOrbitalRiskTargetSnapshot['severity'];

  readonly severityLabel:
    string;

  readonly sourceMinorBodyCount:
    number;

  readonly radialCrossingOnlyCount:
    number;

  readonly approachCorridorCount:
    number;

  readonly directCollisionGeometryCount:
    number;

  readonly highestOrbitalRiskIndex01:
    number;
}

export interface SystemSceneBodyCard {
  readonly bodyId:
    string;

  readonly kind:
    'star' |
    'planet' |
    'moon' |
    'minor-body';

  readonly kindLabel:
    string;

  readonly title:
    string;

  readonly designation:
    string;

  readonly colorHex:
    string;

  readonly subtypeLabel:
    string | null;

  readonly hostTitle:
    string | null;

  readonly orbitLabel:
    string | null;

  readonly orbitKindLabel:
    string | null;

  readonly orbitalRisk:
    SystemSceneBodyCardRisk | null;
}

type SystemSceneBodyCardSource =
  | SystemSceneBodySnapshot
  | SystemSceneMoonSnapshot
  | SystemSceneMinorBodySnapshot;

/**
 * Point-24.8 presentation-only body sheet.
 *
 * This deliberately uses only the already frozen SystemScene snapshot. It does
 * not regenerate Ground Truth and it does not attempt to implement the richer
 * scientific records reserved for phase 26.
 */
export function buildSystemSceneBodyCard(
  snapshot:
    SystemSceneSnapshot,

  bodyId:
    string,
): SystemSceneBodyCard | null {

  const body =
    findBody(
      snapshot,
      bodyId,
    );

  if (
    body ===
      null
  ) {
    return null;
  }

  const orbit =
    body.orbitId ===
      null
      ? null
      : snapshot.orbits.find(
          candidate =>
            candidate.id ===
              body.orbitId,
        ) ?? null;

  const hostTitle =
    body.kind ===
      'moon'
      ? snapshot.planets.find(
          planet =>
            planet.id ===
              body.hostPlanetId,
        )?.title ?? null
      : null;

  const risk =
    snapshot.orbitalRiskTargets.find(
      candidate =>
        candidate.targetBodyId ===
          body.id,
    ) ?? null;

  return Object.freeze({
    bodyId:
      body.id,
    kind:
      body.kind,
    kindLabel:
      bodyKindLabel(
        body.kind,
      ),
    title:
      body.title,
    designation:
      body.label,
    colorHex:
      body.colorHex,
    subtypeLabel:
      body.kind ===
        'minor-body'
        ? minorBodyKindLabel(
            body,
          )
        : null,
    hostTitle,
    orbitLabel:
      orbit?.label ?? null,
    orbitKindLabel:
      orbitKindLabel(
        orbit,
      ),
    orbitalRisk:
      risk ===
        null
        ? null
        : Object.freeze({
            severity:
              risk.severity,
            severityLabel:
              riskSeverityLabel(
                risk.severity,
              ),
            sourceMinorBodyCount:
              risk.sourceMinorBodyCount,
            radialCrossingOnlyCount:
              risk.radialCrossingOnlyCount,
            approachCorridorCount:
              risk.approachCorridorCount,
            directCollisionGeometryCount:
              risk.directCollisionGeometryCount,
            highestOrbitalRiskIndex01:
              risk.highestOrbitalRiskIndex01,
          }),
  });
}

function findBody(
  snapshot:
    SystemSceneSnapshot,

  bodyId:
    string,
): SystemSceneBodyCardSource | null {

  for (
    const body
    of [
      ...snapshot.stars,
      ...snapshot.planets,
      ...snapshot.moons,
      ...snapshot.minorBodies,
    ]
  ) {
    if (
      body.id ===
        bodyId
    ) {
      return body;
    }
  }

  return null;
}

function bodyKindLabel(
  kind:
    SystemSceneBodyCard['kind'],
): string {
  switch (
    kind
  ) {
    case 'star':
      return 'ESTRELLA';
    case 'planet':
      return 'PLANETA';
    case 'moon':
      return 'LUNA';
    case 'minor-body':
      return 'CUERPO MENOR';
  }
}

function minorBodyKindLabel(
  body:
    SystemSceneMinorBodySnapshot,
): string {
  switch (
    body.minorBodyKind
  ) {
    case MinorBodyKind.ASTEROID:
      return 'ASTEROIDE';
    case MinorBodyKind.COMET:
      return 'COMETA';
    case MinorBodyKind.TRANS_NEPTUNIAN_OBJECT:
      return 'OBJETO TRANSNEPTUNIANO';
    case MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT:
      return 'OBJETO EXTRASOLAR CAPTURADO';
    default:
      return 'CUERPO MENOR';
  }
}

function orbitKindLabel(
  orbit:
    SystemSceneOrbitSnapshot | null,
): string | null {
  if (
    orbit ===
      null
  ) {
    return null;
  }

  switch (
    orbit.kind
  ) {
    case 'stellar':
      return 'ÓRBITA ESTELAR';
    case 'planetary':
      return 'ÓRBITA PLANETARIA';
    case 'moon':
      return 'ÓRBITA LUNAR';
    case 'minor-body':
      return 'ÓRBITA DE CUERPO MENOR';
  }
}

function riskSeverityLabel(
  severity:
    SystemSceneOrbitalRiskTargetSnapshot['severity'],
): string {
  switch (
    severity
  ) {
    case 'CROSSING':
      return 'CRUCE RADIAL';
    case 'APPROACH':
      return 'APROXIMACIÓN';
    case 'COLLISION_GEOMETRY':
      return 'COLISIÓN GEOMÉTRICA';
  }
}
