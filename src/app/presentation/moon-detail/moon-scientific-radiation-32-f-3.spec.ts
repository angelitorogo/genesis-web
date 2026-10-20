import { DiscoveryState } from '../../domain/discovery/discovery-state';
import type { MoonRadiationProtection32F3 } from '../../domain/planetary/moon-radiation-protection-32-f-3';
import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { ObservedHabitabilityFiche31Fe } from '../scientific/observed-habitability-fiche-31-f-e';
import { lunarRadiationFields32F3 } from './moon-scientific-sections';

const model: MoonRadiationProtection32F3 = {
  contractVersion: '32.F.3-source-separated-photon-transfer-v1',
  provenance: 'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE',
  hostPlanetOrdinal: 8, moonOrdinal: 3,
  referenceBolometricWattsPerSquareMeter: 887.372,
  ionisingPhotonIncidentWattsPerSquareMeter: null,
  energeticParticleIncidentWattsPerSquareMeter: null,
  surfaceIonisingDoseGrayPerYear: null,
  subsurfaceIonisingDoseGrayPerYear: null,
  atmosphericColumnKilogramsPerSquareMeter: null,
  magneticParticleTransmission01: null,
  waterCoveringState: 'ICE_COVER_OVER_MODELLED_OCEAN',
  iceCoverThicknessMeters: 817.4,
  iceCoverMassColumnKilogramsPerSquareMeter: 760182,
  referenceOneMeVGammaIceOpticalDepth: 5376.007,
  referenceOneMeVGammaDirectTransmissionToOcean01: 0,
  referenceOneMeVGammaDirectTransmissionToOceanBase01: 0,
  scientificLimits: [],
};
const target = (radiation: MoonRadiationProtection32F3): MoonScientificResolvedTarget => ({
  detail: { environment: {
    radiationProtection32F3: radiation,
    estimatedSurfaceTemperatureKelvin: 235.7,
    waterRegime: 'ICE_AND_SUBSURFACE_OCEAN',
    waterInventoryIndex01: .87,
    subsurfaceOceanPotentialIndex01: 1,
    atmosphereAssessment: null,
    internalWaterAssessment: null,
  } },
} as unknown as MoonScientificResolvedTarget);

describe('32.F.3 — proyección observada de radiación bajo CONFIRMED', () => {
  it('separa referencia 1 MeV del flujo/dosis real en español', () => {
    const fields = lunarRadiationFields32F3(model);
    expect(fields.find(x => x.label.includes('Irradiancia estelar total'))?.value).toContain('W/m²');
    expect(fields.find(x => x.label.includes('Fuente ionizante incidente'))?.value).toBe('No cuantificada');
    expect(fields.find(x => x.label.includes('Cubierta protectora'))?.value).toContain('kg/m²');
    expect(fields.find(x => x.label.includes('Atenuación fotónica'))?.value).toContain('10⁻³⁰⁰');
    expect(fields.find(x => x.label.includes('Atenuación fotónica'))?.note).toContain('1 MeV');
    expect(fields.find(x => x.label.includes('Exposición radiativa real'))?.value).toContain('Desconocida');
    expect(JSON.stringify(fields)).not.toContain('Seguro para la vida');
  });
  it('modelo sin océano no obtiene cubierta de hielo ficticia', () => {
    const fields = lunarRadiationFields32F3({ ...model,
      waterCoveringState: 'NOT_RESOLVED_FOR_SHIELDING',
      iceCoverThicknessMeters: null, iceCoverMassColumnKilogramsPerSquareMeter: null,
      referenceOneMeVGammaIceOpticalDepth: null,
      referenceOneMeVGammaDirectTransmissionToOcean01: null,
      referenceOneMeVGammaDirectTransmissionToOceanBase01: null,
    });
    expect(fields.find(x => x.label.includes('Cubierta protectora'))?.value).toBe('No determinada');
    expect(fields.find(x => x.label.includes('Atenuación fotónica'))?.value).toContain('No evaluable');
  });
  it('CONFIRMED publica la geometría del mundo modelado sin promocionar exposición a Compatible', () => {
    const shown = ObservedHabitabilityFiche31Fe.moon(target(model),
      DiscoveryState.CONFIRMED, true, 'G0/S0/O0/B8/M2', 'TRIPLE');
    expect(shown?.routes.some(r => r.facts.some(f =>
      f.label.includes('Profundidad óptica de referencia') && f.origin === 'Inferencia condicional CT-0'))).toBe(true);
    expect(shown?.routes.find(r => r.label === 'Agua líquida subsuperficial')?.criteria
      .find(c => c.label === 'Exposición radiativa')?.status).toBe('Desconocido');
  });
  it('ficha no CONFIRMED o sin permiso no lee propiedades privadas', () => {
    const secret = new Proxy({} as MoonScientificResolvedTarget, {
      get() { throw new Error('Premature private radiation disclosure'); },
    });
    expect(ObservedHabitabilityFiche31Fe.moon(secret,
      DiscoveryState.CATALOGUED, true, 'G0/S0/O0/B8/M2', 'SINGLE')).toBeNull();
    expect(ObservedHabitabilityFiche31Fe.moon(secret,
      DiscoveryState.CONFIRMED, false, 'G0/S0/O0/B8/M2', 'SINGLE')).toBeNull();
  });
});
