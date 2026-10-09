import {
  GammaRayBurstEventProfile,
} from '../../../../domain/transient/gamma-ray-burst-event-profile';
import {
  GammaRayBurstJetState,
  GammaRayBurstProgenitorKind,
  GammaRayBurstSourceProfile,
} from '../../../../domain/transient/gamma-ray-burst-source-profile';
import { GammaRayBurstEventEngine } from '../../../../simulation/transient/gamma-ray-burst-event-engine';

export const GammaRayBurstLaboratoryCaseId = Object.freeze({
  SHORT_NS_NS: 'SHORT_NS_NS',
  SHORT_NS_BH_UNRESOLVED: 'SHORT_NS_BH_UNRESOLVED',
  LONG_COLLAPSAR_ON_AXIS: 'LONG_COLLAPSAR_ON_AXIS',
  SHORT_OFF_AXIS_REFERENCE: 'SHORT_OFF_AXIS_REFERENCE',
  CHOKED_COLLAPSAR: 'CHOKED_COLLAPSAR',
} as const);
export type GammaRayBurstLaboratoryCaseId =
  typeof GammaRayBurstLaboratoryCaseId[keyof typeof GammaRayBurstLaboratoryCaseId];

export interface GammaRayBurstLaboratoryCase {
  readonly id: GammaRayBurstLaboratoryCaseId;
  readonly shortLabel: string;
  readonly title: string;
  readonly description: string;
  readonly profile: GammaRayBurstEventProfile;
  readonly isCollapsar: boolean;
  readonly rightJetPoints: string;
  readonly leftJetPoints: string;
  readonly observerLine: string | null;
  readonly timelineBreakoutX: number | null;
  readonly timelineExternalStartX: number | null;
}

function makeCase(
  id: GammaRayBurstLaboratoryCaseId,
  shortLabel: string,
  title: string,
  description: string,
  source: GammaRayBurstSourceProfile,
): GammaRayBurstLaboratoryCase {
  const profile = GammaRayBurstEventEngine.deriveProfile(source);
  const isCollapsar =
    source.progenitorKind === GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR;
  const successful = profile.twoSidedJetSkyFraction !== null;
  const choked = source.jetState === GammaRayBurstJetState.CHOKED_JET_CONFIRMED;
  const jetLength = successful ? 176 : choked ? 78 : 0;
  const opening = source.jetHalfOpeningAngleDegrees ?? 0;
  const halfHeight = Math.min(92, Math.tan(opening * Math.PI / 180) * jetLength);

  const rightJetPoints = jetLength > 0
    ? `260,175 ${260 + jetLength},${175 - halfHeight} ${260 + jetLength},${175 + halfHeight}`
    : '';
  const leftJetPoints = jetLength > 0
    ? `260,175 ${260 - jetLength},${175 - halfHeight} ${260 - jetLength},${175 + halfHeight}`
    : '';

  const observerLine = source.observerAngleToNearestJetAxisDegrees === null
    ? null
    : observerPath(source.observerAngleToNearestJetAxisDegrees);

  const timeline = timelineGeometry(profile);

  return Object.freeze({
    id,
    shortLabel,
    title,
    description,
    profile,
    isCollapsar,
    rightJetPoints,
    leftJetPoints,
    observerLine,
    timelineBreakoutX: timeline.breakoutX,
    timelineExternalStartX: timeline.externalStartX,
  });
}

export const GAMMA_RAY_BURST_LABORATORY_CASES = Object.freeze([
  makeCase(
    GammaRayBurstLaboratoryCaseId.SHORT_NS_NS,
    'NS–NS corto',
    'Motor GRB corto tras una fusión NS–NS',
    'El jet relativista está especificado de forma explícita para aislar la física de 29.7. La orientación del observador no se conoce, por lo que un GRB prompt observado no se da por hecho.',
    new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
      GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
      0.45,
      8,
      120,
      null,
      null,
      null,
    ),
  ),
  makeCase(
    GammaRayBurstLaboratoryCaseId.SHORT_NS_BH_UNRESOLVED,
    'NS–BH',
    'NS–BH: la fusión existe, el GRB no se inventa',
    '29.4 puede resolver la fusión NS–BH sin conocer el spin. 29.7 necesita además saber si se forma y lanza un jet relativista; mientras ese dato falte, el canal GRB permanece sin resolver.',
    new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_BH,
      GammaRayBurstJetState.JET_LAUNCH_UNRESOLVED,
      null,
      null,
      null,
      null,
      null,
      null,
    ),
  ),
  makeCase(
    GammaRayBurstLaboratoryCaseId.LONG_COLLAPSAR_ON_AXIS,
    'Collapsar largo',
    'GRB largo de un progenitor despojado',
    'Referencia explícita de collapsar: el motor dura más que el tiempo de propagación del jet a través de la estrella. La línea de visión de este fixture cae dentro del cono, pero energía y flujo siguen sin inventarse.',
    new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR,
      GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
      35,
      6,
      150,
      3,
      1.1,
      0.25,
    ),
  ),
  makeCase(
    GammaRayBurstLaboratoryCaseId.SHORT_OFF_AXIS_REFERENCE,
    'Off-axis ref.',
    'Jet intrínseco presente, prompt fuera del eje',
    'La fuente conserva un motor GRB corto intrínseco, pero la línea de visión explícita del fixture queda fuera del cono del jet. Esto no equivale a ausencia del evento ni autoriza a inventar un afterglow.',
    new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COMPACT_MERGER_NS_NS,
      GammaRayBurstJetState.RELATIVISTIC_JET_CONFIRMED,
      0.7,
      7,
      100,
      25,
      null,
      null,
    ),
  ),
  makeCase(
    GammaRayBurstLaboratoryCaseId.CHOKED_COLLAPSAR,
    'Jet ahogado',
    'Collapsar con jet ahogado dentro de la estrella',
    'El motor se apaga antes del tiempo de breakout calculado. Puede existir actividad interna, pero bajo este modelo no emerge un jet relativista externo y no se etiqueta como GRB clásico.',
    new GammaRayBurstSourceProfile(
      GammaRayBurstProgenitorKind.COLLAPSAR_STRIPPED_STAR,
      GammaRayBurstJetState.CHOKED_JET_CONFIRMED,
      4,
      10,
      null,
      null,
      1.8,
      0.18,
    ),
  ),
] as const);

function observerPath(angleDegrees: number): string {
  const length = 200;
  const radians = angleDegrees * Math.PI / 180;
  const x = 260 + Math.cos(radians) * length;
  const y = 175 - Math.sin(radians) * length;
  return `M 260 175 L ${x.toFixed(2)} ${y.toFixed(2)}`;
}

function timelineGeometry(profile: GammaRayBurstEventProfile): {
  readonly breakoutX: number | null;
  readonly externalStartX: number | null;
} {
  const duration = profile.engineActivityDurationSeconds;
  const breakout = profile.stellarBreakoutTimeSeconds;
  if (duration === null || breakout === null) {
    return { breakoutX: null, externalStartX: null };
  }
  const startX = 42;
  const width = 430;
  const ratio = Math.max(0, Math.min(1, breakout / duration));
  const breakoutX = startX + width * ratio;
  return {
    breakoutX,
    externalStartX: profile.sourceFrameExternalJetActivitySeconds === null
      ? null
      : breakoutX,
  };
}
