import type { Planet } from '../../domain/planetary/planet';
import type { H2OForwardCT0Result } from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';
import type { AtmosphereClosurePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';
import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonGeochemicalEnergy32F4 } from '../../domain/planetary/moon-geochemical-energy-32-f-4';
import type { GeochemicalFormationSensitivityPRE3307 as Output } from '../../domain/planetary/geochemical-formation-sensitivity-pre33-07';
import { GEOCHEMICAL_FORMATION_SENSITIVITY_PRE3307 as VERSION } from '../../domain/planetary/geochemical-formation-sensitivity-pre33-07';

const MOLAR_FEO=0.071844, MOLAR_H2O=0.018015;
const R=8.31446261815324, YEARS=31_557_600;
const clamp=(x:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,x));
const safe=(x:number)=>Number.isFinite(x)&&x>=0;

/**
 * Mineral abundance and kinetic law below are **declared analog priors**:
 * a 5% reactive FeO fraction of bulk silicate (not measured FeO), laboratory
 * order-of-magnitude dissolution flux at 298 K, and a 60 kJ/mol activation
 * energy. No thermal watts are used to obtain reaction watts. This independent
 * scenario cannot be promoted to a resolved CT-0 reaction because pH,
 * FeO phase accessibility and H2 removal are not measured/generated.
 */
