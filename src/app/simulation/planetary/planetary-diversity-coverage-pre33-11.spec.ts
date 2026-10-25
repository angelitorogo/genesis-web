import { describe, expect, it } from 'vitest';
import { PlanetType } from '../../domain/planetary/planet-type';
import type { CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactPlanetaryHost } from '../../domain/stellar/compact-planetary-host';
import { PlanetaryDiversityCoveragePRE3311 as Coverage } from './planetary-diversity-coverage-pre33-11';

/**
 * Complete 31.2 contract, not a partial structural cast.
 * The deliberately failing Roche screen is the ONLY tested orbital invalidity;
 * host, epoch and secondary-population metadata remain valid typed inputs.
 */
function compactRocheFailureFixture(): CompactHostPlanetarySystem {
  const locator = new SystemLocator(0n, 0n, 0n);
  const host = new CompactPlanetaryHost({
    generationKey: new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
      GeneratorVersion.V2,
    ),
    systemLocator: locator,
    type: ExtremeType.NEUTRON_STAR,
    scientificState: {
      activityRegime: 'QUIESCENT',
      massSolar: 1.4,
      thermalLuminositySolar: null,
      highEnergyLuminositySolar: null,
      accretionLuminositySolar: null,
      surfaceMagneticFieldTesla: null,
      rotationPeriodSeconds: null,
    },
  });
  return {
    modelVersion: 'COMPACT_HOST_SNAPSHOT_31_2_V1',
    host,
    architecture: 'SINGLE',
    orbitalAssessment: 'KEPLER_ROCHE_MUTUAL_HILL_SCREEN',
    status: 'SNAPSHOT_MODEL_UNVALIDATED_N_BODY',
    planets: [{
      locator: new BodyLocator(0n, 0n, 0n, 0n),
      ordinal: 1,
      bulkKind: 'ROCKY',
      massEarth: 1,
      radiusEarth: 1,
      meanDensityKgM3: 5515,
      semiMajorAxisAu: 0.01,
      eccentricity: 0.1,
      periastronAu: 0.009,
      apoastronAu: 0.011,
      orbitalPeriodDays: 0.3087,
      rocheLimitAu: 0.0095,
    }],
    // No environmental or historical evidence is evaluated by Coverage.compact.
    environments: [],
    characterizations: [],
    secondaries: {
      version: 'COMPACT_SECONDARIES_31_4G_V1',
      moons: [],
      minorBodies: [],
      debrisBelts: [],
      assessment: 'ROCHE_HILL_AND_PLANET_CLEARANCE_SCREEN_NOT_N_BODY',
    },
  };
}

describe('PRE-33.11 — cobertura de familias sin fabricar habitabilidad', () => {
  it('cubre los nueve fenotipos existentes, no inventa una superficie de gigante', () => {
    for (const type of Object.values(PlanetType)) {
      const niche = Coverage.familyDomain(type);
      const envelope = ['MINI_NEPTUNE', 'GAS_GIANT', 'ICE_GIANT'].includes(type);
      expect(niche).toBe(envelope ? 'DEEP_ENVELOPE' : 'SOLID_BASE');
    }
    expect(Object.values(PlanetType)).toHaveLength(9);
    // OCEAN is a POINT-19 phenotype only: not proof of a measured liquid ocean.
    expect(Coverage.familyDomain(PlanetType.OCEAN)).toBe('SOLID_BASE');
  });
  it('no acepta taxonomías inexistentes para simular cobertura', () => {
    expect(() => Coverage.familyDomain('LIFE_BEARING' as PlanetType)).toThrow();
  });
  it('compacto con planeta físico bajo límite Roche recibe el diagnóstico, no una HZ', () => {
    const compact = compactRocheFailureFixture();
    const reports = Coverage.compact(compact);
    expect(reports).toHaveLength(1);
    expect(reports[0]?.issues).toEqual(['COMPACT_ORBIT_ROCHE_SCREEN']);
    expect(reports[0]?.biology).toBe('NOT_EVALUATED');
    expect(reports[0]?.niche).toBe('COMPACT_SNAPSHOT');
  });
});
