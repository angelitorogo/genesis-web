import {
  generateMultihostCircumstellarHabitableZonesV23,
} from './multihost-circumstellar-habitable-zone-generator';
import {
  PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR,
  PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR,
} from './planetary-system-habitable-zone-generator';
import { type MultihostStableWindow } from '../../domain/planetary/multihost-planetary-catalog';

function window(hostId: 'A' | 'B', outer: number): MultihostStableWindow {
  return Object.freeze({
    hostId, family: 'S_TYPE' as const,
    gravitatingMassSolar: 1, innerStableAu: 0.05,
    outerStableAu: outer, referenceOuterAu: outer,
    usable: true, limitation: 'test',
  });
}

describe('V2.3 binary local HZ: reuse V1 flux thresholds without fabricated stability', () => {
  it('computes independent radiative edges from A and B luminosities', () => {
    const result = generateMultihostCircumstellarHabitableZonesV23(
      [window('A', 12), window('B', 12)], {A: 1, B: 0.25},
    );
    expect(result.map(zone => zone.hostId)).toEqual(['A', 'B']);
    expect(result[0]!.radiativeInnerEdgeAu).toBeCloseTo(
      Math.sqrt(1 / PLANETARY_HABITABLE_ZONE_V1_INNER_EFFECTIVE_FLUX_SOLAR), 12);
    expect(result[0]!.radiativeOuterEdgeAu).toBeCloseTo(
      Math.sqrt(1 / PLANETARY_HABITABLE_ZONE_V1_OUTER_EFFECTIVE_FLUX_SOLAR), 12);
    expect(result[1]!.radiativeInnerEdgeAu).toBeCloseTo(result[0]!.radiativeInnerEdgeAu / 2, 12);
    expect(result[1]!.radiativeOuterEdgeAu).toBeCloseTo(result[0]!.radiativeOuterEdgeAu / 2, 12);
    expect(result[0]!.dynamicalOverlapFraction01).toBe(1);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.every(Object.isFrozen)).toBe(true);
  });

  it('keeps an observable radiative reference but no green stable ring when the S window ends inside it', () => {
    const result = generateMultihostCircumstellarHabitableZonesV23(
      [window('A', 0.20), window('B', 0.3)], {A: 1, B: 1},
    );
    expect(result).toHaveLength(2);
    for (const zone of result) {
      expect(zone.dynamicallyHabitableInnerEdgeAu).toBeNull();
      expect(zone.dynamicallyHabitableOuterEdgeAu).toBeNull();
      expect(zone.dynamicalOverlapFraction01).toBe(0);
    }
  });

  it('clips only the dynamical intersection while keeping radiative AU unchanged', () => {
    const full = generateMultihostCircumstellarHabitableZonesV23(
      [window('A', 30)], {A: 1},
    )[0]!;
    const partial = generateMultihostCircumstellarHabitableZonesV23(
      [window('A', (full.radiativeInnerEdgeAu + full.radiativeOuterEdgeAu) / 2)],
      {A: 1},
    )[0]!;
    expect(partial.radiativeOuterEdgeAu).toBe(full.radiativeOuterEdgeAu);
    expect(partial.dynamicallyHabitableInnerEdgeAu).toBe(full.radiativeInnerEdgeAu);
    expect(partial.dynamicallyHabitableOuterEdgeAu).toBeLessThan(full.radiativeOuterEdgeAu);
    expect(partial.dynamicalOverlapFraction01).toBeCloseTo(0.5, 12);
  });

  it('does not invent a zone from absent or invalid stellar luminosity', () => {
    expect(generateMultihostCircumstellarHabitableZonesV23(
      [window('A', 4), window('B', 4)], {A: null, B: Number.NaN},
    )).toHaveLength(0);
  });
});
