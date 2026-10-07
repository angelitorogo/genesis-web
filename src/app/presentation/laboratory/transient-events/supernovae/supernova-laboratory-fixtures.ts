import {
  type SupernovaEventProfile,
} from '../../../../domain/transient/supernova-event-profile';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorProfile,
} from '../../../../domain/transient/supernova-progenitor';
import {
  SupernovaType,
  type SupernovaType as SupernovaTypeValue,
} from '../../../../domain/transient/supernova-type';
import {
  SupernovaEventEngine,
} from '../../../../simulation/transient/supernova-event-engine';

export interface SupernovaLaboratoryCase {
  readonly id: SupernovaTypeValue;
  readonly shortLabel: string;
  readonly title: string;
  readonly progenitorLabel: string;
  readonly envelopeLabel: string;
  readonly description: string;
  readonly profile: SupernovaEventProfile;
}

function makeCase(
  id: SupernovaTypeValue,
  shortLabel: string,
  title: string,
  progenitorLabel: string,
  envelopeLabel: string,
  description: string,
  progenitor: SupernovaProgenitorProfile,
): SupernovaLaboratoryCase {
  return Object.freeze({
    id,
    shortLabel,
    title,
    progenitorLabel,
    envelopeLabel,
    description,
    profile: SupernovaEventEngine.deriveProfile(progenitor),
  });
}

export const SUPERNOVA_LABORATORY_CASES = Object.freeze([
  makeCase(
    SupernovaType.TYPE_IA,
    'Ia',
    'Supernova termonuclear Tipo Ia',
    'Enana blanca C/O próxima al límite termonuclear',
    'Sin envoltura H/He superviviente',
    'Disrupción termonuclear del progenitor compacto. No deja estrella compacta central; la eyección rica en productos de combustión alimenta el remanente.',
    new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF,
      5.2,
      1.38,
      1.0,
      0,
      0,
      1.38,
    ),
  ),
  makeCase(
    SupernovaType.TYPE_II,
    'II',
    'Supernova de colapso Tipo II',
    'Supergigante masiva con núcleo colapsable',
    'Envoltura de hidrógeno conservada',
    'Colapso de núcleo con envoltura rica en hidrógeno. El modelo conserva una meseta fotométrica aproximada antes del declive radiactivo.',
    new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.CORE_COLLAPSE,
      18,
      13,
      1.0,
      0.46,
      0.28,
      null,
    ),
  ),
  makeCase(
    SupernovaType.TYPE_IB,
    'Ib',
    'Supernova de colapso Tipo Ib',
    'Estrella masiva despojada de H',
    'Helio conservado; hidrógeno residual mínimo',
    'Colapso de núcleo de un progenitor despojado de hidrógeno pero todavía rico en helio. No se fuerza una meseta de Tipo II.',
    new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.CORE_COLLAPSE,
      22,
      6.5,
      1.2,
      0.02,
      0.34,
      null,
    ),
  ),
  makeCase(
    SupernovaType.TYPE_IC,
    'Ic',
    'Supernova de colapso Tipo Ic',
    'Estrella masiva fuertemente despojada',
    'H y He superficiales casi ausentes',
    'Colapso de núcleo con envolturas de hidrógeno y helio prácticamente eliminadas. La eyección es más compacta y la curva cae sin meseta.',
    new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.CORE_COLLAPSE,
      30,
      7.5,
      0.8,
      0.005,
      0.025,
      null,
    ),
  ),
] as const);
