/** 38.6c — Pure, deterministic *visual* reconstruction of an authorized VIDA.8
 * colonial footprint. Nothing here describes observed facilities, their count,
 * physical dimensions or a new VIDA.8 population. The site centre and seed are
 * exactly the ones provided by the immutable 38.6 plan.
 */
import type { Vida38InfrastructurePlan386 } from './vida38-infrastructure-plan-38-6';

export const VIDA38_COLONIAL_COMPLEX_REVISION_386C = 'VIDA.38.6c/colonial-complex/visual-v1' as const;

export type Vida38ColonyPartRole386c =
  | 'ACCESS' | 'MAIN_MODULE' | 'AUXILIARY' | 'ANTENNA' | 'VENT'
  | 'CONNECTION' | 'FOUNDATION' | 'PRESSURIZED_DOME'
  | 'BRIDGE' | 'TECH_NODE' | 'PANEL' | 'SENSOR' | 'EXTRACTOR'
  | 'HABITAT' | 'BIOLAB' | 'ENVIRONMENTAL_COVER';
export type Vida38ColonyPartShape386c = 'BOX' | 'CYLINDER' | 'DOME' | 'MAST' | 'HEX' | 'TAPER' | 'RING'
  | 'HUMAN_HAB' | 'HUMAN_HANGAR' | 'HUMAN_ARCOLOGY' | 'HUMAN_BRIDGE'
  | 'REPTILE_KEEP' | 'REPTILE_SHELL' | 'REPTILE_CITADEL' | 'REPTILE_SPINE' | 'REPTILE_CAUSEWAY'
  | 'INSECT_POD' | 'INSECT_HIVE' | 'INSECT_SPIRE' | 'INSECT_CELL' | 'INSECT_TUNNEL';
export type Vida38ColonyPartMaterial386c = 'HULL' | 'DARK' | 'PANEL' | 'ACCENT' | 'DOME' | 'BASALT' | 'CERAMIC'
  | 'HUMAN_ALLOY' | 'HUMAN_GLASS' | 'REPTILE_SCUTE' | 'REPTILE_CORE' | 'INSECT_CHITIN' | 'INSECT_PEARL';

/** All dimensions are dimensionless multiples of the already-derived 38.6
 * site size. They have NO geophysical or civilizational meaning. */
export interface Vida38ColonyVisualPart386c {
  readonly role: Vida38ColonyPartRole386c;
  readonly shape: Vida38ColonyPartShape386c;
  readonly finish: Vida38ColonyPartMaterial386c;
  readonly x: number;
  readonly z: number;
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly yaw: number;
  /** Additional vertical distance above the radial terrain contact. */
  readonly lift: number;
}
export interface Vida38ColonialComplexLayout386c {
  readonly revision: typeof VIDA38_COLONIAL_COMPLEX_REVISION_386C;
  readonly siteId: string;
  readonly seedUint32: number;
  readonly habitatTechnology: NonNullable<Vida38InfrastructurePlan386['habitatTechnology']>;
  /** Display-only optical exaggeration on distant planet/moon fiches. */
  readonly visualScaleMultiplier: number;
  readonly medium: readonly Vida38ColonyVisualPart386c[];
  readonly high: readonly Vida38ColonyVisualPart386c[];
}

