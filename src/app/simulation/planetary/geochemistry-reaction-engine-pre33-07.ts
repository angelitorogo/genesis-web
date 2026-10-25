import {
  GEOCHEMISTRY_PRE33_07,
  type ChemicalSpeciesPRE3307 as Species,
  type ChemicalPhasePRE3307 as Phase,
  type ChemicalRoutePRE3307 as Route,
  type ChemicalForcingPRE3307 as Input,
  type ChemicalInventoryPRE3307 as Inventory,
  type ChemicalReactionResultPRE3307 as Result,
  type GeochemistryPRE3307 as Output,
} from '../../domain/planetary/geochemistry-pre33-07';

// Element counts and ionic charge; library reactions are mass- and charge-balanced.
const ELEMENTS: Readonly<Record<Species, readonly [number,number,number,number,number,number,number,number]>> = {
  // H, O, C, S, Fe, N, P, charge
  H2:[2,0,0,0,0,0,0,0], O2:[0,2,0,0,0,0,0,0], H2O:[2,1,0,0,0,0,0,0],
  CO2:[0,2,1,0,0,0,0,0], CH4:[4,0,1,0,0,0,0,0], H2S:[2,0,0,1,0,0,0,0],
  SO4_2MINUS:[0,4,0,1,0,0,0,-2], H_PLUS:[1,0,0,0,0,0,0,1],
  FeO:[0,1,0,0,1,0,0,0], Fe3O4:[0,4,0,0,3,0,0,0],
  NH3:[3,0,0,0,0,1,0,0], N2:[0,0,0,0,0,2,0,0],
};
interface Definition {
 readonly route: Route; readonly equation:string;
 readonly reactants:readonly Readonly<{species:Species; coefficient:number;phase:Phase}>[];
 readonly products:readonly Readonly<{species:Species; coefficient:number;phase:Phase}>[];
 readonly requiredSolvent:'H2O'|'NH3'|'CH4'; readonly needsDirectRock:boolean;
}
const PATHS:readonly Definition[] = Object.freeze([
  {route:'HYDROGEN_OXIDATION',equation:'2 H₂ + O₂ → 2 H₂O',
    reactants:[{species:'H2',coefficient:2,phase:'AQUEOUS'},{species:'O2',coefficient:1,phase:'AQUEOUS'}],
    products:[{species:'H2O',coefficient:2,phase:'LIQUID'}],requiredSolvent:'H2O',needsDirectRock:false},
  {route:'CO2_HYDROGEN_METHANATION',equation:'CO₂ + 4 H₂ → CH₄ + 2 H₂O',
    reactants:[{species:'CO2',coefficient:1,phase:'AQUEOUS'},{species:'H2',coefficient:4,phase:'AQUEOUS'}],
    products:[{species:'CH4',coefficient:1,phase:'AQUEOUS'},{species:'H2O',coefficient:2,phase:'LIQUID'}],
    requiredSolvent:'H2O',needsDirectRock:false},
  {route:'SULFIDE_OXIDATION',equation:'H₂S + 2 O₂ → SO₄²⁻ + 2 H⁺',
    reactants:[{species:'H2S',coefficient:1,phase:'AQUEOUS'},{species:'O2',coefficient:2,phase:'AQUEOUS'}],
    products:[{species:'SO4_2MINUS',coefficient:1,phase:'AQUEOUS'},{species:'H_PLUS',coefficient:2,phase:'AQUEOUS'}],
    requiredSolvent:'H2O',needsDirectRock:false},
  {route:'WATER_SILICATE_ALTERATION',equation:'3 FeO + H₂O → Fe₃O₄ + H₂',
    reactants:[{species:'FeO',coefficient:3,phase:'SOLID'},{species:'H2O',coefficient:1,phase:'LIQUID'}],
    products:[{species:'Fe3O4',coefficient:1,phase:'SOLID'},{species:'H2',coefficient:1,phase:'AQUEOUS'}],
    requiredSolvent:'H2O',needsDirectRock:true},
  {route:'AMMONIA_OXIDATION',equation:'4 NH₃ + 3 O₂ → 2 N₂ + 6 H₂O',
    reactants:[{species:'NH3',coefficient:4,phase:'LIQUID'},{species:'O2',coefficient:3,phase:'GAS'}],
    products:[{species:'N2',coefficient:2,phase:'GAS'},{species:'H2O',coefficient:6,phase:'SOLID'}],
    requiredSolvent:'NH3',needsDirectRock:false},
  {route:'METHANE_OXIDATION',equation:'CH₄ + 2 O₂ → CO₂ + 2 H₂O',
    reactants:[{species:'CH4',coefficient:1,phase:'LIQUID'},{species:'O2',coefficient:2,phase:'GAS'}],
    products:[{species:'CO2',coefficient:1,phase:'GAS'},{species:'H2O',coefficient:2,phase:'SOLID'}],
    requiredSolvent:'CH4',needsDirectRock:false},
]);
const finite=(n:number)=>Number.isFinite(n);
const SOURCE_FORBIDDEN=/(^|[\/_.-])(V1|INDEX|HABITABILITY|THERMAL_HEAT_AS_CHEMICAL)([\/_.-]|$)/i;
function provenance(s:string):boolean{return typeof s==='string'&&s.trim().length>2&&!SOURCE_FORBIDDEN.test(s);}
export class GeochemistryReactionEnginePRE3307 {
  private constructor(){}
  static library():readonly Route[]{return Object.freeze(PATHS.map(p=>p.route));}
  static verifyStoichiometry():true {
    for(const path of PATHS){
      const reactants=Array(8).fill(0) as number[],products=Array(8).fill(0) as number[];
      for(const r of path.reactants) ELEMENTS[r.species].forEach((v,i)=>reactants[i]+=v*r.coefficient);
      for(const r of path.products) ELEMENTS[r.species].forEach((v,i)=>products[i]+=v*r.coefficient);
      if(reactants.some((v,i)=>v!==products[i]))throw new RangeError('PRE33_07_UNBALANCED_ATOMS_OR_CHARGE_'+path.route);
    }
    return true;
  }
  static assess(input:Input):Output {
    this.verifyStoichiometry();
    if(!finite(input.intervalSeconds)||input.intervalSeconds<=0||!provenance(input.niche.sourceId)||
      input.niche.temperatureKelvin!==null&&(!finite(input.niche.temperatureKelvin)||input.niche.temperatureKelvin<=0)||
      input.niche.pressurePascal!==null&&(!finite(input.niche.pressurePascal)||input.niche.pressurePascal<0)||
      input.niche.thermalHeatFluxWattsPerSquareMeter!==null&&(!finite(input.niche.thermalHeatFluxWattsPerSquareMeter)||input.niche.thermalHeatFluxWattsPerSquareMeter<0))
      throw new RangeError('PRE33_07_INVALID_ENVIRONMENT');
    const store=new Map<string,Inventory>();
    for(const i of input.inventory){
      const key=i.species+'/'+i.phase;
      if(store.has(key)||!finite(i.amountMoles)||i.amountMoles<0||
        i.activity!==null&&(!finite(i.activity)||i.activity<=0||i.amountMoles<=0)||
        !provenance(i.sourceId))throw new RangeError('PRE33_07_INVALID_INVENTORY');
      store.set(key,i);
    }
    const forcing=new Map<Route,Input['kinetics'][number]>();
    for(const k of input.kinetics){
      if(forcing.has(k.route)||!PATHS.some(p=>p.route===k.route)||
        ![k.standardGibbsJoulesPerMole,k.temperatureKelvin,k.pressurePascal,k.forwardRateMolesPerSecond].every(finite)||
        k.temperatureKelvin<=0||k.pressurePascal<0||k.forwardRateMolesPerSecond<0||
        !provenance(k.thermodynamicSourceId)||!provenance(k.kineticSourceId))
        throw new RangeError('PRE33_07_INVALID_KINETICS');
      forcing.set(k.route,k);
    }
    const reactions:Result[]=PATHS.map(path=>{
      const missing=(status:Result['status'],reason:string):Result=>Object.freeze({route:path.route,equation:path.equation,
        chargeAndAtomsBalanced:true,status,reason,gibbsJoulesPerMole:null,forwardRateMolesPerSecond:null,
        chemicalPowerWatts:null,consumedReactantMoles:null,reactionExtentMoles:null,sourceIds:Object.freeze([])});
      if(input.niche.solvent!==path.requiredSolvent||input.niche.solventState!=='MODELLED_LIQUID_CT0')
        return missing(input.niche.solventState==='NOT_MODELLED'?'NOT_EVALUABLE':'HYPOTHETICAL_PATHWAY',
          `No existe fase líquida CT-0 de ${path.requiredSolvent} modelada en este nicho o corresponde a otro solvente`);
      if(path.needsDirectRock&&input.niche.waterRockContact!=='MODELLED_DIRECT')return missing('HYPOTHETICAL_PATHWAY',
        'Sin interfaz reactiva agua-silicato CT-0 acreditada (masa mineral no es superficie de reacción)');
      const reactants=path.reactants.map(r=>({r,inventory:store.get(r.species+'/'+r.phase)}));
      if(reactants.some(x=>x.inventory?.amountMoles===0))return missing('REACTANT_ABSENT','Reactivo explícitamente cuantificado como cero');
      if(reactants.some(x=>x.inventory===undefined))return missing('HYPOTHETICAL_PATHWAY','Faltan especies reactivas independientes en el nicho y fase');
      const therm=forcing.get(path.route);
      if(!therm)return missing('HYPOTHETICAL_PATHWAY','Sin ΔG°(T,P) y tasa de reacción independientes de calor y de índices V1');
      if(input.niche.temperatureKelvin===null||input.niche.pressurePascal===null||
         Math.abs(therm.temperatureKelvin-input.niche.temperatureKelvin)>1e-7*Math.max(1,therm.temperatureKelvin)||
         Math.abs(therm.pressurePascal-input.niche.pressurePascal)>1e-7*Math.max(1,therm.pressurePascal))
        return missing('NOT_EVALUABLE','La termodinámica no corresponde a temperatura y presión locales');
      const all=[...path.reactants,...path.products];
      if(all.some(x=>store.get(x.species+'/'+x.phase)?.activity===undefined||
        store.get(x.species+'/'+x.phase)?.activity===null))
        return missing('HYPOTHETICAL_PATHWAY','Faltan actividades químicas para el cociente de reacción Q');
      const reactantCapacity=Math.min(...reactants.map(x=>x.inventory!.amountMoles/x.r.coefficient));
      const rate=Math.min(therm.forwardRateMolesPerSecond,reactantCapacity/input.intervalSeconds);
      const lnQ=path.products.reduce((s,x)=>s+x.coefficient*Math.log(store.get(x.species+'/'+x.phase)!.activity!),0)-
        path.reactants.reduce((s,x)=>s+x.coefficient*Math.log(store.get(x.species+'/'+x.phase)!.activity!),0);
      const dg=therm.standardGibbsJoulesPerMole+8.31446261815324*therm.temperatureKelvin*lnQ;
      if(!finite(dg))throw new RangeError('PRE33_07_INVALID_GIBBS');
      const sources=Object.freeze([...new Set([...all.map(x=>store.get(x.species+'/'+x.phase)!.sourceId),
        therm.thermodynamicSourceId,therm.kineticSourceId])]);
      const conditional=input.provenance==='CONDITIONAL_ENDMEMBER';
      const status:Result['status']=conditional?'HYPOTHETICAL_PATHWAY':dg>=0?'THERMODYNAMICALLY_UNFAVOURABLE':'POWER_MODELLED_CT0';
      const power=conditional?null:Math.max(0,-dg)*rate;
      return Object.freeze({route:path.route,equation:path.equation,chargeAndAtomsBalanced:true,status,
        reason:conditional?'Composición/cinética de escenario: no es energía física resuelta':
          dg>=0?'Reacción directa no exergónica a las actividades actuales':
          'Balance Gibbs y flujo molar independiente con reactivos conservados',
        gibbsJoulesPerMole:dg,forwardRateMolesPerSecond:rate,chemicalPowerWatts:power,
        consumedReactantMoles:rate*input.intervalSeconds*path.reactants.reduce((s,r)=>s+r.coefficient,0),
        reactionExtentMoles:rate*input.intervalSeconds,sourceIds:sources});
    });
    // Conservative: each path is solved independently; shared reactant budgets
    // cannot be double-spent across competing pathways. Do not sum overlapping fluxes.
    const independentlyResolved=reactions.filter(r=>r.chemicalPowerWatts!==null);
    const positive=independentlyResolved.some(r=>r.chemicalPowerWatts!>0);
    const quantified=independentlyResolved.length===1?independentlyResolved[0].chemicalPowerWatts:
      independentlyResolved.length>1?null:null;
    return Object.freeze({contract:GEOCHEMISTRY_PRE33_07,niche:input.niche,
      inventorySourceIds:Object.freeze([...new Set(input.inventory.map(i=>i.sourceId))]),
      reactions:Object.freeze(reactions),quantifiedPathwayPowerWatts:quantified,
      globalChemicalPowerWatts:null,biologicallyExtractedPowerWatts:null,
      hasPositiveResolvedPower:positive,lifeEvaluated:false,
      observationallyConfirmed:false,notes:Object.freeze([
        'La potencia individual no se suma entre rutas que puedan competir por los mismos reactivos.',
        'ΔG = ΔG°(T,P) + RT ln Q; energía química (W) = max(0,−ΔG) × tasa (mol/s).',
        'Calor térmico (W/m²), luz bolométrica, índices V1 y límite de Carnot NO se convierten en potencia química.',
        'El resultado CT-0 no demuestra continuidad histórica, origen de vida ni observación.',
      ])} satisfies Output);
  }
}
