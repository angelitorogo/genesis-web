import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { StellarMultihostFormation } from '../stellar/stellar-multihost-formation';
import { PlanetaryV2DatedPhysics31Fi3 } from '../planetary-history/planetary-v2-dated-physics-31-f-i-3';
import { MoonEnvironmentalHistoryEngine32F5 } from './moon-environmental-history-engine-32-f-5';
import { lunarEnvironmentalHistoryFields32F5 } from '../../presentation/moon-detail/moon-scientific-sections';

/** Physical, no extra seeds: an already-materialized ordinary 0.35 M☉ host. */
const source = (mass = .35, age = 11.590601773, phase = 'MAIN_SEQUENCE') => {
  const locator = {galaxyIndex: 0n, sectorKey: -3n, galacticObjectIndex: 1n, bodyIndex: 8n};
  const physical = {initialMassSolar: mass, luminositySolar: .018};
  const lifetime = {ageBillionYears: age, evolutionAssessment: {
    input: {initialMassSolar: mass}, evolutionState: {name: phase},
    mainSequenceLifetimeBillionYears: 150,
  }};
  const planet = {locator, planetOrdinal: 9, orbit:{periastronAu: 2.0, apoastronAu: 2.4},
    hostPlanetarySystem: {architecture:{orbitTopology: 'CIRCUMSTELLAR'},
      formationBlueprint:{formationCompletionAgeMillionYears:20},
      hostStellarSystem:{multiplicity:{name:'SINGLE'},
        primaryReferenceLuminositySolar:.018,
        primaryStar:{evolutionState:{name:phase}},
        secondaryCompanion:null,tertiaryCompanion:null,
      },
    },
  };
  const moon = {hostPlanetLocator:locator, hostPlanetOrdinal:9,moonOrdinal:3,
    orbit:{semiMajorAxisKilometers:190000, eccentricity:.04},
    oceanReality32F2c:{hostPlanetOrdinal:9,moonOrdinal:3,
      state:'PRESENT_IN_SIMULATED_MODEL',waterInventoryKilograms:2.165e20,
      generatedTotalSurfaceHeatFluxWattsPerSquareMeter:.1144},
    geochemicalEnergy32F4:{moonOrdinal:3},
  };
  return { planet:planet as never, moons:{hostPlanet:planet,relevantMoons:[moon]} as never,
    primary:{physical,lifetime} as never, moon:moon as never };
};

