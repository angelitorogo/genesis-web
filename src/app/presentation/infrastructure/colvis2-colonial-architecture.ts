/** COLVIS.2: genuinely different morphologies, not recoloured COLVIS.1 primitives.
 * Pure deterministic reconstruction; validated VIDA.8 scientific input remains immutable.
 */
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';
import type { Vida38ColonyVisualPart386c as Piece } from './vida38-colonial-complex-38-6c';
import { colvis1LayoutFromVerifiedPlan, type Colvis1HostEnvironment, type Colvis1Layout } from './colvis1-colonial-architecture';

export const COLVIS2_REVISION='COLVIS.2/sculpted-extraterrestrial-architecture/v1' as const;
export type Colvis2Layout=Omit<Colvis1Layout,'revision'|'medium'|'high'> & Readonly<{
  revision:typeof COLVIS2_REVISION; medium:readonly Piece[];high:readonly Piece[];
  /** Visual-only, not measured or observed. */
  architecturalLanguage:'MODULAR_URBAN'|'SCALED_MONUMENTAL'|'CHITINOUS_CELLULAR';
  silhouetteSignature:string;
}>;
function random(seed:number,salt:number):number {
  let n=(seed ^ Math.imul(salt+1,0x9e3779b1))>>>0;
  n=Math.imul(n^(n>>>16),0x7feb352d)>>>0;
  n=Math.imul(n^(n>>>15),0x846ca68b)>>>0;
  return ((n^(n>>>16))>>>0)/4294967296;
}
function piece(role:Piece['role'],shape:Piece['shape'],finish:Piece['finish'],
  x:number,z:number,width:number,height:number,depth:number,yaw=0,lift=0):Piece {
  return Object.freeze({role,shape,finish,x,z,width,height,depth,yaw,lift});
}
export function colvis2LayoutFromVerifiedPlan(plan:Vida38InfrastructurePlan386,
  environment:Colvis1HostEnvironment|null=null):Colvis2Layout|null {
  // Reuse the exact COLVIS.1 fail-closed identity/VIDA.8 validation and metric
  // footprint. Do not let the new artistically richer silhouettes authorize a
  // site that wasn't authorized for rendering already.
  const base=colvis1LayoutFromVerifiedPlan(plan,environment);
  if(!base)return null;
  const seed=base.seedUint32;
  const advanced=base.founderTier==='VERY_ADVANCED';
  const moon=base.worldKind==='MOON';
  const buried=base.habitatTechnology==='SUBSURFACE_VAULT';
  const shield=base.habitatTechnology==='ENVIRONMENTAL_SHIELD';
  const humanoid=plan.lineage==='HUMANOID';
  const reptilian=plan.lineage==='REPTILIAN';
  const language=humanoid?'MODULAR_URBAN':reptilian?'SCALED_MONUMENTAL':'CHITINOUS_CELLULAR';
  const high:Piece[]=[],medium:Piece[]=[];
  const add=(p:Piece,principal=false):void=>{high.push(p);if(principal)medium.push(p);};
  const emit=(role:Piece['role'],shape:Piece['shape'],finish:Piece['finish'],
    x:number,z:number,w:number,h:number,d:number,yaw=0,lift=0,principal=false):void=>{
    add(piece(role,shape,finish,x,z,w,h,d,yaw,lift),principal);
  };
  const hull=humanoid?'HUMAN_ALLOY':reptilian?'REPTILE_SCUTE':'INSECT_CHITIN';
  const secondary=humanoid?'HUMAN_GLASS':reptilian?'REPTILE_CORE':'INSECT_PEARL';
  const central=buried?(humanoid?'HUMAN_HANGAR':reptilian?'REPTILE_SHELL':'INSECT_HIVE'):
    humanoid?(advanced?'HUMAN_ARCOLOGY':'HUMAN_HAB'):
    reptilian?(advanced?'REPTILE_CITADEL':'REPTILE_KEEP'):
      (advanced?'INSECT_SPIRE':'INSECT_HIVE');
  const support=humanoid?(advanced?'HUMAN_ARCOLOGY':'HUMAN_HANGAR'):
    reptilian?(advanced?'REPTILE_CITADEL':'REPTILE_SHELL'):
      (advanced?'INSECT_CELL':'INSECT_POD');
  const connector=humanoid?'HUMAN_BRIDGE':reptilian?'REPTILE_CAUSEWAY':'INSECT_TUNNEL';
  const n=plan.scale==='OUTPOST'?2:plan.scale==='SETTLEMENT'?4:plan.scale==='CITY'?7:10;
  const nodes=buried?Math.min(3,n):n;
  const spread=moon?.74:1;
  const centralHeight=buried?.40:advanced?(humanoid?3.2:reptilian?3.0:3.45):
    (humanoid?1.30:reptilian?1.22:1.5);
  // Subsurface colonies have surface accesses and technical crowns, never an
  // exterior invented city. Large populations remain UNDER the ground.
  emit('FOUNDATION',humanoid?'CYLINDER':reptilian?'HEX':'DOME','DARK',0,0,1.95,.13,1.95,0,0,true);
  emit(buried?'ACCESS':'MAIN_MODULE',central,hull,0,0,
    buried?1.22:advanced?1.37:1.52,centralHeight,buried?1.24:1.44,0,0,true);
  if(!buried){
    if(humanoid){
      emit('BRIDGE','RING',secondary,0,0,advanced?1.42:1.01,.09,
        advanced?1.42:1.01,0,advanced?2.03:.52,advanced);
    }else if(reptilian){
      for(let j=0;j<(advanced?4:2);j++){
        const angle=j*Math.PI/2+.25;
        emit('TECH_NODE','REPTILE_SPINE',secondary,Math.cos(angle)*.86,
          Math.sin(angle)*.86,.22,advanced?1.65:.69,.22,angle,0,j===0);
      }
    }else{
      for(let j=0;j<(advanced?5:3);j++){
        const a=j*2*Math.PI/(advanced?5:3)+.15;
        emit('TECH_NODE','INSECT_POD',secondary,Math.cos(a)*.93,Math.sin(a)*.93,
          .46,.75,.46,a,advanced?.48:.10,advanced&&j===0);
      }
    }
  }
  // Species-specific urban grammars:
  // - humanoid: planned gridded blocks and functional walkways
  // - reptilian: monumental crescents, broad armored causeways
  // - insectoid: dendritic growth / irregular chamber-chain circulation.
  const positions:Array<{x:number;z:number;angle:number}>=[];
  for(let i=0;i<nodes;i++){
    let x:number,z:number,angle:number;
    if(humanoid){
      const col=i%3,row=Math.floor(i/3);
      x=(-2.55+col*2.4+random(seed,31+i)*.24)*spread;
      z=(-2.0+row*1.95+random(seed,51+i)*.26)*spread;
      angle=((i%2)?Math.PI/2:0)+random(seed,91+i)*.09;
    }else if(reptilian){
      const theta=-1.2+i*2.4/Math.max(1,nodes-1);
      const r=(2.5+random(seed,61+i)*.56)*spread;
      x=Math.cos(theta)*r-(1.05*spread);z=Math.sin(theta)*r;
      angle=theta+Math.PI/2;
    }else{
      const branch=i%3,ring=Math.floor(i/3)+1;
      const a=branch*2*Math.PI/3+.25+(random(seed,71+i)-.5)*.38;
      const r=(1.08+ring*1.17+random(seed,81+i)*.18)*spread;
      x=Math.cos(a)*r;z=Math.sin(a)*r;angle=a;
    }
    positions.push({x,z,angle});
    const w=(humanoid?.94:reptilian?1.28:.95)*(.86+random(seed,100+i)*.22);
    const height=buried?.35:advanced?(humanoid?1.85:reptilian?1.34:2.07):
      humanoid?.88:reptilian?.75:1.16;
    emit('FOUNDATION',humanoid?'BOX':reptilian?'HEX':'DOME','DARK',x,z,
      w*1.12,.10,w*1.05,angle,0,i<2);
    emit(buried?'ACCESS':'AUXILIARY',buried?central:support,hull,
      x,z,w,height*(.85+random(seed,131+i)*.23),w*.93,angle,0,i<2);
    if(!buried){
      if(advanced){
        // Visible but small-scale multi-level cladding, not a second colony.
        const detail=humanoid?'HUMAN_HAB':reptilian?'REPTILE_SPINE':'INSECT_POD';
        emit('TECH_NODE',detail,secondary,x,z,w*.51,.62,w*.51,angle,height*.80,i===0);
      }
      // Real links between actual chosen nodes; no accidental auto-created
      // colony records. Every shape has species-specific cross section.
      const parent=!humanoid && !reptilian && i>=3?positions[i-3]!:{x:0,z:0};
      const dx=x-parent.x,dz=z-parent.z;
      const length=Math.hypot(dx,dz);
      if(length>.15){
        emit('CONNECTION',connector,'DARK',(x+parent.x)/2,(z+parent.z)/2,
          humanoid?.26:reptilian?.34:.31,
          advanced?.30:.22,length,Math.atan2(dx,dz),0,i===0);
      }
    }
  }
  if(!buried && advanced){
    if(humanoid){
      emit('MAIN_MODULE','HUMAN_ARCOLOGY',secondary,.85,-.75,.65,2.15,.67,.15,0,true);
      emit('BRIDGE','HUMAN_BRIDGE','ACCENT',-.95,.65,.25,.24,2.55,.55,1.03);
    }else if(reptilian){
      emit('MAIN_MODULE','REPTILE_CITADEL',secondary,-1.38,.42,1.18,2.32,1.18,.20,0,true);
      for(let j=0;j<3;j++)emit('TECH_NODE','REPTILE_SPINE','REPTILE_CORE',
        -1.6+j*.8,-1.0,.20,1.52,.20,0,0,j===0);
    }else{
      emit('MAIN_MODULE','INSECT_SPIRE',secondary,.9,-.65,.83,2.7,.83,.08,0,true);
      emit('TECH_NODE','INSECT_CELL','INSECT_PEARL',-1.1,.75,1.02,1.62,.93,.12,.73);
      emit('CONNECTION','INSECT_TUNNEL','INSECT_CHITIN',-.3,.05,.30,.30,2.1,.50,.52);
    }
  }
  // Function-specific modules employ the SAME species-native geometry, not an
  // incongruous dome on every insectoid/reptilian settlement.
  const specialist=base.function;
  if(specialist==='RESEARCH'){
    emit('SENSOR',humanoid?'MAST':reptilian?'REPTILE_SPINE':'INSECT_SPIRE',secondary,
      -2.45*spread,-2.25*spread,.25,advanced?1.70:1.12,.25);
  }else if(specialist==='EXTRACTION'){
    emit('EXTRACTOR',humanoid?'HUMAN_HANGAR':reptilian?'REPTILE_SHELL':'INSECT_POD',
      hull,2.38*spread,-2.15*spread,.88,.75,.91);
    emit('TECH_NODE',humanoid?'MAST':reptilian?'REPTILE_SPINE':'INSECT_SPIRE',secondary,
      2.52*spread,-1.45*spread,.18,.91,.18);
  }else if(specialist==='HABITATION'){
    emit('HABITAT',humanoid?'HUMAN_HAB':reptilian?'REPTILE_KEEP':'INSECT_HIVE',hull,
      -1.95*spread,2.08*spread,1.07,1.10,1.02);
  }else{
    emit('BIOLAB',humanoid?'HUMAN_HANGAR':reptilian?'REPTILE_SHELL':'INSECT_CELL',
      secondary,-2.26*spread,2.0*spread,1.04,.91,1.04);
  }
  if(shield&&!buried){
    // A local cladding around the same protected colony, NOT a world-wide
    // shield or a newly observed technology.
    emit('ENVIRONMENTAL_COVER',humanoid?'DOME':reptilian?'REPTILE_SHELL':'INSECT_CELL',
      secondary,0,0,moon?2.1:2.4,moon?.65:.80,moon?2.1:2.4,0,0,true);
  }
  if(moon){
    emit('ACCESS',humanoid?'HUMAN_HANGAR':reptilian?'REPTILE_SHELL':'INSECT_POD',
      hull,-1.35,-1.40,.70,.44,.70,0,0,true);
  }
  const temp=environment?.temperatureKelvin;
  if(Number.isFinite(temp) && temp!==null && temp!==undefined && temp>600 && !buried){
    emit('PANEL',humanoid?'HUMAN_HAB':reptilian?'REPTILE_SHELL':'INSECT_POD',
      secondary,1.08,1.21,.53,.25,.51);
  }
  if(medium.length===0)medium.push(high[0]!);
  const result:Colvis2Layout=Object.freeze({
    ...base,revision:COLVIS2_REVISION,
    architecturalLanguage:language,
    silhouetteSignature:[language,advanced?'V':'A',moon?'L':'P',buried?'B':'S',
      central,connector,support].join('|'),
    unitExtent:6.6,
    medium:Object.freeze(medium),high:Object.freeze(high),
  });
  return result;
}
