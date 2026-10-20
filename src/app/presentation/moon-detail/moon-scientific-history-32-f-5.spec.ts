import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import { lunarEnvironmentalHistoryFields32F5 } from './moon-scientific-sections';

const historical: MoonEnvironmentalHistory32F5 = {
  contractVersion:'32.F.5-dated-lunar-environment-v1',
  provenance:'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES',
  bodyKey:'G3/S-17/O8/B7/M2',hostPlanetOrdinal:8,moonOrdinal:3,
  ageYearsCT0:10,sourceRevision:'s1',timeScale:'YEARS_SINCE_SYSTEM_FORMATION',
  intervals:[
    {startYear:0,endYear:4,irradianceWattsPerSquareMeter:null,
      heatFluxWattsPerSquareMeter:null,surfaceTemperatureKelvin:null,
      surfacePressurePascal:null,liquidH2OMassKilograms:null,oceanState:'UNKNOWN',
      irradianceProvenanceKeys:[],environmentalProvenanceKey:null,
      overlappingEventKeys:[],radiativeModelInterrupted:false},
    {startYear:5,endYear:10,irradianceWattsPerSquareMeter:{min:800,max:1000},
      heatFluxWattsPerSquareMeter:null,surfaceTemperatureKelvin:null,
      surfacePressurePascal:null,liquidH2OMassKilograms:null,oceanState:'UNKNOWN',
      irradianceProvenanceKeys:['lum','orbit'],environmentalProvenanceKey:null,
      overlappingEventKeys:[],radiativeModelInterrupted:false},
  ],
  events:[],datedModelInterruptions:[],currentOceanStateCT0:'PRESENT',currentHeatFluxCT0WattsPerSquareMeter:.1144,
  datedOceanTransitionCount:0,datedIrradianceIntervalCount:1,
  historicalOceanContinuity:'UNKNOWN',sustainedTidalHeating:'UNKNOWN',
  historicalHabitability:'UNKNOWN',lifePresence:'NOT_EVALUATED',
  historicalCompleteness:'NOT_ESTABLISHED',scientificLimits:[],
};
describe('32.F.5 — representación científica de historia lunar', () => {
  it('muestra edad fechada, irradiancia condicional y pasado oceánico desconocido', () => {
    const fields = lunarEnvironmentalHistoryFields32F5(historical);
    expect(fields.find(x=>x.label.startsWith('Edad común'))?.value).toContain('10 años');
    expect(fields.find(x=>x.label.startsWith('Irradiancia estelar histórica'))?.note)
      .toContain('5–10 años desde la formación');
    expect(fields.find(x=>x.label.startsWith('Evolución de océanos'))?.value)
      .toContain('No resuelta');
    expect(fields.find(x=>x.label.startsWith('Estabilidad ambiental'))?.value)
      .toBe('No certificadas');
    expect(JSON.stringify(fields)).not.toContain('océano históricamente confirmado');
  });
  it('muestra ausencia de edad como desconocida, nunca cero años', () => {
    expect(lunarEnvironmentalHistoryFields32F5(null)[0].value).toBe('No disponible');
    const fields = lunarEnvironmentalHistoryFields32F5({...historical,
      ageYearsCT0:null,sourceRevision:null,intervals:[]});
    expect(fields.find(f=>f.label.startsWith('Edad común'))?.value).toBe('No determinada');
    expect(fields.find(f=>f.label.startsWith('Irradiancia estelar histórica'))?.value).toBe('No resuelta');
  });
});
