import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { ObservedHabitabilityFiche31Fe } from '../scientific/observed-habitability-fiche-31-f-e';
import { labelOceanModelReason32F2c, lunarOceanRealityFields32F2c } from './moon-scientific-sections';

const ocean = (state: MoonOceanReality32F2c['state']): MoonOceanReality32F2c => ({
  contractVersion: '32.F.2c-seeded-interior-ocean-model-v1',
  provenance: 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION',
  hostPlanetOrdinal: 1, moonOrdinal: 1, state,
  reason: state === 'PRESENT_IN_SIMULATED_MODEL' ? 'SUBSURFACE_LIQUID_IN_GENERATED_MODEL'
    : state === 'ABSENT_IN_SIMULATED_MODEL' ? 'ICE_STABLE_IN_GENERATED_MODEL' : 'MISSING_TIDAL_HEAT',
  generatedTidalFluxWattsPerSquareMeter: .001,
  generatedRadiogenicSpecificPowerWattsPerKilogramRock: 1e-12,
  generatedRadiogenicFluxWattsPerSquareMeter: .0001,
  generatedTotalSurfaceHeatFluxWattsPerSquareMeter: .0011,
  assumedIceConductivityWattsPerMeterKelvin: 2.5,
  assumedOceanAdiabaticTemperatureGradientKelvinPerPascal: 1.2e-8,
  meltingDiagram: 'APPROX_PURE_H2O_IH_III_V_VI_0_TO_2_GPA',
  surfaceTemperatureKelvin: 235.7,
  waterInventoryKilograms: 1e20,
  pressureAtWaterShellBasePascal: 1e8,
  waterShellThicknessKilometers: 100,
  iceCoverThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? 12 : null,
  liquidLayerThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? 88 : null,
  highPressureIceThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? 0 : null,
  simulatedLiquidWaterMassKilograms: state === 'PRESENT_IN_SIMULATED_MODEL' ? 8.8e19 : null,
  simulatedSolidWaterMassKilograms: state === 'PRESENT_IN_SIMULATED_MODEL' ? 1.2e19 : null,
  radialLayers: [],
  scientificLimits: [],
});
const target = (model: MoonOceanReality32F2c): MoonScientificResolvedTarget => ({
  // A constitutive CT-0 reservoir belongs to one physical moon. The 32.F.6b
  // bridge correctly refuses to grant it to a partial or mismatched identity.
  // Match the V3 physical identity in this fixture without changing production.
  physicalHostPlanetOrdinal: 1,
  identity: { designation: 'luna confidencial', hostPlanetOrdinal: 1, moonOrdinal: 1 },
  detail: { environment: {
    estimatedSurfaceTemperatureKelvin: 235.7,
    waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
    waterInventoryIndex01: .7,
    subsurfaceOceanPotentialIndex01: .7,
    internalWaterAssessment: null,
    atmosphereAssessment: null,
    oceanReality32F2c: model,
  } },
} as unknown as MoonScientificResolvedTarget);

