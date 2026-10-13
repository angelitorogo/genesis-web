import { ExtremeType } from '../galactic-object/extreme-object-type';
import { SystemLocator, GalacticObjectLocator } from '../generation/procedural-locator';
import { GeneratorVersion } from '../generation/generator-version';
import { UniverseGenerationKey } from '../generation/universe-generation-key';
import { UniverseSeed } from '../universe/universe-seed';
import {
  COMPACT_PLANETARY_HOST_TYPES,
  COMPACT_PLANETARY_HOST_DEFINITIONS,
  CompactPlanetaryHost,
  isCompactPlanetaryHostType,
  type CompactPlanetaryHostInput,
} from './compact-planetary-host';

describe('31.1 compact planetary host contract (snapshot)', () => {
  const key = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
    GeneratorVersion.V2,
  );
  const base: CompactPlanetaryHostInput = {
    generationKey: key,
    systemLocator: new SystemLocator(2n, -11n, 8n),
    type: ExtremeType.PULSAR,
    extremeObjectLocator: new GalacticObjectLocator(2n, -13n, 6n),
    scientificState: {
      activityRegime: 'PULSED',
      massSolar: 1.43,
      thermalLuminositySolar: null,
      highEnergyLuminositySolar: null,
      accretionLuminositySolar: null,
      surfaceMagneticFieldTesla: null,
      rotationPeriodSeconds: 0.53,
    },
  };

  it('registers precisely five exclusive physical types, not activities, nuclei or structures', () => {
    expect(COMPACT_PLANETARY_HOST_TYPES).toEqual([
      'NEUTRON_STAR', 'PULSAR', 'MILLISECOND_PULSAR', 'MAGNETAR', 'STELLAR_MASS_BLACK_HOLE',
    ]);
    expect(new Set(COMPACT_PLANETARY_HOST_TYPES).size).toBe(5);
    for (const type of COMPACT_PLANETARY_HOST_TYPES) {
      expect(isCompactPlanetaryHostType(type)).toBe(true);
      expect(COMPACT_PLANETARY_HOST_DEFINITIONS[type].type).toBe(type);
      expect(Object.isFrozen(COMPACT_PLANETARY_HOST_DEFINITIONS[type])).toBe(true);
      expect(Object.isFrozen(COMPACT_PLANETARY_HOST_DEFINITIONS[type].possibleEmissionChannels)).toBe(true);
    }
    for (const invalid of ['AGN', 'QUASAR', 'SMBH', 'ULX', 'SUPERNOVA_REMNANT', 'X_RAY_BINARY_NS']) {
      expect(isCompactPlanetaryHostType(invalid)).toBe(false);
    }
  });

  it('does not mistake possible emission for measured activity', () => {
    expect(COMPACT_PLANETARY_HOST_DEFINITIONS.STELLAR_MASS_BLACK_HOLE.possibleEmissionChannels).toEqual(['ACCRETION']);
    expect(COMPACT_PLANETARY_HOST_DEFINITIONS.MAGNETAR.possibleEmissionChannels).toContain('MAGNETIC_ACTIVITY');
    const host = new CompactPlanetaryHost(base);
    expect(host.scientificState.highEnergyLuminositySolar).toBeNull();
    expect(Object.isFrozen(host)).toBe(true);
    expect(Object.isFrozen(host.scientificState)).toBe(true);
    expect(host.extremeObjectLocator).toBeInstanceOf(GalacticObjectLocator);
  });

  it('rejects invalid physics, mixed galaxies and historical/source-only types', () => {
    expect(() => new CompactPlanetaryHost({ ...base, type: ExtremeType.QUASAR as never })).toThrow();
    expect(() => new CompactPlanetaryHost({ ...base, extremeObjectLocator: new GalacticObjectLocator(3n, 1n, 2n) })).toThrow();
    expect(() => new CompactPlanetaryHost({ ...base, scientificState: { ...base.scientificState, massSolar: Number.NaN } })).toThrow();
    expect(() => new CompactPlanetaryHost({ ...base, scientificState: { ...base.scientificState, highEnergyLuminositySolar: -1 } })).toThrow();
    expect(() => new CompactPlanetaryHost({ ...base, scientificState: { ...base.scientificState, rotationPeriodSeconds: 0 } })).toThrow();
    expect(() => new CompactPlanetaryHost({ ...base, type: ExtremeType.STELLAR_MASS_BLACK_HOLE, scientificState: { ...base.scientificState, thermalLuminositySolar: 2 } })).toThrow();
  });

  it('supports a quiet black hole without inventing an accretion disk or photosphere', () => {
    const blackHole = new CompactPlanetaryHost({
      ...base,
      type: ExtremeType.STELLAR_MASS_BLACK_HOLE,
      scientificState: {
        activityRegime: 'QUIESCENT',
        massSolar: 9,
        thermalLuminositySolar: 0,
        highEnergyLuminositySolar: 0,
        accretionLuminositySolar: 0,
        surfaceMagneticFieldTesla: null,
        rotationPeriodSeconds: null,
      },
    });
    expect(blackHole.scientificState.accretionLuminositySolar).toBe(0);
    expect(COMPACT_PLANETARY_HOST_DEFINITIONS.STELLAR_MASS_BLACK_HOLE.accretionRequiredForAccretionEmission).toBe(true);
  });
});
