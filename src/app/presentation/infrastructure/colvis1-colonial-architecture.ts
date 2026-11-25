/** COLVIS.1 — Visual-only, deterministic architecture for a verified VIDA.8 colony.
 * No observations, no additional colony or resident count, no terraforming.
 * Distances are representative physical footprints, NOT measured colony extents.
 */
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import type { Vida38ColonyVisualPart386c } from './vida38-colonial-complex-38-6c';

export const COLVIS1_REVISION = 'COLVIS.1/architectural-reconstruction/v1' as const;
export type Colvis1Family = 'HUMANOID_ADVANCED' | 'HUMANOID_VERY_ADVANCED' |
  'REPTILIAN_ADVANCED' | 'REPTILIAN_VERY_ADVANCED' |
  'INSECTOID_ADVANCED' | 'INSECTOID_VERY_ADVANCED';
export type Colvis1Part = Vida38ColonyVisualPart386c;
export interface Colvis1HostEnvironment {
  readonly temperatureKelvin?: number | null;
  readonly pressurePascal?: number | null;
  readonly iceCoverage01?: number | null;
}
export interface Colvis1Layout {
  readonly revision: typeof COLVIS1_REVISION;
  readonly siteId: string;
  readonly seedUint32: number;
  readonly family: Colvis1Family;
  readonly worldKind: 'PLANET' | 'MOON';
  readonly founderTier: 'ADVANCED' | 'VERY_ADVANCED';
  readonly habitatTechnology: 'SEALED_SURFACE' | 'SUBSURFACE_VAULT' | 'ENVIRONMENTAL_SHIELD';
  readonly populationRange: readonly [number,number];
  readonly function: 'RESEARCH' | 'EXTRACTION' | 'HABITATION' | 'BIOSPHERE_CONSERVATION';
  /** Representative ground footprint radius in km. Not a scientific measurement. */
  readonly footprintRadiusKm: number;
  /** Maximum characteristic height of exposed architecture in km, not an orbital structure. */
  readonly maximumHeightKm: number;
  /** Maximum normalised x/z extent of high-detail part centroids. */
  readonly unitExtent: number;
  readonly medium: readonly Colvis1Part[];
  readonly high: readonly Colvis1Part[];
}
function rand(seed:number,salt:number):number {
  let n=(seed ^ Math.imul(salt+1,0x9e3779b1))>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d)>>>0;
  n=Math.imul(n^(n>>>15),0x846ca68b)>>>0;
  return ((n^(n>>>16))>>>0)/4294967296;
}
const validBands:Readonly<Record<string,readonly [number,number]>>={
  OUTPOST:[12,150], SETTLEMENT:[151,5000], CITY:[5001,120000], NETWORK:[120001,1500000],
};
function part(role:Colvis1Part['role'],shape:Colvis1Part['shape'],finish:Colvis1Part['finish'],
 x:number,z:number,width:number,height:number,depth:number,yaw=0,lift=0):Colvis1Part {
  return Object.freeze({role,shape,finish,x,z,width,height,depth,yaw,lift});
}
export function colvis1LayoutFromVerifiedPlan(plan:Vida38InfrastructurePlan386,
  environment:Colvis1HostEnvironment | null = null):Colvis1Layout|null {
  const info=plan.colonyArchitectureCOLVIS1;
  if(plan.provenance!=='VIDA8_COLONIAL_SETTLEMENT' || plan.tier!=='COLONIAL' ||
    plan.locationStatus!=='RECONSTRUCTED_NOT_OBSERVED' || !info ||
    !['ADVANCED','VERY_ADVANCED'].includes(info.founderTier) ||
    !['PLANET','MOON'].includes(info.destinationKind) ||
    !['HUMANOID','REPTILIAN','INSECTOID'].includes(plan.lineage) ||
    !['OUTPOST','SETTLEMENT','CITY','NETWORK'].includes(plan.scale) ||
    !['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'].includes(plan.habitatTechnology??'') ||
    !['RESEARCH','EXTRACTION','HABITATION','BIOSPHERE_CONSERVATION'].includes(info.function) ||
    !Number.isFinite(plan.seedUint32) || !Number.isFinite(plan.latitudeRadians) ||
    !Number.isFinite(plan.longitudeRadians)) return null;
  const expected=validBands[plan.scale];
  if(!expected || !Array.isArray(info.populationRange) || info.populationRange.length!==2 ||
    info.populationRange[0]!==expected[0] || info.populationRange[1]!==expected[1]) return null;

  const family=`${plan.lineage}_${info.founderTier}` as Colvis1Family;
  const advanced=info.founderTier==='VERY_ADVANCED';
  const moon=info.destinationKind==='MOON';
  const subsurface=plan.habitatTechnology==='SUBSURFACE_VAULT';
  const shield=plan.habitatTechnology==='ENVIRONMENTAL_SHIELD';
  const populationProxy=Math.sqrt(expected[0]*expected[1]); // design proxy, NOT asserted inhabitants
  const functionGain=info.function==='EXTRACTION'?1.16:info.function==='HABITATION'?1.06:1;
  // Surface-equivalent characteristic radius; dense arcologies and underground
  // settlements can accommodate more people without enlarging visible footprints.
  const radiusKm=Math.max(.07,Math.min(9,
    .16*Math.pow(populationProxy/55,.44)*(advanced?.82:1)*functionGain*(moon?.80:1)*(subsurface?.62:1)));
  const maximumHeightKm=Math.min(advanced?.82:.25,
    radiusKm*(advanced?.38:.18)*(subsurface?.25:1));
  const footprintRadiusKm=Number(radiusKm.toFixed(6));
  const high:Colvis1Part[]=[];
  const medium:Colvis1Part[]=[];
  const seed=plan.seedUint32;
  const spread=moon?.75:1;
  const maxNodes=plan.scale==='OUTPOST'?3:plan.scale==='SETTLEMENT'?5:plan.scale==='CITY'?8:11;
  const count=subsurface?Math.min(5,maxNodes):maxNodes;
  const add=(p:Colvis1Part,keepMedium=false)=>{high.push(p);if(keepMedium)medium.push(p);};
  const node=(role:Colvis1Part['role'],shape:Colvis1Part['shape'],finish:Colvis1Part['finish'],
    x:number,z:number,w:number,h:number,d:number,yaw=0,lift=0,keep=false)=>
    add(part(role,shape,finish,x,z,w,h,d,yaw,lift),keep);
  const link=(x:number,z:number,x2:number,z2:number,lift=0)=>{
    const dx=x2-x,dz=z2-z;
    node('CONNECTION','BOX','DARK',(x+x2)/2,(z+z2)/2,.09,.08,Math.hypot(dx,dz),Math.atan2(dx,dz),lift);
  };
  // A subsurface vault deliberately exposes entrances, technical hatches and
  // a small service crown — never an invented open-air surface city.
  if(subsurface){
    node('FOUNDATION','HEX','DARK',0,0,1.45,.13,1.45,0,0,true);
    node('ACCESS','CYLINDER','HULL',0,0,.96,.42,.96,0,0,true);
    node('ACCESS',advanced?'TAPER':'BOX','ACCENT',0,0,.55,.19,.55,0,.44);
  } else if(plan.lineage==='HUMANOID'){
    node('FOUNDATION','BOX','DARK',0,0,1.95,.12,1.68,0,0,true);
    node('MAIN_MODULE',advanced?'TAPER':'BOX','HULL',0,0,advanced?1.08:1.42,advanced?2.4:1.12,
      advanced?1.08:1.25,0,0,true);
    node('MAIN_MODULE',advanced?'HEX':'DOME',advanced?'CERAMIC':'DOME',0,0,
      advanced?.72:1.22,advanced?.22:.85,advanced?.72:1.22,0,advanced?2.38:.94);
    if(advanced){
      for(let layer=0;layer<3;layer++)node('BRIDGE','RING','ACCENT',0,0,
        1.35-layer*.17,.12,1.35-layer*.17,0,.65+layer*.59,layer===0);
    }
  } else if(plan.lineage==='REPTILIAN'){
    node('FOUNDATION','HEX','DARK',0,0,2.25,.14,2.1,0,0,true);
    for(let j=0;j<(advanced?4:2);j++)node('MAIN_MODULE','HEX',j%2?'HULL':'BASALT',0,0,
      1.84-j*.29,.22+(advanced?.18:.14),1.84-j*.29,.15*j,j*(advanced?.36:.29),j===0);
    if(advanced) node('MAIN_MODULE','TAPER','CERAMIC',0,0,.72,.85,.72,0,1.60);
  } else {
    node('FOUNDATION','HEX','DARK',0,0,1.85,.13,1.85,0,0,true);
    node('MAIN_MODULE','HEX','HULL',0,0,1.3,advanced?1.52:.9,1.3,0,0,true);
    if(advanced){
      node('MAIN_MODULE','HEX','CERAMIC',0,0,.75,.75,.75,.22,1.55);
      node('BRIDGE','RING','ACCENT',0,0,1.6,.09,1.6,0,1.20);
    }
  }

  for(let i=0;i<count;i++){
    const isInsectoid=plan.lineage==='INSECTOID';
    const isReptilian=plan.lineage==='REPTILIAN';
    const angle=(Math.PI*2*i/count)+rand(seed,10+i)*.42;
    const r=(subsurface?2.0:2.35+(.65*rand(seed,22+i)))*spread;
    const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    const yaw=isInsectoid?angle:angle+rand(seed,44+i)*.28;
    const width=(subsurface?.54:isInsectoid?.89:isReptilian?1.04:.78)*(.88+.19*rand(seed,55+i));
    const height=subsurface?.27:advanced?(isInsectoid?1.24:isReptilian?1.05:1.7):
      (isReptilian?.65:isInsectoid?.90:.72);
    const shape:Colvis1Part['shape']=subsurface?'CYLINDER':isInsectoid?'HEX':isReptilian?'TAPER':'BOX';
    node('FOUNDATION',isInsectoid?'HEX':'CYLINDER','DARK',x,z,width*1.18,.11,width*1.18,yaw,0,i<2);
    node(subsurface?'ACCESS':'AUXILIARY',shape,isReptilian?'BASALT':'HULL',
      x,z,width,height*(.82+.22*rand(seed,80+i)),width*.85,yaw,0,i<2);
    if(!subsurface){
      if(advanced){
        node('TECH_NODE',isInsectoid?'HEX':isReptilian?'TAPER':'RING',
          isInsectoid?'CERAMIC':'ACCENT',x,z,width*.73,.13,width*.73,yaw,height*.77);
      } else if(!moon){
        node('PANEL',isInsectoid?'HEX':'BOX','PANEL',x,z,width*.65,.11,width*.64,yaw,height*.76);
      }
      link(0,0,x,z,subsurface?0:.07);
    }
    if(isInsectoid&&advanced&&!subsurface&&i>0){
      const prevAngle=Math.PI*2*(i-1)/count+rand(seed,9+i)*.42;
      link(x,z,Math.cos(prevAngle)*r,Math.sin(prevAngle)*r,.35);
      node('BRIDGE','RING','ACCENT',x,z,width*.85,.09,width*.85,yaw,height*.45);
    }
    if(isReptilian&&advanced&&!subsurface){
      node('MAIN_MODULE','HEX','CERAMIC',x,z,width*.65,.17,width*.65,yaw,height*.84);
    }
  }

  // Function changes BUILDING KINDS, not just palette; compact planetary and
  // lunar variants share the same immutable reconstruction/anchor.
  const specialist=info.function;
  if(specialist==='RESEARCH'){
    node('ANTENNA','MAST','PANEL',moon?-1.1:-2.6,moon?-1.6:-2.1,.17,advanced?1.65:1.25,.17);
    node('SENSOR','RING','ACCENT',moon?-1.1:-2.6,moon?-1.6:-2.1,.72,.12,.72,0,advanced?1.6:1.2);
  } else if(specialist==='EXTRACTION'){
    node('EXTRACTOR','TAPER','BASALT',2.65*spread,1.0*spread,.78,advanced?1.20:.75,.78);
    node('EXTRACTOR','CYLINDER','ACCENT',2.65*spread,-.6*spread,.62,.45,.62);
  } else if(specialist==='HABITATION'){
    node('HABITAT',subsurface?'CYLINDER':'DOME',subsurface?'PANEL':'DOME',-2.25*spread,.7*spread,
      1.0,advanced?1.05:.70,1.0);
  } else {
    node('BIOLAB','DOME','DOME',-2.15*spread,-.75*spread,1.0,advanced?1.05:.72,1.0);
    node('BIOLAB','CYLINDER','CERAMIC',-2.15*spread,-.75*spread,.56,.21,.56,0,.59);
  }
  if(shield&&!subsurface){
    node('ENVIRONMENTAL_COVER','DOME','DOME',0,0,3.65*spread,.64,3.65*spread,0,0,true);
  }
  // These are presentation claddings on the EXISTING habitat, not an
  // atmospheric change, a new shield technology or confirmed observables.
  const temp=environment?.temperatureKelvin;
  const pressure=environment?.pressurePascal;
  if(temp!==undefined && temp!==null && Number.isFinite(temp) && temp>600 && !subsurface){
    node('PANEL','HEX','CERAMIC',1.15,-.38,.82,.14,.82,.2,.65);
    node('PANEL','HEX','CERAMIC',-1.0,.48,.76,.14,.76,-.2,.65);
  }
  if(temp!==undefined && temp!==null && Number.isFinite(temp) && temp<175){
    node('FOUNDATION','HEX','CERAMIC',1.2,1.1,.70,.12,.70);
  }
  if(pressure!==undefined && pressure!==null && Number.isFinite(pressure) && pressure<1000 && !subsurface){
    node('CONNECTION','BOX','DARK',-.45,-1.1,.14,.12,1.3);
  }
  if(moon){
    // Compact lunar access shelter; not a planet-wide shield.
    node('FOUNDATION','HEX','BASALT',-1.60,-1.55,.78,.18,.78,0,0,true);
    node('ACCESS','CYLINDER','DARK',-1.60,-1.55,.58,.34,.58);
  }
  // Subsurface bases deliberately have fewer outward-facing elements, even if
  // the founding civilization is VERY_ADVANCED or has NETWORK population band.
  if(high.length>110)high.length=110;
  if(medium.length===0)medium.push(high[0]!);
  const layout:Colvis1Layout={revision:COLVIS1_REVISION,siteId:plan.id,seedUint32:seed,
    family,worldKind:info.destinationKind,founderTier:info.founderTier,
    habitatTechnology:plan.habitatTechnology!,populationRange:Object.freeze([...expected]) as unknown as readonly [number,number],
    function:info.function,footprintRadiusKm,maximumHeightKm:Number(maximumHeightKm.toFixed(6)),
    unitExtent:4.5,medium:Object.freeze(medium),high:Object.freeze(high)};
  return Object.freeze(layout);
}
