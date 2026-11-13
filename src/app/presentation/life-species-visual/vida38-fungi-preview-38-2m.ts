import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38FungalMorphology38M, type Vida38FungalMorphology38M,
  type Vida38FungalForm38M, type Vida38FungalTexture38M,
  Vida38FungalRandom38M,
} from './vida38-fungi-morphology-38-2m';

export type Vida38FungalQuality38M = 'LOW' | 'MEDIUM' | 'HIGH';
interface Sample38M { p: THREE.Vector3; tone?: number; }
type Sampler38M = (u: number, v: number) => Sample38M;
interface Context38M {
  readonly root: THREE.Group;
  readonly morphology: Vida38FungalMorphology38M;
  readonly rng: Vida38FungalRandom38M;
  readonly quality: Vida38FungalQuality38M;
  readonly colors: readonly [THREE.Color, THREE.Color, THREE.Color, THREE.Color];
  readonly materials: Map<string, THREE.MeshPhysicalMaterial>;
  readonly segments: number;
  readonly maxObjects: number;
  objects: number;
}
const PI2 = Math.PI * 2;
const BASE = -0.65;
const clamp = THREE.MathUtils.clamp;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function palette38M(contract: Vida38SpeciesVisualContract): Context38M['colors'] {
  const native1 = new THREE.Color(contract.pigmentation.primaryColorHex);
  const native2 = new THREE.Color(contract.pigmentation.secondaryColorHex);
  const warm = new THREE.Color('#d4c5a6');
  const dark = new THREE.Color('#53443e');
  return [
    native1.clone().lerp(warm, 0.13),
    native2.clone().lerp(warm, 0.17),
    native1.clone().lerp(dark, 0.33),
    native2.clone().lerp(warm, 0.35),
  ];
}
function material38M(ctx: Context38M, name: string): THREE.MeshPhysicalMaterial {
  const style = ctx.morphology.texture;
  const key = `${name}:${style}`;
  const cached = ctx.materials.get(key);
  if (cached) return cached;
  const wet = style === 'WET' || style === 'GELATINOUS';
  const roughnessByTexture: Record<Vida38FungalTexture38M, number> = {
    FLESHY: .74, FIBROUS: .92, LEATHERY: .77, POROUS: .91,
    VELVETY: .95, WET: .39, GELATINOUS: .26, DRY: .89,
  };
  const translucent = ctx.morphology.form === 'GELATINOUS' && name === 'gel';
  const m = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, vertexColors: true,
    roughness: roughnessByTexture[style], metalness: 0,
    clearcoat: wet ? .36 : .025,
    clearcoatRoughness: wet ? .27 : .85,
    transmission: translucent ? .12 : 0,
    transparent: translucent,
    opacity: translucent ? .87 : 1,
    depthWrite: !translucent,
    thickness: translucent ? .19 : 0,
    side: THREE.DoubleSide,
  });
  ctx.materials.set(key, m);
  return m;
}
function paletteColor38M(ctx: Context38M, tone: number, phase: number): THREE.Color {
  const t = clamp(tone, 0, 1);
  const c = ctx.colors[0].clone().lerp(ctx.colors[1], t * .77);
  c.lerp(ctx.colors[2], Math.max(0, .24 - t) * .56);
  c.lerp(ctx.colors[3], Math.max(0, t - .77) * .43);
  const micro = .965 + .055 * Math.sin(phase * 13.9) * Math.sin(phase * 8.4 + 1.1);
  return c.multiplyScalar(micro);
}
/** Malla única con vértices coloreados y normales suaves. No texturas, ni objetos decorativos sueltos. */
function surface38M(
  ctx: Context38M, label: string, nu: number, nv: number,
  sample: Sampler38M, kind = 'body', closedU = false,
): THREE.Mesh {
  const pos: number[] = [], cols: number[] = [], idx: number[] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    for (let i = 0; i <= nu; i++) {
      const u = i / nu;
      const s = sample(u, v);
      pos.push(s.p.x, s.p.y, s.p.z);
      const c = paletteColor38M(ctx, s.tone ?? .52, u * 3.17 + v * 1.91);
      cols.push(c.r, c.g, c.b);
      if (i < nu && j < nv) {
        const a = j * (nu + 1) + i, b = a + nu + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  }
  // Mallas abiertas son válidas (copas, láminas, himenios), sin inventar tapas esféricas.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  geometry.setIndex(idx);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material38M(ctx, kind));
  mesh.name = `VIDA38_2M_FUNGAL_${ctx.morphology.form}_${label}`;
  mesh.castShadow = kind !== 'gel';
  mesh.userData['closedCircumference38M'] = closedU;
  mesh.receiveShadow = true;
  ctx.root.add(mesh);
  ctx.objects++;
  return mesh;
}
function tube38M(
  ctx: Context38M, label: string, points: readonly THREE.Vector3[],
  startRadius: number, tipRadius: number, kind = 'body',
  profile = .55,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3([...points]);
  const nu = ctx.quality === 'LOW' ? 7 : 10;
  const nv = ctx.quality === 'HIGH' ? 16 : ctx.quality === 'MEDIUM' ? 11 : 8;
  const sample: Sampler38M = (u, v) => {
    const tangent = curve.getTangentAt(v).normalize();
    const axis = new THREE.Vector3(0, 0, 1);
    if (Math.abs(tangent.dot(axis)) > .94) axis.set(1, 0, 0);
    const a = new THREE.Vector3().crossVectors(tangent, axis).normalize();
    const b = new THREE.Vector3().crossVectors(tangent, a).normalize();
    const theta = u * PI2;
    const taper = mix(startRadius, tipRadius, v);
    const w = (1 + .072 * Math.sin(5 * theta + 2 * v) + .025 * Math.sin(11 * theta + 13 * v));
    const r = Math.max(.002, taper * w);
    const p = curve.getPointAt(v).addScaledVector(a, Math.cos(theta) * r).addScaledVector(b, Math.sin(theta) * r);
    return { p, tone: profile + .12 * Math.sin(theta * 4 + 11 * v) + .05 * v };
  };
  return surface38M(ctx, label, nu, nv, sample, kind, true);
}
function stem38M(ctx: Context38M, index: number, origin: THREE.Vector3, height: number, baseRadius: number, lean: number): THREE.Vector3 {
  const apex = origin.clone().add(V(lean * .56, height, lean * .25));
  const curvePoints = [origin, origin.clone().add(V(lean * .16, height * .33, 0)),
    origin.clone().add(V(lean * .4, height * .72, lean * .1)), apex];
  tube38M(ctx, `STEM_${index}`, curvePoints, baseRadius, baseRadius * .62, 'stalk', .35);
  return apex;
}
function radialCap38M(ctx: Context38M, tag: string, x: number, y: number, z: number,
  radius: number, depth: number, shape: number, variation: number): void {
  const profile = (angle: number, t: number) => {
    const ripple = 1 + ctx.morphology.edgeIrregularity * (.48 * Math.sin(5 * angle + variation) + .26 * Math.sin(9 * angle - variation));
    return radius * t * ripple;
  };
  const nu = ctx.segments, nv = Math.round(ctx.segments * .35);
  surface38M(ctx, `${tag}_CAP`, nu, nv, (u, v) => {
    const a = u * PI2, t = Math.max(.003, v), r = profile(a, t);
    const dome = shape === 0 ? Math.pow(1 - t, .58) : shape === 1 ? Math.pow(1 - t * t, 2.5)
      : shape === 2 ? .64 * Math.pow(1 - t, 1.3) + .36 * t : shape === 3 ? .65 * Math.sin(Math.PI * t) - .24 * (1 - t)
      : Math.pow(1 - t, .28);
    const edgeFlute = .024 * radius * Math.cos(a * 13 + variation) * t ** 5;
    const H = y + depth * dome + edgeFlute;
    return {p: V(x + r * Math.cos(a), H, z + r * Math.sin(a)),tone: .51 + .24 * (1 - t) + .06 * Math.sin(a * 5 + variation)};
  }, 'body', true);
  // Placa inferior y láminas radiales (agaricoide) o poros (boletoide).
  if (tag.includes('BOLETE')) {
    surface38M(ctx, `${tag}_PORES`, nu, 5, (u, v) => {
      const a = u * PI2, r = radius * (.03 + .91 * v);
      return {p: V(x + r * Math.cos(a), y - .035 + .022 * (1-v), z + r * Math.sin(a)),tone: .18 + .2 * Math.sin(u * 73) ** 2};
    }, 'pores', true);
  } else {
    const rays = ctx.quality === 'LOW' ? 13 : ctx.quality === 'MEDIUM' ? 22 : 31;
    const pos: number[] = [], cols: number[] = [], indices: number[] = [];
    for (let ray = 0; ray < rays; ray++) {
      const theta = ray * PI2 / rays + variation;
      for (let k = 0; k <= 7; k++) {
        const t = .11 + k / 7 * .83;
        const r = radius * t;
        const q = .048 * Math.sin(Math.PI * t);
        for (let side = -1; side <= 1; side += 2) {
          pos.push(x + r * Math.cos(theta + q * side), y - .019 - .028 * Math.sin(Math.PI * t) - (side > 0 ? .055 : 0), z + r * Math.sin(theta + q * side));
          const c = paletteColor38M(ctx, .18 + t * .17, t + ray / rays);
          cols.push(c.r, c.g, c.b);
        }
        if (k < 7) {
          const ix = ray * 16 + k * 2;
          indices.push(ix, ix+2, ix+1, ix+1, ix+2, ix+3);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    g.setIndex(indices); g.computeVertexNormals();
    const mesh = new THREE.Mesh(g, material38M(ctx, 'gills'));
    mesh.name = `VIDA38_2M_FUNGAL_${ctx.morphology.form}_${tag}_RADIAL_GILLS`;
    mesh.castShadow = true;
    ctx.root.add(mesh); ctx.objects++;
  }
}

function agaricoid38M(ctx: Context38M, robust: boolean): void {
  const rng = ctx.rng, m = ctx.morphology;
  const total = robust ? (ctx.quality === 'LOW' ? 1 : 2) : ctx.quality === 'LOW' ? 2 : Math.round(2 + m.density * 2);
  for (let i = 0; i < total; i++) {
    const angle = i * 2.3999 + rng.range(-.3, .3);
    const dist = i === 0 ? 0 : Math.sqrt(i / total) * (robust ? .3 : .59);
    const base = V(Math.cos(angle) * dist, BASE, Math.sin(angle) * dist);
    const height = (robust ? rng.range(.67, 1.15) : rng.range(.62, 1.22)) * m.heightFactor * (i === 0 ? 1 : rng.range(.77, 1.1));
    const rStem = (robust ? .19 : .052) * m.widthFactor * rng.range(.8, 1.18);
    const apex = stem38M(ctx, i, base, height, rStem, rng.range(-m.curvature, m.curvature));
    const radius = (robust ? rng.range(.35, .49) : rng.range(.28, .46)) * m.widthFactor * (total > 3 ? .84 : 1);
    radialCap38M(ctx, robust ? `BOLETE_${i}` : `AGARIC_${i}`, apex.x, apex.y - .035, apex.z,
      radius, (robust ? .22 : .15) * m.heightFactor, robust ? 1 : m.variation, rng.range(-2, 2));
    if (i === 0 && m.variation % 2 === 0 && !robust) {
      // Velo parcial: anillo irregular unido al tercio superior del pie.
      surface38M(ctx, `ANNULUS_${i}`, 22, 4, (u, v) => {
        const a = u * PI2, r = rStem * (1.03 + v * 1.15);
        return {p: V(apex.x + r * Math.cos(a), apex.y - .19 - v * .09, apex.z + r * Math.sin(a)), tone: .38};
      }, 'veil', true);
    }
  }
}
function fan38M(ctx: Context38M, tag: string, pivot: THREE.Vector3, radius: number,
  yaw: number, width: number, tilt: number, layer: number): void {
  const nu = ctx.quality === 'HIGH' ? 28 : ctx.quality === 'MEDIUM' ? 18 : 12;
  const nv = ctx.quality === 'LOW' ? 6 : 10;
  const addLayer = (underside: boolean) => surface38M(ctx, `${tag}_${underside ? 'FERTILE_UNDERSIDE' : 'UPPER_LAMINA'}`,
    nu, nv, (u,v) => {
      const theta = (u * 2 - 1) * width;
      const rim = 1 + .065 * Math.sin(theta * 11 + layer * 1.7) + .039 * Math.sin(theta * 19 + layer);
      const r = radius * (v * rim + .01);
      const az = theta + yaw;
      const x = pivot.x + Math.cos(az) * r;
      const z = pivot.z + Math.sin(az) * r;
      const fold = Math.sin(Math.PI * v) * Math.cos(theta * 4 + layer) * .058 * radius;
      const y = pivot.y + tilt * r + fold + Math.pow(v, 4) * .04 * Math.sin(theta * 14 + layer)
        - (underside ? .025 + .028 * (1-v) : 0);
      return {p: V(x,y,z), tone: underside ? .17 + .06 * Math.sin(theta * 22) ** 2 : .37 + .4 * v + .08 * Math.sin(12 * v + theta * 6)};
    }, underside ? 'pores' : 'body');
  addLayer(false); addLayer(true);
}
function bracket38M(ctx: Context38M): void {
  const m = ctx.morphology, rng = ctx.rng;
  const height = 1.13 * m.heightFactor;
  // Columna de fijación fúngica coriácea: las repisas nacen sobre ella, no flotan.
  tube38M(ctx, 'LATERAL_ATTACHMENT', [V(0, BASE, 0), V(.015, BASE + height * .35, 0),
    V(-.035, BASE + height * .74, 0), V(0, BASE + height, 0)], .15, .055, 'stalk', .29);
  const count = ctx.quality === 'LOW' ? 3 : Math.round(4 + m.density * 3);
  for (let i=0; i<count; i++) {
    const y = BASE + .17 + (height - .3) * i / Math.max(count - 1, 1);
    const az = i * 2.3999 + (m.variation % 2) * .5;
    const r = rng.range(.39, .7) * m.widthFactor;
    fan38M(ctx, `BRACKET_${i}`, V(Math.cos(az) * .045, y, Math.sin(az) * .045), r, az,
      rng.range(.73, 1.15), rng.range(-.14, .08), i);
  }
}
function coral38M(ctx: Context38M): void {
  const rng = ctx.rng, m = ctx.morphology;
  const depth = ctx.quality === 'LOW' ? 3 : ctx.quality === 'MEDIUM' ? 4 : 5;
  const origins = ctx.quality === 'LOW' ? 2 : 3;
  let serial = 0;
  function branch(at: THREE.Vector3, direction: THREE.Vector3, length: number, radius: number, level: number): void {
    if (ctx.objects >= ctx.maxObjects) return;
    const tip = at.clone().addScaledVector(direction, length);
    const mid = at.clone().lerp(tip, .52).add(V(rng.range(-.045, .045), rng.range(-.018, .05), rng.range(-.045, .045)));
    tube38M(ctx, `CORAL_RAMUS_${serial++}`, [at, mid, tip], radius, Math.max(.009, radius * .69), 'coral', .48 + .07 * level);
    if (level >= depth || radius < .014) return;
    const forks = level < 2 ? 3 : 2;
    for (let i = 0; i < forks; i++) {
      const a = PI2 * (i + rng.range(-.14, .14)) / forks + level * 1.13;
      const childDir = direction.clone().multiplyScalar(.72)
        .add(V(Math.cos(a) * rng.range(.28, .62), rng.range(.28, .62), Math.sin(a) * rng.range(.28, .62))).normalize();
      branch(tip, childDir, length * rng.range(.58, .78), radius * rng.range(.58, .74), level + 1);
      if (ctx.objects >= ctx.maxObjects) break;
    }
  }
  for (let i = 0; i < origins; i++) {
    const a = i * PI2 / origins;
    branch(V(Math.sin(a) * .16, BASE, Math.cos(a) * .16), V(Math.sin(a) * .13, 1, Math.cos(a) * .13).normalize(),
      (.36 + rng.range(0,.13)) * m.heightFactor, .073 * m.widthFactor, 0);
  }
}
function bulb38M(ctx: Context38M, tag: string, center: THREE.Vector3, radius: number,
  tallness: number, pore: boolean, materialKind = 'body'): void {
  const nu = ctx.quality === 'HIGH' ? 32 : ctx.quality === 'MEDIUM' ? 23 : 15;
  const nv = Math.round(nu * .65);
  const phase = ctx.rng.range(0, PI2);
  surface38M(ctx, tag, nu, nv, (u, v) => {
    const a = PI2 * u, theta = Math.PI * (.002 + .996 * v);
    const noise = .94 + .057 * Math.sin(a * 5 + phase) * Math.sin(theta * 4) + .035 * Math.sin(a * 9 - theta * 5);
    const s = Math.sin(theta) * noise;
    const x = center.x + radius * s * Math.cos(a);
    const z = center.z + radius * s * Math.sin(a);
    const y = center.y + radius * tallness * Math.cos(theta);
    return {p: V(x, y, z), tone: .48 + .22 * Math.sin(a * 4 + theta * 3 + phase) + .09 * Math.cos(theta * 8)};
  }, materialKind, true);
  if (pore) {
    const apicalY = center.y + radius * tallness;
    surface38M(ctx, `${tag}_APICAL_PORE_RIM`, 25, 4, (u, v) => {
      const a = PI2 * u, r = radius * (.075 + .06 * v);
      return {p: V(center.x + r * Math.cos(a), apicalY - .018 - .012 * v + .006 * Math.sin(7 * a), center.z + r * Math.sin(a)), tone: .12 + .16 * v};
    }, 'pores', true);
  }
}
function gasteroid38M(ctx: Context38M): void {
  const rng = ctx.rng, m = ctx.morphology;
  const count = ctx.quality === 'LOW' ? 2 : Math.round(3 + m.density * 3);
  for(let i=0;i<count;i++) {
    const a = i * 2.3999, distance = i === 0 ? 0 : .23 + .11 * Math.sqrt(i);
    const r = rng.range(.2, .35) * m.widthFactor * (i === 0 ? 1.3 : 1);
    const h = rng.range(.73, 1.35) * m.heightFactor;
    const pos = V(Math.cos(a) * distance, BASE + r * h * .83, Math.sin(a) * distance);
    bulb38M(ctx, `GASTER_${i}_SPOROCARP`, pos, r, h, m.variation % 3 !== 1);
    if(m.variation % 3 === 2 && i % 2 === 0) {
      tube38M(ctx, `GASTER_${i}_NECK`, [V(pos.x, BASE, pos.z), V(pos.x, pos.y - r * .45, pos.z), V(pos.x, pos.y, pos.z)], r*.33, r*.47, 'stalk', .43);
    }
  }
}
function cup38M(ctx: Context38M): void {
  const rng = ctx.rng, m=ctx.morphology;
  const count = ctx.quality==='LOW' ? 2 : Math.round(3 + m.density * 2);
  for(let i=0;i<count;i++) {
    const angle = i * 2.3999, dist = i===0 ? 0 : .26 + i*.075;
    const x = Math.cos(angle)*dist, z = Math.sin(angle)*dist;
    const height = rng.range(.27,.65)*m.heightFactor, r=rng.range(.24,.43)*m.widthFactor;
    stem38M(ctx,i,V(x,BASE,z),height,.05,rng.range(-.09,.09));
    const atY = BASE + height - .08;
    const flare = m.variation % 2 === 0 ? .86 : 1.22;
    const bowlSurface = (inner:boolean) => surface38M(ctx,`CUP_${i}_${inner?'INNER_HYMENIUM':'OUTER_WALL'}`,
      ctx.segments,ctx.quality==='LOW'?9:15,(u,v)=>{
        const a=u*PI2, r0=r*(.09 + Math.pow(v,.73) * flare);
        const ripple = 1 + (m.edgeIrregularity*.52)*Math.sin(5*a+i) * v**4 + .04 * Math.sin(11*a+i)*v**6;
        const rr=r0*ripple;
        const y=atY + r * (.26*v + .7*v*v) + .03*r*Math.sin(7*a+i)*v**4 - (inner?.011:0);
        return {p:V(x+Math.cos(a)*rr,y,z+Math.sin(a)*rr),tone:inner?.81 - .23*v:.25 + .22*v};
      },inner?'fertile':'body',true);
    bowlSurface(false); bowlSurface(true);
  }
}
function gelatinous38M(ctx: Context38M): void {
  const m=ctx.morphology, rng=ctx.rng;
  const count=ctx.quality==='LOW'?4:ctx.quality==='MEDIUM'?7:11;
  // Pliegues interpenetrados anclados en el sustrato: ni esferas ni parasoles.
  for(let i=0;i<count;i++) {
    const direction=i*PI2/count + rng.range(-.19,.19);
    const size=rng.range(.36,.69)*m.widthFactor;
    const offset=V(Math.cos(direction)*.12,BASE + .02,Math.sin(direction)*.12);
    const twist=rng.range(-1.2,1.2);
    surface38M(ctx,`GEL_FOLDED_LOBE_${i}`,ctx.quality==='HIGH'?30:19,ctx.quality==='LOW'?8:13,(u,v)=>{
      const a=(u-.5)*2.2 + direction + twist*v*.23;
      const width=size * v * (.8 + .13*Math.sin(a*9+i)) * (1+.12*Math.sin(u*17+i)*v**3);
      const height=size * (Math.sin(v*Math.PI*.65)+v*.36)*m.heightFactor;
      const x=offset.x + Math.cos(a)*width;
      const z=offset.z + Math.sin(a)*width;
      const y=BASE + .02 + height + .06 * Math.sin(7*a + 2*v + i) * v**3;
      return {p:V(x,y,z),tone:.38 + .26*v + .12*Math.sin(u*8+v*5)};
    },'gel');
  }
  bulb38M(ctx,'GEL_CORE_ADHERENT',V(0,BASE+.12,0),.22,.57,false,'gel');
}
function rosette38M(ctx: Context38M): void {
  const rng=ctx.rng,m=ctx.morphology;
  const layers=ctx.quality==='LOW'?2:ctx.quality==='MEDIUM'?3:4;
  for(let level=0;level<layers;level++) {
    const petals=Math.round(5+level*2+m.density*2);
    for(let i=0;i<petals;i++) {
      const az=PI2*i/petals + level*.38 + rng.range(-.065,.065);
      const r=(.19 + level*.14)*m.widthFactor*rng.range(.85,1.12);
      fan38M(ctx,`ROSETTE_${level}_${i}`,V(0,BASE+.04+level*.063,0),r,az,
        .37 + m.edgeIrregularity*.6, .22 + level*.08,i+level*19);
    }
  }
}

/** Único punto de integración con 38.2. No altera VIDA ni la generación de especies. */
export function createVida38FungalPreview38M(
  subject: THREE.Group,
  contract: Vida38SpeciesVisualContract,
  quality: Vida38FungalQuality38M = 'HIGH',
): Vida38FungalMorphology38M {
  const m = deriveVida38FungalMorphology38M(contract);
  const root = new THREE.Group();
  root.name = `VIDA38_2M_FUNGAL_${m.form}_ARCHITECTURE`;
  subject.add(root);
  const ctx: Context38M = {
    root,morphology:m,quality,colors:palette38M(contract),
    rng:new Vida38FungalRandom38M(m.seed),materials:new Map(),objects:0,
    segments:quality==='HIGH'?36:quality==='MEDIUM'?24:15,
    maxObjects:quality==='HIGH'?230:quality==='MEDIUM'?145:90,
  };
  switch(m.form as Vida38FungalForm38M) {
    case 'AGARICOID': agaricoid38M(ctx,false);break;
    case 'BOLETOID': agaricoid38M(ctx,true);break;
    case 'BRACKET': bracket38M(ctx);break;
    case 'CORAL': coral38M(ctx);break;
    case 'GASTEROID': gasteroid38M(ctx);break;
    case 'CUP': cup38M(ctx);break;
    case 'GELATINOUS': gelatinous38M(ctx);break;
    case 'ROSETTE': rosette38M(ctx);break;
  }
  subject.userData['fungalMorphotype38M'] = m.form;
  subject.userData['fungalSubvariant38M'] = m.variation;
  subject.userData['fungalSourceLengthMeters38M'] = m.sourceLengthMeters;
  subject.userData['fungalReconstructionStatus38M'] = m.provenance;
  subject.userData['fungalObjectCount38M'] = ctx.objects;
  return m;
}
