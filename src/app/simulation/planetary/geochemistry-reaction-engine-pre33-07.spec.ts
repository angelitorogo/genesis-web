import { describe, it, expect } from 'vitest';
import { GeochemistryReactionEnginePRE3307 as Engine } from './geochemistry-reaction-engine-pre33-07';
import { GeochemistryWorldPRE3307 } from './geochemistry-world-pre33-07';
import { unifyPlanetFicheSections } from '../../presentation/planet-detail/planet-scientific-fiche-layout';
import { geoChemicalFieldsPRE3307 } from '../../presentation/scientific/geochemistry-fields-pre33-07';
import type { ChemicalForcingPRE3307 as Input } from '../../domain/planetary/geochemistry-pre33-07';
const case0=():Input=>({
  niche:{bodyKind:'MOON',niche:'SUBSURFACE_OCEAN',solvent:'H2O',solventState:'MODELLED_LIQUID_CT0',
    waterRockContact:'MODELLED_DIRECT',temperatureKelvin:298.15,pressurePascal:1e5,
    thermalHeatFluxWattsPerSquareMeter:100000,sourceId:'FIXTURE_CT0_SOLVENT'},
  intervalSeconds:10,provenance:'INDEPENDENT_REACTION_MASS_AND_RATE_MODEL',
  inventory:[
    {species:'H2',phase:'AQUEOUS',amountMoles:2,activity:1,sourceId:'INDEPENDENT_H2'},
    {species:'O2',phase:'AQUEOUS',amountMoles:1,activity:1,sourceId:'INDEPENDENT_O2'},
    {species:'H2O',phase:'LIQUID',amountMoles:100,activity:1,sourceId:'INDEPENDENT_H2O'},
  ],kinetics:[{route:'HYDROGEN_OXIDATION',standardGibbsJoulesPerMole:-474000,
    temperatureKelvin:298.15,pressurePascal:1e5,forwardRateMolesPerSecond:.01,
    thermodynamicSourceId:'THERMODYNAMIC_FIT_AT_TP',kineticSourceId:'REACTION_RATE_MODEL'}],
});
describe('PRE-33.07 — energía geoquímica causal',()=>{
  it('conserva átomos y carga en las seis rutas',()=>expect(Engine.verifyStoichiometry()).toBe(true));
  it('con reactivos, actividades, ΔG(T,P) y tasas calcula W sin Carnot',()=>{
    const a=Engine.assess(case0()),r=a.reactions[0];
    expect(r.status).toBe('POWER_MODELLED_CT0');expect(r.chemicalPowerWatts).toBeCloseTo(4740);
    expect(a.quantifiedPathwayPowerWatts).toBeCloseTo(4740);
    expect(a.globalChemicalPowerWatts).toBeNull();expect(a.biologicallyExtractedPowerWatts).toBeNull();expect(a.lifeEvaluated).toBe(false);
  });
  it('océano sin especies identificadas no produce potencia',()=>{
    const a=Engine.assess({...case0(),inventory:[],kinetics:[]});
    expect(a.quantifiedPathwayPowerWatts).toBeNull();expect(a.hasPositiveResolvedPower).toBe(false);
  });
  it('si falta oxidante o está identificado a cero separa ausencia y desconocimiento',()=>{
    const b=case0();const a=Engine.assess({...b,inventory:b.inventory.filter(x=>x.species!=='O2')});
    expect(a.reactions[0].status).toBe('HYPOTHETICAL_PATHWAY');
    const zero=Engine.assess({...b,inventory:b.inventory.map(x=>x.species==='O2'?{...x,activity:null,amountMoles:0}:x)});
    expect(zero.reactions[0].status).toBe('REACTANT_ABSENT');
  });
  it('sin tasa no convierte calor enorme en vatios químicos',()=>{
    const b=case0(),a=Engine.assess({...b,kinetics:[]});
    expect(a.quantifiedPathwayPowerWatts).toBeNull();
  });
  it('un gradiente de Gibbs desfavorable no genera potencia positiva',()=>{
    const b=case0(),a=Engine.assess({...b,kinetics:b.kinetics.map(x=>({...x,standardGibbsJoulesPerMole:1e4}))});
    expect(a.reactions[0].chemicalPowerWatts).toBe(0);
    expect(a.reactions[0].status).toBe('THERMODYNAMICALLY_UNFAVOURABLE');
  });
  it('la reserva máxima limita la tasa sin crear moles',()=>{
    const b=case0(),a=Engine.assess({...b,kinetics:b.kinetics.map(x=>({...x,forwardRateMolesPerSecond:1000}))});
    expect(a.reactions[0].reactionExtentMoles).toBeCloseTo(1);
    expect(a.reactions[0].forwardRateMolesPerSecond).toBeCloseTo(.1);
  });
  it('escenario de composición no se promociona a potencia física',()=>{
    const a=Engine.assess({...case0(),provenance:'CONDITIONAL_ENDMEMBER'});
    expect(a.reactions[0].gibbsJoulesPerMole).not.toBeNull();
    expect(a.reactions[0].chemicalPowerWatts).toBeNull();
  });
  it('no admite masa/actividad/flujo inválido ni fuentes de índices V1',()=>{
    const b=case0();
    expect(()=>Engine.assess({...b,inventory:[{...b.inventory[0],amountMoles:-1}]})).toThrow();
    expect(()=>Engine.assess({...b,inventory:b.inventory.map(x=>({...x,sourceId:'V1_INDEX'}))})).toThrow();
    expect(()=>Engine.assess({...b,kinetics:b.kinetics.map(x=>({...x,forwardRateMolesPerSecond:-1}))})).toThrow();
  });
  it('sin temperatura/presión local no evalúa Gibbs usando una tabla fuera de rango',()=>{
    const b=case0();expect(Engine.assess({...b,niche:{...b.niche,temperatureKelvin:null}}).reactions[0].chemicalPowerWatts).toBeNull();
  });
  it('NH3/CH4 no se convierten a reacciones acuosas ni a H2O líquida ficticia',()=>{
    const b=case0();
    for(const solvent of ['NH3','CH4'] as const){
      const a=Engine.assess({...b,niche:{...b.niche,solvent}});
      expect(a.reactions[0].chemicalPowerWatts).toBeNull();
    }
  });
  it('solvente NH3 con inventario y cinética independientes admite ruta alternativa conservativa',()=>{
    const b=case0();
    const i=[
      {species:'NH3' as const,phase:'LIQUID' as const,amountMoles:40,activity:1,sourceId:'NH3_MODEL'},
      {species:'O2' as const,phase:'GAS' as const,amountMoles:30,activity:1,sourceId:'O2_MODEL'},
      {species:'N2' as const,phase:'GAS' as const,amountMoles:20,activity:1,sourceId:'N2_MODEL'},
      {species:'H2O' as const,phase:'SOLID' as const,amountMoles:60,activity:1,sourceId:'H2O_MODEL'},
    ];
    const g=Engine.assess({...b,niche:{...b.niche,solvent:'NH3',temperatureKelvin:220},inventory:i,
      kinetics:[{route:'AMMONIA_OXIDATION',standardGibbsJoulesPerMole:-300000,temperatureKelvin:220,
        pressurePascal:1e5,forwardRateMolesPerSecond:.01,
        thermodynamicSourceId:'LAB_MODEL_NH3_THERMO',kineticSourceId:'LAB_MODEL_NH3_RATE'}]});
    expect(g.reactions.find(x=>x.route==='AMMONIA_OXIDATION')?.chemicalPowerWatts).toBeCloseTo(3000);
  });
  it('solvente CH4 y oxidación alternativa exigen sus cuatro especies y tasas propias',()=>{
    const b=case0();
    const i=[
      {species:'CH4' as const,phase:'LIQUID' as const,amountMoles:10,activity:1,sourceId:'CH4_MODEL'},
      {species:'O2' as const,phase:'GAS' as const,amountMoles:20,activity:1,sourceId:'O2_MODEL'},
      {species:'CO2' as const,phase:'GAS' as const,amountMoles:10,activity:1,sourceId:'CO2_MODEL'},
      {species:'H2O' as const,phase:'SOLID' as const,amountMoles:20,activity:1,sourceId:'H2O_MODEL'},
    ];
    const g=Engine.assess({...b,niche:{...b.niche,solvent:'CH4',temperatureKelvin:100},inventory:i,
      kinetics:[{route:'METHANE_OXIDATION',standardGibbsJoulesPerMole:-100000,temperatureKelvin:100,
        pressurePascal:1e5,forwardRateMolesPerSecond:.01,
        thermodynamicSourceId:'LAB_MODEL_CH4_THERMO',kineticSourceId:'LAB_MODEL_CH4_RATE'}]});
    expect(g.reactions.find(x=>x.route==='METHANE_OXIDATION')?.chemicalPowerWatts).toBeCloseTo(1000);
  });
  it('los contratos V3 conservan química, pero la ficha compacta no expone diagnósticos internos',()=>{
    const chem=geoChemicalFieldsPRE3307(Engine.assess({...case0(),kinetics:[]}));
    const base={id:'geology' as const,eyebrow:'',title:'',summary:'',fields:chem};
    const v3=unifyPlanetFicheSections([base])[0];
    const v2=unifyPlanetFicheSections([{...base,fields:[]}])[0];
    expect(chem.some(f=>f.label==='PRE-33.07 — Potencia química exergónica (ruta)')).toBe(true);
    // VIDA.9d deliberately hides internal PRE-33 diagnostics in the compact fiche.
    expect(v3.fields.some(f=>f.label.startsWith('PRE-33.07'))).toBe(false);
    expect(v3.fields.some(f=>f.label==='Régimen geológico')).toBe(true);
    expect(v2.fields.some(f=>f.label.startsWith('PRE-33.07'))).toBe(false);
  });
  it('luna 32.F.4 con reactivos desconocidos nunca obtiene potencia desde el calor',()=>{
    const a=GeochemistryWorldPRE3307.moon(null,null);
    expect(a.quantifiedPathwayPowerWatts).toBeNull();expect(a.lifeEvaluated).toBe(false);
  });
});
