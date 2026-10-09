import { describe, expect, it } from 'vitest';
import {
  TidalDisruptionEncounterProfile,
  TidalDisruptionVictimKind,
} from '../../domain/transient/tidal-disruption-encounter-profile';
import { TidalDisruptionEventEngine } from './tidal-disruption-event-engine';

describe('29.6 tidal-disruption integration boundary', () => {
  it('requires explicit victim and encounter geometry rather than creating a TDE from a bare massive black hole', () => {
    expect(TidalDisruptionEventEngine.deriveProfile.length).toBe(1);
    const explicit = new TidalDisruptionEncounterProfile(
      TidalDisruptionVictimKind.MAIN_SEQUENCE_STAR,
      1e6,
      1,
      1,
      1.1,
    );
    expect(TidalDisruptionEventEngine.deriveProfile(explicit).penetrationFactorBeta).toBe(1.1);
  });

  it('keeps 29.6 source-frame and non-persisted until GENESIS owns a canonical stellar encounter', () => {
    const explicit = new TidalDisruptionEncounterProfile(
      TidalDisruptionVictimKind.WHITE_DWARF,
      1e4,
      0.6,
      0.012,
      1.35,
    );
    const profile = TidalDisruptionEventEngine.deriveProfile(explicit);
    expect(profile.observedFluxWattsPerSquareMeter).toBeNull();
    expect(profile.blackHoleSpinDimensionless).toBeNull();
  });
});
