import { describe, expect, it, vi, afterEach } from 'vitest';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { PlanetGenerator } from '../planetary/planet-generator';
import { AtmosphereGenerator } from '../planetary/atmosphere-generator';
import { MoonGenerator } from '../planetary/moon-generator';
import { PlanetScientificTargetResolver } from '../planetary/planet-scientific-target-resolver';
import { PlanetaryHistoricalRuntime31Fi1 } from './planetary-historical-runtime-31-f-i-1';
import { PlanetaryClimateGeochemistryHistoryResolver32_6 } from './planetary-climate-geochemistry-history-resolver-32-6';
import { PlanetaryEnvironmentalEvolution31Fh, type DatedEnvironmentalForcing31Fh } from './planetary-environmental-evolution-31-f-h';
import { PlanetaryHistoricalPhysicalForcingProducer31Fi2 } from './planetary-historical-physical-forcing-producer-31-f-i-2';

const source = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1,
);
const locator = new BodyLocator(3n, -17n, 8n, 0n);
const bodyKey = 'G3/S-17/O8/B0';
const dated = (time = 4.6) => {
  const context = { bodyKind: 'PLANET' as const, bodyKey, multiplicity: 'SINGLE' as const,
    time: { kind: 'CURRENT_SNAPSHOT' as const, systemAgeBillionYears: time } };
  return {
    epoch: { context, provenance: { sourcePhase: 'EXTERNAL_DATED_PHYSICAL_SOURCE',
      sourceModel: 'INDEPENDENT_CT0_AGE', sourceRecordKey: 'dated-system-age-1',
      temporalSupport: 'DATED_SYSTEM_AGE_CT0' as const } },
    query: { context, version: { universeKey: 'independent-universe',
      physicsModelRevision: 'dated-physical-v1', sourceRevision: 'physical-episodes-r1' },
      startYear: 100, endYear: 149 },
  };
};
const thermal: DatedEnvironmentalForcing31Fh = {
  startYear: 100, endYear: 119,
  provenance: { sourcePhase: 'TEST_ONLY_INDEPENDENT_THERMAL_SOURCE',
    sourceModel: 'DATED_RADIATIVE_BOUNDARY_MODEL', sourceRecordKey: 'test-thermal-100',
    temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_FORCING' },
  stellarFluxWattsPerSquareMeter: { min: 1361, max: 1361 },
  bondAlbedo01: { min: .3, max: .3 },
  additionalHeatWattsPerSquareMeter: { min: 0, max: 0 },
  longwaveEmissivity01: { min: .61, max: .61 },
  effectiveHeatCapacityJoulesPerSquareMeterKelvin: { min: 1e9, max: 1e9 },
  initialMeanTemperatureKelvin: { min: 289, max: 300 },
  initialTemperatureSource: { sourceModel: 'DATED_EPOCH_TEMPERATURE', sourceRecordKey: 'test-initial-100',
    atYear: 100, temporalSupport: 'DATED_PHYSICAL_INITIAL_TEMPERATURE' },
};
afterEach(() => vi.restoreAllMocks());

describe('31.F.i.1 — production current-state history boundary', () => {
  it('conecta 32.6 y 31.F.g con la atmósfera 20.x REAL, sin regenerar ni filtrar al DTO', () => {
    const planets = vi.spyOn(PlanetGenerator, 'generate');
    const atmos = vi.spyOn(AtmosphereGenerator, 'generate');
    const moons = vi.spyOn(MoonGenerator, 'generate');
    const climate = vi.spyOn(PlanetaryClimateGeochemistryHistoryResolver32_6, 'resolve');
    const target = PlanetScientificTargetResolver.resolveDetailed(source, locator)!;
    expect(target).not.toBeNull();
    expect(planets).toHaveBeenCalledTimes(1);
    expect(atmos).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
    expect(climate).toHaveBeenCalledTimes(1);
    expect(climate.mock.calls[0]![0].atmosphere).toBe(atmos.mock.results[0]!.value);
    expect(climate.mock.calls[0]![0].time.systemAgeBillionYears).toBeNull();
    expect(PlanetaryHistoricalRuntime31Fi1.inspect(target)?.currentClimate).toBe('MATERIALIZED_32_6');
    expect(PlanetaryHistoricalRuntime31Fi1.inspect(target)?.environmentalHistory).toBe('UNKNOWN');
    expect(JSON.stringify(target.detail)).not.toMatch(/31\.F\.i\.1|SOURCE_BACKED_BOUNDED|thermalEnvelopes|SIMULATED_REALITY|lifePresence/);
    expect(planets).toHaveBeenCalledTimes(1);
    expect(atmos).toHaveBeenCalledTimes(1);
    expect(moons).toHaveBeenCalledTimes(1);
  }, 60_000);

  it('sin edad fechada no puede reconstruir un pasado, aunque el clima actual esté calculado', () => {
    const target = PlanetScientificTargetResolver.resolveDetailed(source, locator)!;
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), epoch: { ...dated().epoch, context: { ...dated().epoch.context,
        time: { kind: 'CURRENT_SNAPSHOT', systemAgeBillionYears: null } } },
    })).toThrow(/dated CT-0/);
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), epoch: { ...dated().epoch, provenance: { ...dated().epoch.provenance,
        sourceModel: '32.6' } },
    })).toThrow(/dated CT-0/);
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), epoch: { ...dated().epoch, context: { ...dated().epoch.context,
        bodyKey: 'G3/S-17/O8/B1' } },
    })).toThrow(/dated CT-0/);
  }, 60_000);

  it('una edad de prueba independiente, sin forzamientos históricos, deja toda la ventana desconocida', () => {
    const target = PlanetScientificTargetResolver.resolveDetailed(source, locator)!;
    const result = PlanetaryHistoricalRuntime31Fi1.reconstruct(target, dated());
    expect(result.certification.verdict).toBe('NO_CERTIFIED_ENVIRONMENTAL_TRAJECTORIES');
    expect(result.certification.certifiedContinuousIntervals).toBe(0);
    expect(result.physical.windows.routes[0].compatibleWindows).toEqual([]);
    expect(result.physical.windows.routes[0].uncoveredIntervals).toEqual([{startYear:100,endYear:149}]);
    expect(result.physical.lifePresence).toBe('NOT_EVALUATED');
    expect(PlanetaryHistoricalRuntime31Fi1.reconstruct(target, dated())).toEqual(result);
  }, 60_000);

  it('31.F.h recibe solamente forzamientos fechados externos y no confunde temperatura con vida', () => {
    const target = PlanetScientificTargetResolver.resolveDetailed(source, locator)!;
    const run = vi.spyOn(PlanetaryEnvironmentalEvolution31Fh.prototype, 'readInterval');
    const result = PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), forcing: { sourceRevision: 'independent-thermal-r1', stepYears: 10,
        intervals: [thermal] },
    });
    expect(result.certification.verdict).toBe('CONDITIONAL_DATED_THERMAL_ENVELOPES');
    expect(result.certification.certifiedContinuousIntervals).toBe(0);
    expect(result.certification.historicalCoverage).toBe('PARTIAL');
    expect(result.physical.windows.routes[0].compatibleWindows).toEqual([]);
    expect(result.physical.windows.routes[0].uncoveredIntervals).toEqual([
      {startYear:120,endYear:149},
    ]);
    expect(run).toHaveBeenCalled();
    expect(result.physical.lifePresence).toBe('NOT_EVALUATED');
  }, 60_000);

  it('un host físico especial sin contrato 32.6 no rompe la ficha ni inventa una estrella SINGLE', () => {
    const target = {} as never;
    const planet = { locator, hostPlanetarySystem: { hostStellarSystem: { multiplicity: null } } } as never;
    const atmosphere = { hostPlanet: planet } as never;
    expect(() => PlanetaryHistoricalRuntime31Fi1.attach(target, planet, atmosphere)).not.toThrow();
    expect(PlanetaryHistoricalRuntime31Fi1.inspect(target)?.currentClimate)
      .toBe('SOURCE_NOT_COMPATIBLE_WITH_32_6');
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, dated()))
      .toThrow(/no compatible materialized/i);
  });

  it('31.F.i.2 se ejecuta desde una ficha materializada real, sin convertir flujo estelar en paleoclima', () => {
    const target = PlanetScientificTargetResolver.resolveDetailed(source, locator)!;
    const ctx = dated().epoch.context;
    const p = (key: string) => ({ sourcePhase: 'DATED_PHYSICAL_ORBITAL_SOURCE',
      sourceModel: 'CONTINUOUS_STELLAR_AND_ORBITAL_MODEL', sourceRecordKey: key,
      temporalSupport: 'CONTINUOUS_DATED_PHYSICAL_MODEL' as const });
    const physicalHistory = { context: ctx, sourceRevision: dated().query.version.sourceRevision,
      intervals: [{ startYear: 100, endYear: 119, hosts: [{ label: 'A' as const,
        luminositySolar: { min: 0.8, max: 0.9 },
        distanceAu: { min: 1.4, max: 1.5 },
        luminositySource: p('actual-host-dated-luminosity'),
        orbitalSource: { ...p('actual-body-dated-orbit'), bodyKey },
      }] }],
    };
    const irradiance = PlanetaryHistoricalPhysicalForcingProducer31Fi2.produce(physicalHistory);
    expect(irradiance.irradiance).toHaveLength(1);
    expect(irradiance.forcing).toHaveLength(0);
    const result = PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), physicalHistory,
    });
    expect(result.certification.verdict).toBe('NO_CERTIFIED_ENVIRONMENTAL_TRAJECTORIES');
    expect(result.physical.windows.routes[0].compatibleWindows).toEqual([]);
    expect(result.physical.windows.routes[0].uncoveredIntervals)
      .toEqual([{ startYear: 100, endYear: 149 }]);
    expect(result.physical.lifePresence).toBe('NOT_EVALUATED');
    expect(JSON.stringify(target.detail)).not.toContain('actual-host-dated-luminosity');
    // Independent environmental and episode catalogs legitimately use different revisions.
    const anotherRevision = PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), physicalHistory: { ...physicalHistory, sourceRevision: 'stellar-orbital-physics-r2' },
    });
    expect(anotherRevision.certification.certifiedContinuousIntervals).toBe(0);
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), physicalHistory: { ...physicalHistory, context: { ...ctx, bodyKey: 'FOREIGN_BODY' } },
    })).toThrow(/another planet or moon|identity/);
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...dated(), forcing: { sourceRevision: 'manual', stepYears: 10, intervals: [] }, physicalHistory,
    })).toThrow(/competing/);
  }, 60_000);

  it('no permite consultar una ficha ajena como origen de historia privada', () => {
    const target = PlanetScientificTargetResolver.resolveDetailed(source, locator)!;
    const request = dated();
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct(target, {
      ...request, query: { ...request.query, context: { ...request.query.context,
        bodyKey: 'G3/S-17/O8/B1' } },
    })).toThrow(/matching source/);
    expect(() => PlanetaryHistoricalRuntime31Fi1.reconstruct({ ...target }, request))
      .toThrow(/no compatible materialized/i);
  }, 60_000);
});
