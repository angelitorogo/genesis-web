import { validateEnvironmentalContractPRE3301, environmentalUnknownPRE3301 as unknown,
 environmentalModelledPRE3301 as model } from '../../domain/planetary/environmental-physical-contract-pre33-01';
import type { EnvironmentalPhysicalContractPRE3301 } from '../../domain/planetary/environmental-physical-contract-pre33-01';
import { verifyScientificIntegrationPRE3312 as verify } from './scientific-integration-regression-pre33-12';
import type { PlanetScientificSectionsModel } from '../planet-detail/planet-scientific-sections';
import { WorldEarthComparisonAssembler } from './world-earth-comparison';
import type { EnvironmentalContinuityReportPRE3309 } from '../../domain/planetary/environmental-continuity-pre33-09';

const physical: EnvironmentalPhysicalContractPRE3301 = {
  contractVersion:'PRE-33.01/CT0/v1',perspective:'INTERNAL_SIMULATED_REALITY',epoch:'CT0',
  bodyKind:'PLANET',bodyKey:'G0/S42/P0',hostPlanetKey:null,materialization:'PHYSICALLY_MATERIALIZED',
  bulk:{massEarth:model(1,'BULK_19_21','BULK_PHYSICAL','masa'),radiusEarth:model(1,'BULK_19_21','BULK_PHYSICAL','radio'),gravityMetersPerSecondSquared:model(9.81,'BULK_19_21','BULK_PHYSICAL','gravedad')},
  thermal:{referenceEquilibriumKelvin:unknown('sin espectro'),surfaceTemperatureKelvin:unknown('sin perfil')},
  atmosphere:{retainedSurfacePressurePascal:unknown('no calculado'),waterAssessmentPressurePascal:unknown('no calculado'),physicallySupportedSurfacePressurePascal:unknown('no calculado'),columnRelation:'NOT_COMPARABLE'},
  water:{surfaceLiquidCoverage01:unknown('sin cobertura'),subsurfaceOceanState:unknown('sin perfil'),liquidOceanMassKilograms:unknown('sin masa')},
  energy:{interiorHeatFluxWattsPerSquareMeter:unknown('sin flujo'),extractableChemicalPowerWatts:unknown('sin cinética'),chemicalDisequilibriumJoulesPerMole:unknown('sin actividades')},
  radiation:{bolometricFluxWattsPerSquareMeter:unknown('sin espectro'),surfaceIonizingDoseGrayPerYear:unknown('sin espectro'),subsurfaceIonizingDoseGrayPerYear:unknown('sin cubierta')},
  history:{continuousCompatibleYears:unknown('sin intervalo datado')},lifeEvaluated:false,
};
const comparison=WorldEarthComparisonAssembler.build({worldLabel:'Test',massEarth:1,radiusEarth:1,densityGramsPerCubicCentimeter:5.51,surfaceGravityEarth:1});
const planetFiche: PlanetScientificSectionsModel={
  comparison,relevantMoons:[{designation:'Test I',moonIndex:0,ordinalLabel:'Luna 1',fields:[],badges:[]}],
  allMoons:[{designation:'Test I',moonIndex:0,ordinalLabel:'Luna 1',fields:[],badges:[],kind:'DETAILED'},
            {designation:'Test II',moonIndex:1,ordinalLabel:'Luna 2',fields:[],badges:[],kind:'IDENTITY_ONLY'}],
  relevantMoonsEmptyMessage:'',
  sections:['general','orbit','surface','atmosphere','climate','geology','moons','comparison'].map((id,i)=>({
    id:id as PlanetScientificSectionsModel['sections'][number]['id'],eyebrow:`${i}`,title:id,summary:'',fields:[],
  })),
};
const inventory={total:2,detailed:1,minorIdentityOnly:1};
const validHistory:EnvironmentalContinuityReportPRE3309={contractVersion:'PRE-33.09/CT0-DATED-CONTINUITY/v1',
  perspective:'SIMULATED_REALITY',access:'INTERNAL',bodyKind:'PLANET',bodyKey:physical.bodyKey,
  multiplicity:'BINARY',startYear:0,endYear:2,historicalCompleteness:'NOT_ESTABLISHED',
  eventCatalogCompleteness:'NOT_ESTABLISHED',lifePresence:'NOT_EVALUATED',biologicalContinuity:'NOT_EVALUATED',
  routes:[{route:'SURFACE_AQUEOUS',segments:[{startYear:0,endYear:2,verdict:'UNKNOWN',
    physicalEnvironmentRecordKey:null,overlappingEventKeys:[],reason:'NO_SOURCED_HISTORY'}],
    compatibleYearSlots:0,longestContinuousYearSlots:0,compatibleAtQueryEndYearSlots:0,
    incompatibleYearSlots:0,unknownYearSlots:3,modelNotImplementedYearSlots:0,
    coversEntireQueriedIntervalWithDocumentedCompatibility:false}],
};