function noise(seed: number, salt: number): number {
  let n = (seed ^ Math.imul(salt + 1, 0x9e3779b1)) >>> 0;
  n = Math.imul(n ^ (n >>> 16), 0x7feb352d) >>> 0;
  n = Math.imul(n ^ (n >>> 15), 0x846ca68b) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
function part(role: Vida38ColonyPartRole386c, shape: Vida38ColonyPartShape386c,
  finish: Vida38ColonyPartMaterial386c, x: number, z: number,
  width: number, height: number, depth: number, yaw = 0, lift = 0): Vida38ColonyVisualPart386c {
  return Object.freeze({role,shape,finish,x,z,width,height,depth,yaw,lift});
}
function connector(a: {x: number;z: number}, b: {x: number;z: number},
  width = .16): Vida38ColonyVisualPart386c {
  const dx=b.x-a.x,dz=b.z-a.z;
  return part('CONNECTION','BOX','DARK',(a.x+b.x)/2,(a.z+b.z)/2,
    width,.09,Math.hypot(dx,dz)+.16,Math.atan2(dx,dz));
}
/** Returns null unless a certified VIDA.8 plan actually supports a colony.
 * No location is chosen here. The 38.6 anchor is never recomputed or moved.
 */
export function vida38ColonialComplexLayout386c(
  plan: Vida38InfrastructurePlan386,
): Vida38ColonialComplexLayout386c | null {
  if (plan.provenance !== 'VIDA8_COLONIAL_SETTLEMENT' || plan.tier !== 'COLONIAL' ||
      plan.locationStatus !== 'RECONSTRUCTED_NOT_OBSERVED' ||
      !['SUBSURFACE_VAULT','SEALED_SURFACE','ENVIRONMENTAL_SHIELD'].includes(plan.habitatTechnology ?? '') ||
      !['OUTPOST','SETTLEMENT','CITY','NETWORK'].includes(plan.scale) ||
      !Number.isFinite(plan.seedUint32) || !Number.isFinite(plan.latitudeRadians) ||
      !Number.isFinite(plan.longitudeRadians)) return null;
  const tech = plan.habitatTechnology!;
  const major = plan.scale === 'CITY' || plan.scale === 'NETWORK';
  const intermediate = plan.scale === 'SETTLEMENT';
  // Optical exaggeration is intentionally bounded: OUTPOST remains smaller
  // than CITY and the same planet remains a planet, not a patchwork of cities.
  const visualScaleMultiplier = major ? 4.35 : intermediate ? 3.95 : 3.55;
  const seed=plan.seedUint32;
  const high: Vida38ColonyVisualPart386c[]=[];
  const medium: Vida38ColonyVisualPart386c[]=[];
  const add=(p:Vida38ColonyVisualPart386c)=>high.push(p);
  const addMedium=(p:Vida38ColonyVisualPart386c)=>medium.push(p);
  const centre={x:0,z:0};

  // Subsurface complexes are represented by *surface support*, not by an
  // invented exterior city. Every ACCESS below is an exterior access point
  // to the same single colony, never an additional scientific settlement.
  if(tech==='SUBSURFACE_VAULT') {
    const accessCount=major?5:intermediate?4:3;
    const ring=major?2.65:2.15;
    for(let j=0;j<accessCount;j++){
      const a=2*Math.PI*j/accessCount + .3;
      const r=ring*(.85+.16*noise(seed,j+30));
      const x=Math.cos(a)*r,z=Math.sin(a)*r;
      add(part('FOUNDATION','CYLINDER','PANEL',x,z,.92,.12,.92));
      add(part('ACCESS','CYLINDER','DARK',x,z,.77,.23,.77));
      add(part('ACCESS','BOX','ACCENT',x,z,.53,.10,.36,a,.23));
      add(connector(centre,{x,z}));
      if(j<2) addMedium(part('FOUNDATION','CYLINDER','PANEL',x,z,1.05,.18,1.05));
    }
    add(part('MAIN_MODULE','BOX','HULL',0,0,1.78,1.08,1.38));
    add(part('MAIN_MODULE','BOX','PANEL',0,0,1.22,.16,.93,0,1.08));
    addMedium(part('MAIN_MODULE','BOX','HULL',0,0,1.95,1.03,1.5));
  } else {
    const shield=tech==='ENVIRONMENTAL_SHIELD';
    add(part('FOUNDATION','CYLINDER','DARK',0,0,2.35,.12,2.35));
    add(part('PRESSURIZED_DOME','DOME','DOME',0,0,shield?2.22:1.7,shield?1.35:1.1,shield?2.22:1.7));
    add(part('MAIN_MODULE','BOX','HULL',0,0,1.18,.48,1.18));
    addMedium(part('PRESSURIZED_DOME','DOME','DOME',0,0,shield?2.2:1.9,1.08,shield?2.2:1.9));
    // Small sealed auxiliaries and circulation links. No external unsealed
    // population, free-standing farming, or terraform progress is inferred.
    const airlocks=major?4:2;
    for(let j=0;j<airlocks;j++){
      const a=2*Math.PI*j/airlocks + .55;
      const x=2.45*Math.cos(a),z=2.45*Math.sin(a);
      add(part('ACCESS','BOX','DARK',x,z,.9,.55,.88,a));
      add(part('ACCESS','BOX','ACCENT',x,z,.54,.09,.54,a,.55));
      add(connector(centre,{x,z},.23));
    }
  }

  const auxCount=major?4:intermediate?3:2;
  for(let j=0;j<auxCount;j++){
    const a=2*Math.PI*(j+.25)/auxCount + 1.1;
    const radius=tech==='SUBSURFACE_VAULT'?3.2:3.25;
    const r=radius*(.91+.14*noise(seed,j+70));
    const x=Math.cos(a)*r,z=Math.sin(a)*r;
    add(part('FOUNDATION','CYLINDER','DARK',x,z,.98,.12,.98));
    add(part('AUXILIARY','BOX','HULL',x,z,.90,.65+.16*noise(seed,j+87),.79,a));
    add(part('AUXILIARY','BOX','PANEL',x,z,.65,.11,.62,a,.75));
    add(connector(centre,{x,z}));
    if(j===0) addMedium(part('AUXILIARY','BOX','HULL',x,z,.99,.65,.88,a));
  }
  const mastCount=major?2:1;
  for(let j=0;j<mastCount;j++){
    const x=(j===0?-2.4:2.5),z=(j===0?-2.4:2.25);
    add(part('FOUNDATION','CYLINDER','DARK',x,z,.58,.12,.58));
    add(part('ANTENNA','MAST','HULL',x,z,.48,2.9+.4*noise(seed,j+99),.48));
    add(part('ANTENNA','CYLINDER','ACCENT',x,z,.5,.16,.5,0,2.9));
  }
  if(tech==='SUBSURFACE_VAULT') {
    // Mechanical service vents are visualization, NOT a claim that the
    // pressure/atmospheric model supplies breathable air.
    for(let j=0;j<2;j++) {
      const x=(j===0?1.65:-1.6),z=(j===0?1.6:-1.55);
      add(part('VENT','CYLINDER','PANEL',x,z,.35,.74,.35));
    }
  }
  return Object.freeze({revision:VIDA38_COLONIAL_COMPLEX_REVISION_386C,
    siteId:plan.id,seedUint32:seed,habitatTechnology:tech,visualScaleMultiplier,
    medium:Object.freeze(medium),high:Object.freeze(high)});
}
