import type { Galaxy } from '../../domain/universe/galaxy';
import type { GalaxySectorContent } from '../../domain/sector/galaxy-sector-content';
import type { Planet } from '../../domain/planetary/planet';
import type { MoonSystem } from '../../domain/planetary/moon-system';
import type { RelevantMoon } from '../../domain/planetary/relevant-moon';
import type { H2OForwardCT0Result } from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { frozenPhysicalSourceKey } from '../../domain/generation/frozen-physical-source-key';
import { GalaxySectorStellarPopulationPropertiesGenerator } from '../sector/galaxy-sector-stellar-population-properties-generator';
import { PlanetFormationProfileGenerator } from './planet-formation-profile-generator';
import { PlanetaryDiversityCoveragePRE3311 } from './planetary-diversity-coverage-pre33-11';

export const GALACTIC_DISTRIBUTION_PRE3311A = 'PRE-33.11a/V3-GALACTIC-ENVIRONMENT/v1' as const;
export type SolventClassPRE3311a = 'H2O' | 'NH3' | 'CH4';
export type SolventEvidencePRE3311a =
  'CT0_LIQUID_IN_SIMULATED_MODEL' | 'CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL' |
  'UNRESOLVED_PHASE_OR_INVENTORY' | 'IDENTITY_ONLY_NOT_CHARACTERIZED';
export interface BiochemistryRoutePRE3311a {
  readonly solvent: SolventClassPRE3311a;
  readonly phase: SolventEvidencePRE3311a;
  /** None of these are proof of accessible energy, biology, or detection. */
  readonly reactantsAndKinetics: 'UNRESOLVED';
  readonly doseAndHistory: 'UNRESOLVED';
  readonly life: 'NOT_EVALUATED';
  readonly observed: false;
}
export interface GalacticSectorEnvironmentPRE3311a {
  readonly contract: typeof GALACTIC_DISTRIBUTION_PRE3311A;
  readonly galaxyIndex: string;
  readonly sectorKey: string;
  readonly region: string;
  readonly normalizedRadius: number;
  readonly relativeStellarDensityProxy: number;
  readonly sectorMetallicitySolarRatio: number;
  readonly characteristicAgeBillionYears: number;
  readonly formationMetallicitySolarRatio: number;
  readonly solidMaterialIndex: number;
  readonly giantFormationPropensity: number;
  readonly formationRegime: string;
  readonly causalChain: 'GALAXY_TO_SECTOR_METALLICITY_TO_FORMATION';
  readonly metallicityMeaning: 'SECTOR_CHARACTERISTIC_NOT_INDIVIDUAL_HOST_ABUNDANCES';
  readonly life: 'NOT_EVALUATED';
}
export interface GalacticBodyEnvironmentPRE3311a {
  readonly contract: typeof GALACTIC_DISTRIBUTION_PRE3311A;
  readonly sectorKey: string;
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number | null;
  readonly bodyKind: 'PLANET' | 'MOON_DETAILED' | 'MOON_IDENTITY_ONLY';
  readonly family: string;
  readonly niche: 'SOLID_BASE' | 'DEEP_ENVELOPE' | 'MOON_INTERIOR' | 'NOT_CHARACTERIZED' | 'COMPACT_SNAPSHOT';
  readonly routes: readonly BiochemistryRoutePRE3311a[];
  readonly biosphere: 'NOT_EVALUATED';
  readonly observation: 'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY';
  readonly issues: readonly string[];
}
const ROUTES: readonly SolventClassPRE3311a[] = Object.freeze(['H2O','NH3','CH4']);
const freezeRoutes = (water:SolventEvidencePRE3311a):readonly BiochemistryRoutePRE3311a[] =>
  Object.freeze(ROUTES.map(solvent=>Object.freeze({solvent,
    phase:solvent==='H2O'?water:'UNRESOLVED_PHASE_OR_INVENTORY' as const,
    reactantsAndKinetics:'UNRESOLVED' as const,doseAndHistory:'UNRESOLVED' as const,
    life:'NOT_EVALUATED' as const,observed:false as const})));

/**
 * PRE-33.11a is a NON-GENERATING, read-only spatial-science projection.
 * Sector density is dimensionless and metallicity is a characteristic proxy;
 * no radial sterilisation, arbitrary abundance quotas or life probabilities.
 * V1/V2 formation functions are consumed via their already-established frozen
 * physical source, NEVER written back as a V3 or public persistence identity.
 */