describe('32.F.2c — confirmación del sistema desbloquea el conocimiento oceánico de lunas relevantes', () => {
  it('la ficha muestra el estado CT-0 de la realidad generada con su procedencia y geometría', () => {
    const fields = lunarOceanRealityFields32F2c(ocean('PRESENT_IN_SIMULATED_MODEL'));
    expect(fields.find(f => f.label.includes('universo simulado'))?.value).toContain('presente');
    expect(fields.find(f => f.label.includes('Geometría oceánica'))?.value).toContain('12');
    expect(fields.find(f => f.label.includes('Balance hídrico'))?.note).toContain('no se ha creado agua');
    expect(fields.find(f => f.label.includes('universo simulado'))?.note).not.toContain('medido');
  });
  it('32.F.2c.b: los ocho motivos del dominio CT-0 tienen etiquetas legibles en español', () => {
    const reasons: readonly MoonOceanReality32F2c['reason'][] = [
      'NO_FORMATION_H2O', 'ICE_STABLE_IN_GENERATED_MODEL',
      'SUBSURFACE_LIQUID_IN_GENERATED_MODEL',
      'TEMPERATE_SURFACE_WITH_UNRESOLVED_CONFINEMENT',
      'MISSING_TIDAL_HEAT', 'HIGH_PRESSURE_PHASE_OUTSIDE_DOMAIN',
      'THERMAL_TRANSPORT_OUTSIDE_DOMAIN', 'UNRESOLVED_INTERFACE',
    ];
    for (const reason of reasons) {
      const label = labelOceanModelReason32F2c(reason);
      expect(label).toBeTruthy();
      expect(label).not.toContain('_');
      expect(label).not.toMatch(/generated model|thermal transport|surface with/i);
    }
    const absentFields = lunarOceanRealityFields32F2c(ocean('ABSENT_IN_SIMULATED_MODEL'));
    expect(absentFields.find(f => f.label === 'Salinidad del océano CT-0')?.value)
      .toContain('No aplica');
  });
  it('CONFIRMED muestra el reservorio del mundo simulado sin descubrimiento lunar separado', () => {
    const shown = ObservedHabitabilityFiche31Fe.moon(target(ocean('PRESENT_IN_SIMULATED_MODEL')),
      DiscoveryState.CONFIRMED, true, 'G0/S0/O0/B0/M0', 'TRIPLE');
    const subsurface = shown?.routes.find(x => x.label === 'Agua líquida subsuperficial');
    expect(subsurface?.facts.some(f => f.label.includes('realidad simulada') &&
      f.value.includes('Presente'))).toBe(true);
    expect(subsurface?.criteria.find(x => x.label === 'Reservorio líquido')?.status).toBe('Compatible');
    expect(subsurface?.criteria.find(x => x.label === 'Geometría del reservorio')?.origin).toBe('Modelo físico');
    expect(subsurface?.criteria.find(x => x.label === 'Viabilidad química')?.status).toBe('Desconocido');
    expect(subsurface?.criteria.find(x => x.label === 'Temperatura')?.explanation)
      .toContain('presencia del océano proviene del modelo constitutivo CT-0');
    expect(JSON.stringify(shown)).not.toContain('luna confidencial');
  });
  it('ausencia modelada se muestra como incompatibilidad hídrica, no como imposibilidad de vida', () => {
    const shown = ObservedHabitabilityFiche31Fe.moon(target(ocean('ABSENT_IN_SIMULATED_MODEL')),
      DiscoveryState.CONFIRMED, true, 'G0/S0/O0/B0/M0', 'SINGLE');
    const subsurface = shown?.routes.find(x => x.label === 'Agua líquida subsuperficial');
    expect(subsurface?.criteria.find(x => x.label === 'Reservorio líquido')?.status).toBe('Incompatible');
    expect(subsurface?.criteria.find(x => x.label === 'Viabilidad química')?.status).toBe('Desconocido');
  });
  it('modelo fuera del dominio conserva la incertidumbre, no fuerza yes/no', () => {
    const shown = ObservedHabitabilityFiche31Fe.moon(target(ocean('UNRESOLVED_IN_SIMULATED_MODEL')),
      DiscoveryState.CONFIRMED, true, 'G0/S0/O0/B0/M0', 'SINGLE');
    expect(shown?.routes[1].criteria.find(x => x.label === 'Reservorio líquido')?.status).toBe('Desconocido');
    expect(shown?.routes[1].facts.some(f => f.value.includes('No resuelto'))).toBe(true);
  });
  it('no atribuye un océano físico a una luna sin identidad completa', () => {
    const incomplete = {
      ...target(ocean('PRESENT_IN_SIMULATED_MODEL')),
      physicalHostPlanetOrdinal: undefined,
      identity: { designation: 'luna confidencial' },
    } as unknown as MoonScientificResolvedTarget;
    const shown = ObservedHabitabilityFiche31Fe.moon(incomplete,
      DiscoveryState.CONFIRMED, true, 'G0/S0/O0/B0/M0', 'SINGLE');
    const subsurface = shown?.routes.find(x => x.label === 'Agua líquida subsuperficial');
    expect(subsurface?.criteria.find(x => x.label === 'Reservorio líquido')?.status).toBe('Desconocido');
    expect(subsurface?.facts.some(f => f.label.includes('realidad simulada'))).toBe(false);
  });
  it('no revela nada antes de CONFIRMED ni cuando la ficha está desautorizada', () => {
    const secret = new Proxy({} as MoonScientificResolvedTarget, {
      get: () => { throw new Error('Private moon evaluated before confirmation'); },
    });
    expect(ObservedHabitabilityFiche31Fe.moon(secret, DiscoveryState.CATALOGUED,
      true, 'G0/S0/O0/B0/M0', 'SINGLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(secret, DiscoveryState.CONFIRMED,
      false, 'G0/S0/O0/B0/M0', 'SINGLE')).toBeNull();
  });
});
