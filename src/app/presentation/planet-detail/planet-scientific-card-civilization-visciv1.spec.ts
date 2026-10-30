import { resolveConfirmedPlanetCivilizationTierV1 } from './planet-scientific-card';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';

describe('VISCIV.1 — civilization lighting respects confirmed observed knowledge', () => {
  const record = (tier: 'PRIMITIVE' | 'ADVANCED' | 'VERY_ADVANCED' | null,
    nativeCivilizationPresent = true,
    civilizationPresent = true,
  ): Vida9BiologyRecord => ({
    revealPolicy: 'FULL_SYSTEM_REVEAL_ON_CONFIRMED',
    nativeCivilizationPresent,
    intelligence: {
      civilizationPresent,
      civilization: tier === null ? null : { tier },
    },
  } as unknown as Vida9BiologyRecord);

  it('never reveals lights without a confirmed native civilization', () => {
    expect(resolveConfirmedPlanetCivilizationTierV1(undefined)).toBeNull();
    expect(resolveConfirmedPlanetCivilizationTierV1(record('ADVANCED', false))).toBeNull();
    expect(resolveConfirmedPlanetCivilizationTierV1(record('ADVANCED', true, false))).toBeNull();
    expect(resolveConfirmedPlanetCivilizationTierV1(record(null))).toBeNull();
  });

  it('only forwards the tier explicitly recorded by the confirmed VIDA.9 record', () => {
    expect(resolveConfirmedPlanetCivilizationTierV1(record('PRIMITIVE'))).toBe('PRIMITIVE');
    expect(resolveConfirmedPlanetCivilizationTierV1(record('ADVANCED'))).toBe('ADVANCED');
    expect(resolveConfirmedPlanetCivilizationTierV1(record('VERY_ADVANCED'))).toBe('VERY_ADVANCED');
  });
});