export class GalacticEnvironmentDistributionPRE3311a {
  private constructor() {}
  static sector(galaxy:Galaxy, sector:GalaxySectorContent):GalacticSectorEnvironmentPRE3311a {
    if(galaxy.generationKey.generatorVersion!==GeneratorVersion.V3)
      throw new RangeError('PRE33_11A_REQUIRES_PUBLIC_V3');
    if (sector.generationKey !== galaxy.generationKey ||
        sector.locator.galaxyIndex !== galaxy.index)
      throw new RangeError('PRE33_11A_SECTOR_GALAXY_IDENTITY_MISMATCH');
    const d=sector.stellarDensity;
    const pop=GalaxySectorStellarPopulationPropertiesGenerator.generate(galaxy,d);
    const formation=PlanetFormationProfileGenerator.generate(
      frozenPhysicalSourceKey(galaxy.generationKey),pop);
    if (!(Number.isFinite(d.normalizedRadius)&&d.normalizedRadius>=0&&
      Number.isFinite(pop.characteristicMetallicitySolarRatio)&&
      Number.isFinite(formation.solidMaterialIndex)))
      throw new RangeError('PRE33_11A_INVALID_SPATIAL_PHYSICS');
    if (Math.abs(formation.metallicitySolarRatio-pop.characteristicMetallicitySolarRatio)>
      1e-12*Math.max(1,pop.characteristicMetallicitySolarRatio))
      throw new RangeError('PRE33_11A_METALLICITY_CHAIN_BROKEN');
    return Object.freeze({contract:GALACTIC_DISTRIBUTION_PRE3311A,
      galaxyIndex:galaxy.index.toString(),sectorKey:sector.locator.sectorKey.toString(),
      region:d.region.name,normalizedRadius:d.normalizedRadius,
      relativeStellarDensityProxy:d.relativeDensity,
      sectorMetallicitySolarRatio:pop.characteristicMetallicitySolarRatio,
      characteristicAgeBillionYears:pop.characteristicStellarAgeBillionYears,
      formationMetallicitySolarRatio:formation.metallicitySolarRatio,
      solidMaterialIndex:formation.solidMaterialIndex,
      giantFormationPropensity:formation.giantPlanetFormationPropensity,
      formationRegime:formation.regime,
      causalChain:'GALAXY_TO_SECTOR_METALLICITY_TO_FORMATION',
      metallicityMeaning:'SECTOR_CHARACTERISTIC_NOT_INDIVIDUAL_HOST_ABUNDANCES',
      life:'NOT_EVALUATED'});
  }
  static planet(planet:Planet, moons:MoonSystem, sector:GalacticSectorEnvironmentPRE3311a,
    architecture:'SINGLE'|'BINARY'|'TRIPLE', host:'A'|'B'|'C'|'AB',
    water:H2OForwardCT0Result|null=null):GalacticBodyEnvironmentPRE3311a {
    const coverage=PlanetaryDiversityCoveragePRE3311.standard(planet,moons,architecture,host);
    const liquid=water?.status==='MODELED_CT0_RESERVOIRS'&&water.v3ModelBalanceCertified===true ?
      (water.waterKilograms.pools.SURFACE_LIQUID??0)+(water.waterKilograms.pools.SUBSURFACE_LIQUID??0):null;
    const waterState:SolventEvidencePRE3311a= liquid===null?'UNRESOLVED_PHASE_OR_INVENTORY':
      liquid>0?'CT0_LIQUID_IN_SIMULATED_MODEL':'CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL';
    const issues=[...coverage.issues];
    if(water&&(water.physicalCT0InventoryCertified||water.oceanExistenceCertified||water.observedEvidenceGranted))
      issues.push('PLANET_H2O_FALSE_CERTIFICATION');
    return Object.freeze({contract:GALACTIC_DISTRIBUTION_PRE3311A,sectorKey:sector.sectorKey,
      hostPlanetOrdinal:planet.planetOrdinal,moonOrdinal:null,bodyKind:'PLANET',
      family:coverage.family,niche:coverage.niche,routes:freezeRoutes(waterState),
      biosphere:'NOT_EVALUATED',observation:'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY',
      issues:Object.freeze(issues)});
  }
  static moon(moon:RelevantMoon, sector:GalacticSectorEnvironmentPRE3311a):GalacticBodyEnvironmentPRE3311a {
    const ocean=moon.oceanReality32F2c;
    const phase:SolventEvidencePRE3311a = !ocean?'UNRESOLVED_PHASE_OR_INVENTORY':
      ocean.state==='PRESENT_IN_SIMULATED_MODEL'?'CT0_LIQUID_IN_SIMULATED_MODEL':
      ocean.state==='ABSENT_IN_SIMULATED_MODEL'?'CT0_LIQUID_ABSENT_IN_SIMULATED_MODEL':
      'UNRESOLVED_PHASE_OR_INVENTORY';
    const issues:string[]=[];
    if (ocean&&(ocean.hostPlanetOrdinal!==moon.hostPlanetOrdinal||ocean.moonOrdinal!==moon.moonOrdinal))
      issues.push('MOON_OCEAN_IDENTITY_MISMATCH');
    if (moon.geochemicalEnergy32F4?.actualChemicalPowerWatts != null)
      issues.push('UNEXPECTED_CERTIFIED_CHEMICAL_POWER_IN_32F4');
    return Object.freeze({contract:GALACTIC_DISTRIBUTION_PRE3311A,sectorKey:sector.sectorKey,
      hostPlanetOrdinal:moon.hostPlanetOrdinal,moonOrdinal:moon.moonOrdinal,
      bodyKind:'MOON_DETAILED',family:'MOON',niche:'MOON_INTERIOR',routes:freezeRoutes(phase),
      biosphere:'NOT_EVALUATED',observation:'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY',
      issues:Object.freeze(issues)});
  }
  static minorMoon(hostPlanetOrdinal:number,moonOrdinal:number,
    sector:GalacticSectorEnvironmentPRE3311a):GalacticBodyEnvironmentPRE3311a {
    if(!Number.isSafeInteger(hostPlanetOrdinal)||hostPlanetOrdinal<1||
       !Number.isSafeInteger(moonOrdinal)||moonOrdinal<1)
      throw new RangeError('PRE33_11A_INVALID_MINOR_MOON_IDENTITY');
    return Object.freeze({contract:GALACTIC_DISTRIBUTION_PRE3311A,sectorKey:sector.sectorKey,
      hostPlanetOrdinal,moonOrdinal,bodyKind:'MOON_IDENTITY_ONLY',family:'MOON_UNCLASSIFIED',
      niche:'NOT_CHARACTERIZED',routes:freezeRoutes('IDENTITY_ONLY_NOT_CHARACTERIZED'),
      biosphere:'NOT_EVALUATED',observation:'PRIVATE_GENERATIVE_GROUND_TRUTH_NOT_DISCOVERY',
      issues:Object.freeze([])});
  }
}
