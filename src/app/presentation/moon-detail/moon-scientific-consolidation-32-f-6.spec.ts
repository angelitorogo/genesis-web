import type { MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import type { MoonAtmosphereAssessment } from '../../domain/planetary/moon-atmosphere-assessment';
import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import {
  lunarAtmosphereFields,
  lunarEnvironmentalHistoryFields32F5,
  lunarScientificSynthesisFields32F6,
} from './moon-scientific-sections';

/** Read-only fixture: this suite tests the presentation crosswalk, not generation. */
function targetWithState(state: 'PRESENT_IN_SIMULATED_MODEL' |
  'ABSENT_IN_SIMULATED_MODEL' | 'UNRESOLVED_IN_SIMULATED_MODEL' | null,
  heatFlux: number | null = 0.1144,
  datedIntervals = 0): MoonScientificResolvedTarget {
  const intervals = Array.from({length: datedIntervals}, (_, index) => ({
    irradianceWattsPerSquareMeter: {min: 100 + index, max: 102 + index},
  }));
  return {
    detail: {
      environment: {
        hasSubsurfaceOcean: true, // legacy V1 must never override CT-0
        oceanReality32F2c: state === null ? null : {state},
        atmosphereAssessment: {
          pressureBasis: 'CONDITIONAL_SCENARIO',
          estimatedSurfacePressurePascal: 150_000,
          physicalBalance32F1: null,
        },
        radiationProtection32F3: {},
        geochemicalEnergy32F4: {generatedHeatFluxWattsPerSquareMeter: heatFlux},
        environmentalHistory32F5: {intervals},
      },
    },
  } as unknown as MoonScientificResolvedTarget;
}

function val(fields: ReturnType<typeof lunarScientificSynthesisFields32F6>, label: string) {
  const candidate = fields.find(field => field.label === label);
  expect(candidate).toBeDefined();
  return candidate!;
}

describe('32.F.6 — consolidación transversal, solo presentación', () => {
  for (const [state, expected] of [
    ['PRESENT_IN_SIMULATED_MODEL', 'presente en CT-0'],
    ['ABSENT_IN_SIMULATED_MODEL', 'ausente en CT-0'],
    ['UNRESOLVED_IN_SIMULATED_MODEL', 'no resuelto en CT-0'],
    [null, 'no disponible'],
  ] as const) {
    it(`respeta el estado oceánico ${state ?? 'sin modelo'} sin promover el candidato V1`, () => {
    const target = targetWithState(state);
    const fields = lunarScientificSynthesisFields32F6(target);
    expect(val(fields, 'Síntesis 32.F.6 — reservorio H₂O').value).toContain(expected);
    expect(val(fields, 'Síntesis 32.F.6 — reservorio H₂O').note).toContain('V1');
    expect(target.detail.environment.hasSubsurfaceOcean).toBe(true);
    expect(target.detail.environment.oceanReality32F2c?.state ?? null).toBe(state);
    expect(Object.isFrozen(fields)).toBe(true);
    });
  }

  it('no utiliza la presión de un escenario atmosférico como columna física ni una atenuación de referencia como dosis', () => {
    const atmosphere = val(lunarScientificSynthesisFields32F6(targetWithState('PRESENT_IN_SIMULATED_MODEL')),
      'Síntesis 32.F.6 — atmósfera y radiación');
    expect(atmosphere.value).toContain('Columna gaseosa física no resuelta');
    expect(atmosphere.value).toContain('dosis ionizante real no resuelta');
    expect(atmosphere.note).toContain('atenuación gamma de referencia');
  });

  it('distingue calor CT-0, química sin resolver y series históricas condicionales', () => {
    const fields = lunarScientificSynthesisFields32F6(
      targetWithState('PRESENT_IN_SIMULATED_MODEL', .1144, 2));
    const field = val(fields, 'Síntesis 32.F.6 — energía e historia');
    expect(field.value).toContain('W/m²');
    expect(field.value).toContain('2 intervalos condicionales');
    expect(field.note).toContain('no equivale a potencia química');
    expect(field.note).toContain('no demuestra continuidad de océanos');
  });

  it('conserva flujo y cronología no resueltos sin transformarlos en cero', () => {
    const field = val(lunarScientificSynthesisFields32F6(targetWithState(
      'UNRESOLVED_IN_SIMULATED_MODEL', null)), 'Síntesis 32.F.6 — energía e historia');
    expect(field.value).toContain('no cuantificado');
    expect(field.value).toContain('sin tramos fechados');
    expect(field.value).not.toContain('0 W/m²');
  });

  it('corrige únicamente la terminología de blindaje en Atmósfera, sin certificar protección', () => {
    const gas = {
      volatileInventoryIndex01: .6,
      thermalEscapeSupportIndex01: .4,
      replenishmentSupportIndex01: .2,
      condensationRemovalIndex01: .1,
      estimatedSurfacePressurePascal: null,
      pressureBasis: 'UNRESOLVED', species: [],
      irradiationReferenceEarth: .652,
      chargedParticleEnvironment: 'UNRESOLVED',
      hostMagnetosphereShielding: 'UNRESOLVED',
    } satisfies MoonAtmosphereAssessment;
    const fields = lunarAtmosphereFields(gas);
    const row = fields.find(item => item.label === 'Entorno radiativo y magnetosférico');
    expect(row?.value).toBe('Protección frente a partículas y blindaje magnetosférico: no evaluables');
    expect(row?.note).toContain('La atenuación fotónica por materiales se calcula separadamente en Radiación (32.F.3)');
    expect(row?.note).toContain('no equivale a dosis');
  });

  it('distingue irradiancia histórica y temperatura radiativa ideal de temperatura superficial', () => {
    const history = {
      ageYearsCT0: 1000,
      intervals: [{startYear:100,endYear:200,
        irradianceWattsPerSquareMeter:{min:500,max:700},
        idealRadiativeEquilibriumKelvin32F5a:{min:180,max:195},
        heatFluxWattsPerSquareMeter:null,oceanState:'UNKNOWN',
      }],
      events:[],datedModelInterruptions:[], currentOceanStateCT0:'UNRESOLVED',
      datedOceanTransitionCount:0,
    } as unknown as MoonEnvironmentalHistory32F5;
    const fields = lunarEnvironmentalHistoryFields32F5(history);
    const flux = fields.find(item => item.label.startsWith('Irradiancia estelar histórica'));
    const ideal = fields.find(item => item.label.startsWith('Equilibrio radiativo ideal histórico'));
    expect(flux?.note).toContain('no temperaturas superficiales reales');
    expect(flux?.note).toContain('temperatura radiativa ideal');
    expect(ideal?.value).toContain('1 tramos calculados');
    expect(ideal?.note).toContain('NO es temperatura superficial');
    expect(fields.find(item => item.label.startsWith('Evolución de océanos'))?.value)
      .toBe('No resuelta históricamente');
  });
});