describe('32.F.5a — alimentación real de las historias físicas lunares', () => {
  it('materializa irradiación fechada para un anfitrión MS de baja masa de 11,59 Gyr', () => {
    const input = source();
    const retained = PlanetaryV2DatedPhysics31Fi3.fromMaterialized(input);
    const past = retained.moons[0];
    expect(past.conditionalIrradianceStatus32F5a).toBe('MODELLED_MS_CONDITIONAL');
    expect(past.irradiation.irradiance.length).toBeGreaterThan(1);
    expect(past.irradiation.irradiance[0].startYear).toBeGreaterThan(100_000_000);
    expect(past.irradiation.irradiance.at(-1)?.endYear).toBe(retained.ageYearsCT0);
    expect(past.source.intervals[0].hosts[0].luminositySource.sourceModel)
      .toBe('LOW_MASS_MS_LUMINOSITY_SENSITIVITY_ENVELOPE_NOT_TRACK');
    expect(past.irradiation.irradiance[0].wattsPerSquareMeter.min).toBeGreaterThan(0);
    expect(past.irradiation.irradiance[0].wattsPerSquareMeter.max)
      .toBeGreaterThan(past.irradiation.irradiance[0].wattsPerSquareMeter.min);
    const history = MoonEnvironmentalHistoryEngine32F5.fromMaterialized(
      input.moon, past, retained.ageYearsCT0);
    expect(history.datedIrradianceIntervalCount).toBeGreaterThan(1);
    const heated = history.intervals.filter(i => i.idealRadiativeEquilibriumKelvin32F5a);
    expect(heated.length).toBeGreaterThan(1);
    expect(heated.every(i => i.idealRadiativeEquilibriumKelvin32F5a!.min > 0 &&
      i.idealRadiativeEquilibriumKelvin32F5a!.max >= i.idealRadiativeEquilibriumKelvin32F5a!.min)).toBe(true);
    expect(history.intervals.every(i => i.heatFluxWattsPerSquareMeter === null &&
      i.surfaceTemperatureKelvin === null && i.oceanState === 'UNKNOWN')).toBe(true);
    const fields = lunarEnvironmentalHistoryFields32F5(history);
    expect(fields.find(f => f.label.startsWith('Equilibrio radiativo ideal'))?.value)
      .toContain('tramos calculados');
    expect(fields.find(f => f.label.startsWith('Evolución de océanos'))?.value)
      .toContain('No resuelta');
    expect(PlanetaryV2DatedPhysics31Fi3.fromMaterialized(input)).toEqual(retained);
  });

  it('una estrella de baja masa joven no recibe una historia ZAMS ficticia', () => {
    const input = source(.14, .04);
    const past = PlanetaryV2DatedPhysics31Fi3.fromMaterialized(input).moons[0];
    expect(past.conditionalIrradianceStatus32F5a).toBe('TOO_YOUNG_OR_FORMING');
    expect(past.irradiation.irradiance).toEqual([]);
    const history = MoonEnvironmentalHistoryEngine32F5.fromMaterialized(input.moon, past,40_000_000);
    expect(history.datedIrradianceIntervalCount).toBe(0);
    expect(history.intervals[0].idealRadiativeEquilibriumKelvin32F5a).toBeNull();
  });

  it('no extiende irradiación a través de un remanente ni de un evento orbital irresuelto', () => {
    const dead = source(.35, 11.590601773,'STELLAR_BLACK_HOLE');
    const world = PlanetaryV2DatedPhysics31Fi3.fromMaterialized(dead).moons[0];
    expect(world.conditionalIrradianceStatus32F5a).toBe('HOST_NOT_MAIN_SEQUENCE');
    expect(world.irradiation.irradiance).toEqual([]);
    const input = source();
    const disrupted = PlanetaryV2DatedPhysics31Fi3.fromMaterialized({
      ...input, unresolvedEvents:[{startYear:2_000_000_000,endYear:2_010_000_000,
        sourceRecordKey:'resolved-dated-physical-event-1'}],
    }).moons[0];
    expect(disrupted.irradiation.irradiance.every(i => i.endYear < 2_000_000_000)).toBe(true);
    const history = MoonEnvironmentalHistoryEngine32F5.fromMaterialized(
      input.moon,disrupted,11_590_601_773);
    expect(history.intervals.at(-1)?.idealRadiativeEquilibriumKelvin32F5a).toBeNull();
    expect(history.historicalOceanContinuity).toBe('UNKNOWN');
  });

  it('producción real V2 SINGLE: reutiliza estrella, planeta y lunas existentes sin regenerar CT-0', () => {
    const key = new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2);
    const host = StellarMultihostFormation.generateV2SingleOrNull(
      key, new SystemLocator(0n, 0n, 1n));
    expect(host).not.toBeNull();
    expect(host!.physical.initialMassSolar).toBeGreaterThan(.075);
    expect(host!.physical.initialMassSolar).toBeLessThan(.8);
    const planetIndex = host!.moonSystems.findIndex(x => x.relevantMoons.length > 0);
    expect(planetIndex).toBeGreaterThan(-1);
    const actual = PlanetaryV2DatedPhysics31Fi3.fromMaterialized({
      planet: host!.planets[planetIndex], moons: host!.moonSystems[planetIndex],
      primary: {physical: host!.physical, lifetime: host!.lifetime},
    });
    const lunar = host!.moonSystems[planetIndex].relevantMoons[0];
    const history = MoonEnvironmentalHistoryEngine32F5.fromMaterialized(
      lunar, actual.moons[0], actual.ageYearsCT0);
    expect(history.datedIrradianceIntervalCount).toBeGreaterThan(0);
    expect(history.currentOceanStateCT0).toBe(
      lunar.oceanReality32F2c!.state === 'PRESENT_IN_SIMULATED_MODEL' ? 'PRESENT'
        : lunar.oceanReality32F2c!.state === 'ABSENT_IN_SIMULATED_MODEL' ? 'ABSENT'
          : 'UNRESOLVED');
    expect(history.historicalOceanContinuity).toBe('UNKNOWN');
    expect(history.intervals.every(x => x.surfacePressurePascal === null &&
      x.heatFluxWattsPerSquareMeter === null)).toBe(true);
  }, 120_000);

  it('la geometría incoherente no se convierte en una trayectoria física', () => {
    const input = source();
    (input.planet as unknown as {orbit:{periastronAu:number}}).orbit.periastronAu = -2;
    const world = PlanetaryV2DatedPhysics31Fi3.fromMaterialized(input).moons[0];
    expect(world.conditionalIrradianceStatus32F5a).toBe('UNSUPPORTED_ORBIT_GEOMETRY');
    expect(world.irradiation.irradiance).toEqual([]);
  });
});
