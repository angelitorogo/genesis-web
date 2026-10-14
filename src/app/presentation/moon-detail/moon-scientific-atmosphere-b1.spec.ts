import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import { type MoonTidalState } from '../../domain/planetary/moon-tidal-state';
import { MoonAtmosphereEngine } from '../../simulation/planetary/moon-atmosphere-engine';
import {
  labelLunarAtmosphere,
  lunarAtmosphereFields,
} from './moon-scientific-sections';

function lunarScenario(
  massEarth: number,
  radiusEarth: number,
  densityGramsPerCubicCentimeter: number,
  surfaceGravityEarth: number,
  surfaceTemperatureKelvin: number,
  tidalHeatingIndex01: number,
  iceRichnessIndex01: number,
  irradiationReferenceEarth: number,
) {
  return MoonAtmosphereEngine.assess(
    new MoonPhysicalProperties(
      1, 1, massEarth, radiusEarth,
      densityGramsPerCubicCentimeter, surfaceGravityEarth,
    ),
    {
      hostPlanetOrdinal: 1,
      moonOrdinal: 1,
      tidalHeatingIndex01,
    } as MoonTidalState,
    surfaceTemperatureKelvin,
    iceRichnessIndex01,
    irradiationReferenceEarth,
  );
}

function valueOf(
  fields: ReturnType<typeof lunarAtmosphereFields>,
  label: string,
): string | undefined {
  return fields.find(field => field.label === label)?.value;
}

describe('B.1 — coherencia de la clasificación atmosférica lunar', () => {
  it('relabels a warm large moon with a resolved CO2/SO2 column by its pressure rather than the legacy exosphere proxy', () => {
    // Pioleria e I-like physical inputs from B; no seed or body special case.
    const assessment = lunarScenario(0.055, 0.448, 3.38, 0.274, 541.3, 0.413, 0.11, 15.762);
    expect(assessment.pressureBasis).toBe('CONDITIONAL_SCENARIO');
    expect(assessment.estimatedSurfacePressurePascal).toBeGreaterThan(100);
    expect(assessment.estimatedSurfacePressurePascal).toBeLessThan(10_000);
    expect(assessment.species.length).toBeGreaterThan(0);

    const snapshot = JSON.stringify(assessment);
    expect(labelLunarAtmosphere('EXOSPHERE', assessment)).toBe('Atmósfera tenue (escenario)');
    const fields = lunarAtmosphereFields(assessment);
    expect(valueOf(fields, 'Presión superficial atmosférica (escenario)')).toContain('bar');
    expect(valueOf(fields, 'Composición gaseosa candidata')).toContain('CO₂');
    expect(valueOf(fields, 'Condensación de gases candidatos')).toBe('Sin condensación apreciable');
    expect(JSON.stringify(assessment)).toBe(snapshot); // presentation cannot change physics
  });

  it('does not claim a gas column or zero condensation for a small cold moon without a resolved pressure', () => {
    // Aaeviar B-6 I-like inputs: legacy label TRACE is not a measured gas column.
    const assessment = lunarScenario(0.000718, 0.11, 2.94, 0.059, 92.4, 0.768, 0.33, 0.004);
    expect(assessment.pressureBasis).toBe('UNRESOLVED');
    expect(assessment.estimatedSurfacePressurePascal).toBeNull();
    expect(assessment.species).toEqual([]);

    expect(labelLunarAtmosphere('TRACE', assessment)).toBe('Columna atmosférica no resuelta');
    const fields = lunarAtmosphereFields(assessment);
    expect(valueOf(fields, 'Presión superficial atmosférica (escenario)')).toBe('No determinada');
    expect(valueOf(fields, 'Composición gaseosa candidata')).toBe('No resuelta');
    expect(valueOf(fields, 'Condensación de gases candidatos')).toBe('Condensación no evaluable');
    expect(fields.find(field => field.label === 'Condensación de gases candidatos')?.note)
      .toContain('Sin columna gaseosa');
  });

  it('distinguishes resolved zero condensation from a nonzero removal fraction without changing those indices', () => {
    const base = lunarScenario(0.055, 0.448, 3.38, 0.274, 541.3, 0.413, 0.11, 15.762);
    const fractional = { ...base, condensationRemovalIndex01: 0.25 };
    expect(valueOf(lunarAtmosphereFields(base), 'Condensación de gases candidatos'))
      .toBe('Sin condensación apreciable');
    expect(valueOf(lunarAtmosphereFields(fractional), 'Condensación de gases candidatos'))
      .toBe('0,25 / 1');
    expect(fractional.condensationRemovalIndex01).toBe(0.25);
  });

  it('keeps the legacy display when there is no B assessment, and never contradicts inconsistent pressure/composition metadata', () => {
    expect(labelLunarAtmosphere('EXOSPHERE', null)).toBe('Exosfera');
    expect(lunarAtmosphereFields(null)).toEqual([]);
    const base = lunarScenario(0.055, 0.448, 3.38, 0.274, 541.3, 0.413, 0.11, 15.762);
    const contradictory = { ...base, species: [] };
    expect(labelLunarAtmosphere('EXOSPHERE', contradictory)).toBe('Columna atmosférica no resuelta');
    expect(valueOf(lunarAtmosphereFields(contradictory), 'Presión superficial atmosférica (escenario)'))
      .toBe('No determinada');
    expect(valueOf(lunarAtmosphereFields(contradictory), 'Condensación de gases candidatos'))
      .toBe('Condensación no evaluable');
    expect(labelLunarAtmosphere('EXOSPHERE', { ...base, pressureBasis: 'UNRESOLVED' }))
      .toBe('Columna atmosférica no resuelta');
  });
});