export class GeochemicalFormationSensitivityEnginePRE3307 {
  private constructor(){}
  static planet(planet:Planet,water:H2OForwardCT0Result|null,
    atmosphere:AtmosphereClosurePRE3306|null):Output {
    const liquid=water?.status==='MODELED_CT0_RESERVOIRS'&&
      water.v3ModelBalanceCertified===true?water.waterKilograms.pools.SURFACE_LIQUID:null;
    const rockKg=planet.internalComposition.silicateInteriorMassEarth*5.9722e24;
    const status:Output['status']=liquid===null?'MISSING_FORMATION_OR_GEOMETRY':
      liquid<=0?'NO_LIQUID_SOLVENT':rockKg<=0?'NO_REACTIVE_ROCK':
      'THERMODYNAMIC_DOMAIN_UNRESOLVED';
    return Object.freeze({contract:VERSION,route:'WATER_SILICATE_ALTERATION',status,
      physicalContact:'UNKNOWN',liquidWaterKilograms:liquid,silicateRockKilograms:rockKg,
      reactiveFeOAssumedKilograms:null,possibleReactionExtentMoles:null,
      modeledDeltaGJoulesPerMole:null,assumedUpperReactionRateMolesPerSecond:null,
      conditionalUpperPowerWatts:null,physicallyResolvedPowerWatts:null,
      lowerBoundPowerWatts:0,assumedTransportFactor01:null,conservationResidual01:null,
      assumptions:Object.freeze([
        'La masa silicatada total 19.5 no certifica FeO reactivo ni contacto agua-roca.',
        'Una columna atmosférica o temperatura del motor 20.x no fija actividades/kinética en el poro.',
        'Sin agua líquida superficial CT-0, no se autoriza esta reacción acuosa.',
      ]),sourceIds:Object.freeze([water?.source.diskId??'V3_H2O_FORMATION_UNRESOLVED',
        atmosphere?.inventorySourceId??'V3_GAS_CHEMISTRY_UNRESOLVED',
        '19.5/SILICATE_BULK_NOT_MINERALOGY'])});
  }
  static moon(geo:MoonGeochemicalEnergy32F4|null,
    formation:MoonFormationInventory32F1d|null,
    interior:MoonInteriorStructure32F2b|null):Output {
    const sources=[geo?.contractVersion??'32.F.4/MISSING',
      formation?.contractVersion??'32.F.1d/MISSING',
      interior?.contractVersion??'32.F.2b/MISSING'];
    const contact:Output['physicalContact']=geo?.modeledWaterRockContact===
      'DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL'?'DIRECT':
      geo?.modeledWaterRockContact==='LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE'?'ISOLATED_BY_ICE':
      geo?.modeledWaterRockContact==='LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES'?
      'UNIDENTIFIED_SEPARATOR':'UNKNOWN';
    const common={contract:VERSION,route:'WATER_SILICATE_ALTERATION' as const,
      physicalContact:contact,physicallyResolvedPowerWatts:null,lowerBoundPowerWatts:0 as const,
      assumptions:Object.freeze([
        'FeO reactivo = 5% de silicato: prior de sensibilidad, NO mineralogía identificada.',
        'Activación 60 kJ/mol y flujo superficial de disolución 1e-12 mol/m²/s a 298 K: parámetros de escenario.',
        'Potencial H₂ fijado por sumidero hipotético; ΔV=9 cm³/mol, ΔG°≈-46 kJ/mol a 298 K son priors. pH y redox reales desconocidos.',
        'El transporte a través de fases no identificadas NO está demostrado; límite inferior siempre cero.',
        'No se convierte calentamiento interno, índice V1 ni Carnot en potencia química ni en metabolismo.',
      ]),sourceIds:Object.freeze(sources)};
    const fail=(status:Output['status']):Output=>Object.freeze({...common,status,
      liquidWaterKilograms:geo?.modeledLiquidH2OMassKilograms??null,
      silicateRockKilograms:formation?.silicateMassKilograms??null,
      reactiveFeOAssumedKilograms:null,possibleReactionExtentMoles:null,
      modeledDeltaGJoulesPerMole:null,assumedUpperReactionRateMolesPerSecond:null,
      conditionalUpperPowerWatts:null,assumedTransportFactor01:null,conservationResidual01:null});
    if(!geo||geo.solventState!=='MODELLED_LIQUID_H2O_CT0'||
      !geo.modeledLiquidH2OMassKilograms||geo.modeledLiquidH2OMassKilograms<=0)
      return fail('NO_LIQUID_SOLVENT');
    if(!formation||!interior||
      ![formation.silicateMassKilograms,formation.totalMassKilograms,
        interior.totalMassKilograms,geo.modeledLiquidH2OMassKilograms].every(safe)||
      formation.hostPlanetOrdinal!==geo.hostPlanetOrdinal||
      formation.moonOrdinal!==geo.moonOrdinal||
      interior.hostPlanetOrdinal!==geo.hostPlanetOrdinal||
      interior.moonOrdinal!==geo.moonOrdinal||
      Math.abs(formation.totalMassKilograms-interior.totalMassKilograms)>
        1e-8*Math.max(1,formation.totalMassKilograms)||
      interior.layers.length!==4)
      return fail('MISSING_FORMATION_OR_GEOMETRY');
    if(formation.silicateMassKilograms<=0)return fail('NO_REACTIVE_ROCK');
    const T=geo.modeledOceanBottomTemperatureKelvin;
    const P=geo.modeledOceanBottomPressurePascal;
    if(T===null||P===null||!Number.isFinite(T)||!Number.isFinite(P)||
       T<265||T>430||P<0||P>1e9)
      return fail('THERMODYNAMIC_DOMAIN_UNRESOLVED');
    const water=geo.modeledLiquidH2OMassKilograms;
    const reactiveFeO=formation.silicateMassKilograms*0.05;
    // 3 FeO + H2O -> Fe3O4 + H2, exactly 3:1; limit by
    // FeO *and* liquid water in kg converted to moles.
    const extent=Math.min(reactiveFeO/(3*MOLAR_FEO),water/MOLAR_H2O);
    const conservativeConsumedFeO=extent*3*MOLAR_FEO;
    const conservativeConsumedWater=extent*MOLAR_H2O;
    if(conservativeConsumedFeO>reactiveFeO*(1+1e-12)||
       conservativeConsumedWater>water*(1+1e-12))
      throw new RangeError('PRE33_07_REACTANTS_OVERRUN');
    // Above residual is not a mass-balance error: excess inventory survives.
    // Explicitly compute the reaction product mass closure instead.
    const Fe=0.055845,O=0.015999,H=0.001008;
    const productsKg=extent*((3*Fe+4*O)+2*H);
    const inputsKg=extent*(3*MOLAR_FEO+MOLAR_H2O);
    const massResidual=Math.abs(productsKg-inputsKg)/Math.max(1,inputsKg);
    if(massResidual>1e-6||!Number.isFinite(extent))throw new RangeError('PRE33_07_FE_REACTION_MASS_NOT_CONSERVED');
    // Simplified ΔG° analog at 298 K (-46 kJ/mol). Assumes bounded
    // solution-chemistry logarithmic activity ratio Q=1e-6, with explicit
    // conditional sink for hydrogen. Not asserted at CT0 environmental chemistry.
    // Pressure correction is a named ΔV endmember (9 cm³/mol), not a
    // high-pressure activity/EOS measurement. A single pressure coordinate
    // cannot prove fluid/mineral equilibrium.
    const deltaVolumeM3PerMol=9e-6;
    const gibbs=-46_000 + deltaVolumeM3PerMol*(P-100_000) + R*T*Math.log(1e-6);
    // Domain-sized maximum fluid/rock reactive area uses existing shell geometry;
    // tiny assumed area accessibility (1e-4) prevents wholesale bulk reaction.
    const mantle=interior.layers[1];
    const shellRadiusM=mantle.outerRadiusKilometers*1000;
    if(!Number.isFinite(shellRadiusM)||shellRadiusM<=0)
      return fail('MISSING_FORMATION_OR_GEOMETRY');
    // For an unidentified separator allow *only* a hypothetical transport upper
    // sensitivity. Never relabel an isolated ocean as direct rock contact.
    const factor=contact==='DIRECT'?1:contact==='UNIDENTIFIED_SEPARATOR'?
      1e-4:contact==='ISOLATED_BY_ICE'?0:0;
    const exposedArea=4*Math.PI*shellRadiusM**2*1e-4;
    const arrhenius=Math.exp(-60_000/R*(1/T-1/298.15));
    const rate=Math.min(extent/YEARS,exposedArea*1e-12*arrhenius*factor);
    if(!Number.isFinite(rate)||rate<0)throw new RangeError('PRE33_07_BAD_RATE');
    return Object.freeze({...common,status:contact==='DIRECT'?'DIRECT_CONTACT_ENDMEMBER':
      'CONDITIONAL_CONTACT_UPPER_BOUND',liquidWaterKilograms:water,
      silicateRockKilograms:formation.silicateMassKilograms,
      reactiveFeOAssumedKilograms:reactiveFeO,possibleReactionExtentMoles:extent,
      modeledDeltaGJoulesPerMole:gibbs,assumedUpperReactionRateMolesPerSecond:rate,
      conditionalUpperPowerWatts:Math.max(0,-gibbs)*rate,
      assumedTransportFactor01:factor,conservationResidual01:massResidual,
    });
  }
}
