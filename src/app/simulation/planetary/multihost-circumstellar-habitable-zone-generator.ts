import {
  type MultihostStableWindow,
} from '../../domain/planetary/multihost-planetary-catalog';
import {
  PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
  PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
} from './planetary-system-habitable-zone-generator';

/**
 * A per-component, V1-consistent stellar-flux REFERENCE, not a claim of
 * time-resolved binary insolation, climate or permanent orbital stability.
 */
export interface MultihostCircumstellarHabitableZoneV23 {
  readonly hostId: 'A' | 'B';
  readonly source: 'V1_FLUX_REFERENCE_V23';
  readonly referenceLuminositySolar: number;
  readonly radiativeInnerEdgeAu: number;
  readonly radiativeOuterEdgeAu: number;
  readonly dynamicallyHabitableInnerEdgeAu: number | null;
  readonly dynamicallyHabitableOuterEdgeAu: number | null;
  readonly dynamicalOverlapFraction01: number;
  readonly limitation: string;
}

/**
 * Reuse the frozen 18.6 V1 flux thresholds separately for A/B; intersect with
 * the V2.1 S-type host window. The companion's time-varying irradiation and
 * secular stability have NOT been solved; do not turn the reference into an
 * authoritative habitable-world classification or force a stable overlap.
 */
export function generateMultihostCircumstellarHabitableZonesV23(
  windows: readonly MultihostStableWindow[],
  luminosities: Readonly<Partial<Record<'A' | 'B', number | null>>>,
): readonly MultihostCircumstellarHabitableZoneV23[] {
  const result: MultihostCircumstellarHabitableZoneV23[] = [];
  for (const hostId of ['A', 'B'] as const) {
    const window = windows.find(value => value.hostId === hostId && value.family === 'S_TYPE');
    const luminosity = luminosities[hostId];
    if (window === undefined || luminosity == null ||
        !Number.isFinite(luminosity) || luminosity <= 0) continue;
    const radiativeInnerEdgeAu = Math.sqrt(
      luminosity / PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR);
    const radiativeOuterEdgeAu = Math.sqrt(
      luminosity / PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR);
    // A null outer bound means no calibrated dynamical cutoff, NOT infinity in
    // the empirical S-type fit. Do not use the arbitrary sampling horizon to
    // claim additional stability.
    const inner = Math.max(radiativeInnerEdgeAu, window.innerStableAu);
    const outer = Math.min(radiativeOuterEdgeAu,
      window.outerStableAu ?? Number.POSITIVE_INFINITY);
    // "usable" is a PLANET-FORMATION sampling threshold (span >= 1.55),
    // not a criterion for whether a narrower HZ can intersect this window.
    const overlap = Number.isFinite(inner) &&
      Number.isFinite(outer) && outer > inner;
    result.push(Object.freeze({
      hostId,
      source: 'V1_FLUX_REFERENCE_V23' as const,
      referenceLuminositySolar: luminosity,
      radiativeInnerEdgeAu,
      radiativeOuterEdgeAu,
      dynamicallyHabitableInnerEdgeAu: overlap ? inner : null,
      dynamicallyHabitableOuterEdgeAu: overlap ? outer : null,
      dynamicalOverlapFraction01: overlap
        ? (outer - inner) / (radiativeOuterEdgeAu - radiativeInnerEdgeAu)
        : 0,
      limitation: 'Referencia V1 de flujo de la estrella anfitriona, recortada por ventana S-type aproximada V2.1. No incluye irradiación variable de la compañera, evolución estelar ni estabilidad secular N-body.',
    }));
  }
  return Object.freeze(result);
}
