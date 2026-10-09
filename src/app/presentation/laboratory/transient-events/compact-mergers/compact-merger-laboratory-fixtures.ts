import { type CompactMergerEventProfile } from '../../../../domain/transient/compact-merger-event-profile';
import { CompactMergerProgenitorProfile } from '../../../../domain/transient/compact-merger-progenitor';
import { CompactMergerType, type CompactMergerType as CompactMergerTypeValue } from '../../../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from '../../../../simulation/transient/compact-merger-event-engine';

export interface CompactMergerLaboratoryCase {
  readonly id: CompactMergerTypeValue;
  readonly shortLabel: string;
  readonly title: string;
  readonly description: string;
  readonly profile: CompactMergerEventProfile;
}
function makeCase(id: CompactMergerTypeValue, shortLabel: string, title: string, description: string, progenitor: CompactMergerProgenitorProfile): CompactMergerLaboratoryCase {
  const profile = CompactMergerEventEngine.deriveProfile(progenitor);
  if (profile.type !== id) throw new RangeError('Compact-merger laboratory fixture type mismatch.');
  return Object.freeze({ id, shortLabel, title, description, profile });
}
export const COMPACT_MERGER_LABORATORY_CASES = Object.freeze([
  makeCase(
    CompactMergerType.NEUTRON_STAR_NEUTRON_STAR,
    'NS–NS',
    'Fusión de dos estrellas de neutrones',
    'El canal comparte exactamente el presupuesto de masa ya validado en 29.3: la fusión es el evento dinámico y la kilonova es su contraparte electromagnética.',
    new CompactMergerProgenitorProfile(CompactMergerType.NEUTRON_STAR_NEUTRON_STAR, 1.38, 1.27, 12.1, 0.006778517936238559, 0.08, 1.4e8),
  ),
  makeCase(
    CompactMergerType.NEUTRON_STAR_BLACK_HOLE,
    'NS–BH',
    'Fusión estrella de neutrones–agujero negro',
    'La fusión puede resolverse sin inventar spin. La posible disrupción tidal y una kilonova asociada siguen sin resolverse mientras falten spin y orientación Kerr.',
    new CompactMergerProgenitorProfile(CompactMergerType.NEUTRON_STAR_BLACK_HOLE, 1.42, 8.6, 12.2, 0.0082, 0.05, 4.2e7),
  ),
  makeCase(
    CompactMergerType.BLACK_HOLE_BLACK_HOLE,
    'BH–BH',
    'Fusión de dos agujeros negros estelares',
    'Canal compacto sin eyección material ni contraparte electromagnética prompt en 29.4. La forma de onda y observables gravitacionales se reservan expresamente para 29.5.',
    new CompactMergerProgenitorProfile(CompactMergerType.BLACK_HOLE_BLACK_HOLE, 32, 27, null, 0.014, 0.03, 6.8e8),
  ),
] as const);