describe('PRE-33.12 — integración 31/32/PRE-33, sin concesión biológica',()=>{
  it('acepta la ficha completa de dos lunas sin materializar la menor',()=>{
    expect(validateEnvironmentalContractPRE3301(physical)).toEqual([]);
    const r=verify({environmental:physical,access:'SCIENTIFIC_FICHE_AVAILABLE',planetFiche,moonInventory:inventory,history:validHistory});
    expect(r.passed).toBe(true);expect(r.discoveryGranted).toBe(false);expect(r.newPersistentData).toBe(false);
    expect(r.historicalCompatibility).toBe('NOT_CERTIFIED_GLOBALLY');
  });
  it('detecta desaparición, duplicidad y promoción de física en lunas menores',()=>{
    const broken={...planetFiche,allMoons:[planetFiche.allMoons[0]!]};
    expect(verify({environmental:physical,access:'SCIENTIFIC_FICHE_AVAILABLE',planetFiche:broken,moonInventory:inventory}).issues)
      .toContain('MOON_IDENTITY_COVERAGE');
    const duplicate={...planetFiche,allMoons:[planetFiche.allMoons[0]!,{...planetFiche.allMoons[1]!,moonIndex:0,fields:[{label:'Agua',value:'Confirmada',note:null}]}]};
    expect(verify({environmental:physical,access:'SCIENTIFIC_FICHE_AVAILABLE',planetFiche:duplicate,moonInventory:inventory}).issues)
      .toContain('MOON_IDENTITY_DUPLICATION');
  });
  it('ficha bloqueada nunca muestra datos privados ni ficha observada',()=>{
    const r=verify({environmental:physical,access:'SCIENTIFIC_FICHE_LOCKED',planetFiche,moonInventory:inventory});
    expect(r.issues).toContain('UNAUTHORIZED_OBSERVATION');
    const hidden=verify({environmental:physical,access:'SCIENTIFIC_FICHE_LOCKED'});
    expect(hidden.passed).toBe(true);expect(hidden.permission).toBe('LOCKED');
  });
  it('rechaza serializar Ground Truth en una ficha observada',()=>{
    const r=verify({environmental:physical,access:'SCIENTIFIC_FICHE_AVAILABLE',observedText:'INTERNAL_SIMULATED_REALITY'});
    expect(r.issues).toContain('PRIVATE_DATA_IN_PUBLIC_FICHE');
  });
  it('CT-0 no acredita miles de años de continuidad',()=>{
    const forged={...physical,history:{continuousCompatibleYears:model(1e9,'BULK_19_21','CT0_CONSTITUTIVE','inferido del presente')}};
    const r=verify({environmental:forged,access:'SCIENTIFIC_FICHE_AVAILABLE'});
    expect(r.issues).toContain('UNSOURCED_HISTORICAL_CONTINUITY');
    const foreign={...validHistory,bodyKey:'OTRO_PLANETA'};
    expect(verify({environmental:physical,access:'SCIENTIFIC_FICHE_AVAILABLE',history:foreign}).issues)
      .toContain('FOREIGN_HISTORICAL_BODY');
  });
  it('admite ordinales públicos y físicos distintos en multihost y rechaza océano ajeno',()=>{
    const lunar={...physical,bodyKind:'MOON' as const,bodyKey:'G0/S42/P7/M0',hostPlanetKey:'G0/S42/P7'};
    const m={publicHostPlanetOrdinal:14,physicalHostPlanetOrdinal:8,oceanHostPlanetOrdinal:8,radiationHostPlanetOrdinal:8};
    expect(verify({environmental:lunar,access:'SCIENTIFIC_FICHE_AVAILABLE',moonOrigin:m}).passed).toBe(true);
    expect(verify({environmental:lunar,access:'SCIENTIFIC_FICHE_AVAILABLE',moonOrigin:{...m,oceanHostPlanetOrdinal:14}}).issues)
      .toContain('MULTIHOST_PHYSICAL_ORIGIN_MISMATCH');
  });
  it('un resultado biológico futuro no puede ser activado desde PRE-33',()=>{
    const malformed={contract:'PRE-33.11c/V3-LIFE-READINESS-NON-GENERATING/v1' as const,
      bodyKey:'G0/S42/P0',bodyKind:'PLANET' as const,routes:[],futurePhases:[],
      versionGate:'BIOLOGY_DISABLED_UNTIL_PRE33_13' as const,lifeFrequency:'NOT_ESTIMABLE_FROM_ENVIRONMENT' as const,
      observerView:'NO_AUTOMATIC_DISCOVERY' as const};
    expect(verify({environmental:physical,access:'SCIENTIFIC_FICHE_AVAILABLE',lifeReadiness:malformed}).issues)
      .toContain('BIOLOGICAL_EVIDENCE_LEAK');
  });
});
