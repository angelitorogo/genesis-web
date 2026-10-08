import { type NovaEventProfile } from '../../../../domain/transient/nova-event-profile';
import {
  NovaProgenitorProfile,
  NovaWhiteDwarfComposition,
} from '../../../../domain/transient/nova-progenitor';
import { NovaType, type NovaType as NovaTypeValue } from '../../../../domain/transient/nova-type';
import { NovaEventEngine } from '../../../../simulation/transient/nova-event-engine';

export interface NovaLaboratoryCase {
  readonly id: NovaTypeValue;
  readonly shortLabel: string;
  readonly title: string;
  readonly description: string;
  readonly profile: NovaEventProfile;
}

function makeCase(
  id: NovaTypeValue,
  shortLabel: string,
  title: string,
  description: string,
  progenitor: NovaProgenitorProfile,
): NovaLaboratoryCase {
  const profile = NovaEventEngine.deriveProfile(progenitor);
  if (profile.type !== id) throw new RangeError(`Nova laboratory fixture ${id} classified as ${profile.type}.`);
  return Object.freeze({ id, shortLabel, title, description, profile });
}

export const NOVA_LABORATORY_CASES = Object.freeze([
  makeCase(
    NovaType.CLASSICAL,
    'N',
    'Nova clásica',
    'Enana blanca C/O con acreción sostenida y una envoltura acumulada suficientemente masiva para una ignición termonuclear superficial. La enana blanca sobrevive.',
    new NovaProgenitorProfile(
      0.84,
      0.72,
      1.0,
      0.82,
      2.2e-10,
      8.0e-5,
      NovaWhiteDwarfComposition.CARBON_OXYGEN,
    ),
  ),
  makeCase(
    NovaType.RECURRENT,
    'RN',
    'Nova recurrente',
    'Enana blanca masiva con acreción más intensa. La masa crítica de ignición es menor y el ciclo se repite en décadas, sin destruir el remanente compacto.',
    new NovaProgenitorProfile(
      1.30,
      1.15,
      1.0,
      0.16,
      1.1e-7,
      5.5e-6,
      NovaWhiteDwarfComposition.CARBON_OXYGEN,
    ),
  ),
] as const);
