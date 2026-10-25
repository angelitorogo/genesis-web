import type { Planet } from '../../domain/planetary/planet';
import type { AtmosphereClosurePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';
import type { H2OForwardCT0Result } from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import { GeochemicalFormationSensitivityEnginePRE3307 as MineralScenario } from './geochemical-formation-sensitivity-pre33-07';
import type { MoonGeochemicalEnergy32F4 } from '../../domain/planetary/moon-geochemical-energy-32-f-4';
import type { ChemicalForcingPRE3307, ChemicalInventoryPRE3307, ChemicalNichePRE3307,
  GeochemistryPRE3307 } from '../../domain/planetary/geochemistry-pre33-07';
import { GeochemistryReactionEnginePRE3307 } from './geochemistry-reaction-engine-pre33-07';

const H2O_MOLAR_KG=0.01801528;
const SOLAR_YEAR_SECONDS=31_557_600;
/** Read-only integration of V3's formation, liquid phases and 32.F.4. */
export class GeochemistryWorldPRE3307 {
  private constructor(){}
  static planet(planet:Planet, atm:AtmosphereClosurePRE3306|null,
    water:H2OForwardCT0Result|null):GeochemistryPRE3307 {
    const deep=atm?.hasDefinedSolidSurface===false||!planet.hasDefinedSolidSurfaceBase;
    // Forward H2O phase pools are *modelled* CT0, not observed solvent purity.
    const liquid=water?.status==='MODELED_CT0_RESERVOIRS'&&
      water.v3ModelBalanceCertified===true ? water.waterKilograms.pools.SURFACE_LIQUID : null;
    const inventories:ChemicalInventoryPRE3307[]=[];
    if(liquid!==null&&liquid!==undefined&&liquid>0&&!deep){
      inventories.push({species:'H2O',phase:'LIQUID',amountMoles:liquid/H2O_MOLAR_KG,
        activity:null,sourceId:`${water!.source.historyId??water!.source.diskId}/CT0_SURFACE_LIQUID`});
    }
    const niche:ChemicalNichePRE3307={bodyKind:'PLANET',
      niche:deep?'DEEP_ENVELOPE':'SOLID_SURFACE',
      solvent:liquid!==null&&liquid!==undefined&&liquid>0&&!deep?'H2O':'UNIDENTIFIED',
      solventState:deep?'UNRESOLVED':liquid!==null&&liquid>0?'MODELLED_LIQUID_CT0':'UNRESOLVED',
      waterRockContact:'UNRESOLVED',temperatureKelvin:null,pressurePascal:null,
      thermalHeatFluxWattsPerSquareMeter:null,
      sourceId:`PRE-33.07/PLANET/${planet.locator.galaxyIndex}/${planet.locator.sectorKey}/${planet.locator.bodyIndex}`};
    return Object.freeze({...this.evaluate({niche,intervalSeconds:SOLAR_YEAR_SECONDS,inventory:inventories,kinetics:[],
      provenance:'INDEPENDENT_REACTION_MASS_AND_RATE_MODEL'}),
      formationSensitivityPRE3307:MineralScenario.planet(planet,water,atm)});
  }
  static moon(geology:MoonGeochemicalEnergy32F4|null,
    atmosphere:AtmosphereClosurePRE3306|null,
    formation:MoonFormationInventory32F1d|null=null,
    interior:MoonInteriorStructure32F2b|null=null):GeochemistryPRE3307 {
    const liquid=geology?.solventState==='MODELLED_LIQUID_H2O_CT0'&&
      geology.modeledLiquidH2OMassKilograms!==null&&geology.modeledLiquidH2OMassKilograms>0;
    const inventory:ChemicalInventoryPRE3307[]=liquid?[{species:'H2O',phase:'LIQUID',
      amountMoles:geology!.modeledLiquidH2OMassKilograms!/H2O_MOLAR_KG,activity:null,
      sourceId:`32.F.4/M${geology!.hostPlanetOrdinal}/${geology!.moonOrdinal}/CT0_LIQUID_H2O`}]:[];
    const niche:ChemicalNichePRE3307={bodyKind:'MOON',niche:'SUBSURFACE_OCEAN',
      solvent:liquid?'H2O':'UNIDENTIFIED',
      solventState:liquid?'MODELLED_LIQUID_CT0':geology?.solventState==='H2O_SOLID_IN_CT0_MODEL'||
        geology?.solventState==='NO_FORMATION_H2O'?'NOT_MODELLED':'UNRESOLVED',
      waterRockContact:geology?.modeledWaterRockContact==='DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL'
        ?'MODELLED_DIRECT':geology?.modeledWaterRockContact==='LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE'||
          geology?.modeledWaterRockContact==='LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES'
          ?'MODELLED_SEPARATED':'UNRESOLVED',
      temperatureKelvin:geology?.modeledOceanTopTemperatureKelvin??null,
      pressurePascal:geology?.modeledOceanTopPressurePascal??null,
      thermalHeatFluxWattsPerSquareMeter:geology?.generatedHeatFluxWattsPerSquareMeter??null,
      sourceId:geology?`PRE-33.07/MOON/${geology.hostPlanetOrdinal}/${geology.moonOrdinal}`:
        `PRE-33.07/MOON/MISSING_32F4`};
    // A conditional atmosphere can never provide aqueous reactant activities.
    void atmosphere;
    return Object.freeze({...this.evaluate({niche,intervalSeconds:SOLAR_YEAR_SECONDS,inventory,kinetics:[],
      provenance:'INDEPENDENT_REACTION_MASS_AND_RATE_MODEL'}),
      formationSensitivityPRE3307:MineralScenario.moon(geology,formation,interior)});
  }
  /** Public for conditional laboratory fixtures; never mutates generated worlds. */
  static evaluate(forcing:ChemicalForcingPRE3307):GeochemistryPRE3307 {
    return GeochemistryReactionEnginePRE3307.assess(forcing);
  }
}
