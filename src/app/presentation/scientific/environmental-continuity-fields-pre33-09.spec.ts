import { describe,expect,it } from 'vitest';
import type { MoonEnvironmentalHistory32F5 } from '../../domain/planetary/moon-environmental-history-32-f-5';
import { environmentalContinuityFieldsPRE3309, lunarContinuityFieldsPRE3309 } from './environmental-continuity-fields-pre33-09';

describe('PRE-33.09 — fichas V3 sin atribuciones de vida ni historia inventada',()=>{
 it('no publica ventanas internas no autorizadas en el conocimiento observado',()=>{
  expect(environmentalContinuityFieldsPRE3309(null)[0].value).toBe('No certificada');
  expect(environmentalContinuityFieldsPRE3309({contractVersion:'PRE-33.09/CT0-DATED-CONTINUITY/v1',
   perspective:'SIMULATED_REALITY',access:'INTERNAL',bodyKind:'MOON',bodyKey:'SECRETO',
   multiplicity:'TRIPLE',startYear:0,endYear:1,routes:[],historicalCompleteness:'NOT_ESTABLISHED',
   lifePresence:'NOT_EVALUATED',biologicalContinuity:'NOT_EVALUATED',eventCatalogCompleteness:'NOT_ESTABLISHED'}))
    .toEqual(environmentalContinuityFieldsPRE3309(null));
 });
 it('irradiancia histórica lunar no se presenta como continuidad biológica',()=>{
  const history:MoonEnvironmentalHistory32F5={
   contractVersion:'32.F.5-dated-lunar-environment-v1',provenance:'RETAINED_V2_DATED_IRRADIANCE_AND_INDEPENDENT_LUNAR_SOURCES',
   bodyKey:'luna',hostPlanetOrdinal:1,moonOrdinal:1,ageYearsCT0:10,sourceRevision:'dated',
   timeScale:'YEARS_SINCE_SYSTEM_FORMATION',intervals:[{
    startYear:0,endYear:10,irradianceWattsPerSquareMeter:{min:80,max:100},heatFluxWattsPerSquareMeter:null,
    surfaceTemperatureKelvin:null,surfacePressurePascal:null,liquidH2OMassKilograms:null,oceanState:'UNKNOWN',
    irradianceProvenanceKeys:['stellar-spectrum'],environmentalProvenanceKey:null,
    overlappingEventKeys:[],radiativeModelInterrupted:false,
   }],events:[],datedModelInterruptions:[],currentOceanStateCT0:'PRESENT',
   currentHeatFluxCT0WattsPerSquareMeter:0.2,datedOceanTransitionCount:0,datedIrradianceIntervalCount:1,
   historicalOceanContinuity:'UNKNOWN',sustainedTidalHeating:'UNKNOWN',historicalHabitability:'UNKNOWN',
   lifePresence:'NOT_EVALUATED',historicalCompleteness:'NOT_ESTABLISHED',scientificLimits:[],
  };
  const fields=lunarContinuityFieldsPRE3309(history);
  expect(fields.find(x=>x.label.includes('Ventanas'))?.value).toBe('No certificadas');
  expect(JSON.stringify(fields)).not.toContain('vida confirmada');
 });
});
