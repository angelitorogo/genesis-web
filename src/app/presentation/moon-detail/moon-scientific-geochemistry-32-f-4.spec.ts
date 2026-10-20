import type { MoonGeochemicalEnergy32F4 } from '../../domain/planetary/moon-geochemical-energy-32-f-4';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ObservedHabitabilityFiche31Fe } from '../scientific/observed-habitability-fiche-31-f-e';
import { lunarGeochemistryFields32F4 } from './moon-scientific-sections';

const model: MoonGeochemicalEnergy32F4 = {
  contractVersion: '32.F.4-chemical-constraints-and-thermal-gradients-v1',
  provenance: 'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS',
  hostPlanetOrdinal: 8, moonOrdinal: 3,
  solventState: 'MODELLED_LIQUID_H2O_CT0', otherSolventSpeciation: 'UNRESOLVED',
  modeledLiquidH2OMassKilograms: 2.141e20, modeledLiquidLayerThicknessKilometers: 89.28,
  modeledOceanTopPressurePascal: 1e5, modeledOceanBottomPressurePascal: 9e7,
  modeledOceanTopTemperatureKelvin: 260, modeledOceanBottomTemperatureKelvin: 262,
  modeledWaterRockContact: 'LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES',
  directSilicateWaterInterfaceAreaSquareMeters: null,
  generatedHeatFluxWattsPerSquareMeter: .1144, generatedGlobalHeatPowerWatts: 3.5e11,
  iceConductiveGradientKelvinPerKilometer: 45.76,
  idealThermalWorkUpperBoundWatts: 2.7e9,
  redoxReactantActivities: null, dissolvedMineralComposition: null,
  dissolvedOxidantInventoryMoles: null, pH: null, salinity: null,
  actualChemicalDisequilibriumJoulesPerMole: null, actualChemicalPowerWatts: null,
  reactions: [
    { pathway: 'WATER_SILICATE_ALTERATION_H2_CANDIDATE',
      referenceStoichiometry: '3 FeO + H₂O → Fe₃O₄ + H₂ (hipótesis)',
      applicability: 'NOT_ESTABLISHED_WITH_CURRENT_COMPOSITION_OR_ENERGY',
      missingInputs: ['minerales'], actualReactionGibbsJoulesPerMole: null,
      actualReactionRateMolesPerSecond: null, extractableChemicalPowerWatts: null },
  ],
  scientificLimits: [],
};
const target = (chemistry: MoonGeochemicalEnergy32F4): MoonScientificResolvedTarget => ({
  detail: { environment: {
    geochemicalEnergy32F4: chemistry,
    estimatedSurfaceTemperatureKelvin: 235.7,
    waterRegime: 'ICE_AND_SUBSURFACE_OCEAN', waterInventoryIndex01: .87,
    subsurfaceOceanPotentialIndex01: 1,
    atmosphereAssessment: null, internalWaterAssessment: null,
  } },
} as unknown as MoonScientificResolvedTarget);

describe('32.F.4 — ficha geoquímica y frontera de conocimiento', () => {
  it('presenta fuente térmica y rutas químicas sin equipararlas a energía biológica', () => {
    const fields = lunarGeochemistryFields32F4(model);
    expect(fields.find(x => x.label.startsWith('Solvente H₂O'))?.value).toContain('2,141E20');
    expect(fields.find(x => x.label.startsWith('Otros posibles solventes'))?.value).toBe('Composición no identificada');
    expect(fields.find(x => x.label.includes('Contacto agua-roca'))?.value).toContain('condensables');
    expect(fields.find(x => x.label.includes('Potencia térmica interior'))?.value).toContain('W globales');
    expect(fields.find(x => x.label.includes('Gradiente térmico'))?.value).toContain('K/km');
    expect(fields.find(x => x.label.includes('Desequilibrio redox'))?.value).toBe('No cuantificados');
    expect(fields.find(x => x.label.startsWith('Ruta de reacción'))?.note).toContain('Fe₃O₄');
    expect(JSON.stringify(fields)).not.toContain('habitabilidad confirmada');
  });
  it('sin modelo físico o solvente no inventa reacciones ni potencia química', () => {
    expect(lunarGeochemistryFields32F4(null)).toHaveLength(0);
    const fields = lunarGeochemistryFields32F4({ ...model,
      solventState: 'UNRESOLVED_H2O_STATE', modeledLiquidH2OMassKilograms: null,
      modeledLiquidLayerThicknessKilometers: null,
      generatedGlobalHeatPowerWatts: null, generatedHeatFluxWattsPerSquareMeter: null,
      iceConductiveGradientKelvinPerKilometer: null,
      modeledOceanTopTemperatureKelvin: null, modeledOceanBottomTemperatureKelvin: null,
      modeledOceanTopPressurePascal: null, modeledOceanBottomPressurePascal: null,
    });
    expect(fields.find(x => x.label.startsWith('Solvente H₂O'))?.value).toBe('Fase de H₂O no resuelta');
    expect(fields.find(x => x.label.includes('Potencia térmica interior'))?.value).toBe('No resuelta');
  });
  it('CONFIRMED muestra el flujo térmico como dato, pero conserva química/energía observada desconocidas', () => {
    const shown = ObservedHabitabilityFiche31Fe.moon(target(model),
      DiscoveryState.CONFIRMED, true, 'G0/S0/O0/B8/M2', 'SINGLE');
    expect(shown?.routes.find(r => r.label === 'Agua líquida subsuperficial')?.facts.some(
      f => f.label.includes('Flujo térmico interior CT-0'))).toBe(true);
    const criteria = shown?.routes.find(r => r.label === 'Agua líquida subsuperficial')?.criteria ?? [];
    expect(criteria.find(c => c.label === 'Viabilidad química')?.status).toBe('Desconocido');
    expect(criteria.find(c => c.label === 'Gradiente energético')?.status).toBe('Desconocido');
  });
  it('sin CONFIRMED o sin permiso prohíbe lectura de la geoquímica privada', () => {
    const guarded = new Proxy({} as MoonScientificResolvedTarget, {
      get() { throw new Error('Geoquímica privada filtrada'); },
    });
    expect(ObservedHabitabilityFiche31Fe.moon(guarded,
      DiscoveryState.CATALOGUED, true, 'G0/S0/O0/B8/M2', 'SINGLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(guarded,
      DiscoveryState.CONFIRMED, false, 'G0/S0/O0/B8/M2', 'SINGLE')).toBeNull();
  });
});
