import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import {
  deriveVida38MicrobialMorphology38N, Vida38MicrobialRandom38N,
  type Vida38MicrobialForm38N, type Vida38MicrobialMorphology38N,
} from './vida38-microbial-morphology-38-2n';

export type Vida38MicrobialQuality38N = 'LOW' | 'MEDIUM' | 'HIGH';
export const VIDA38_MICROBIAL_PREVIEW_REVISION_38N = 'VIDA.38.2n/microbial-preview/v1' as const;
export interface Vida38MicrobialPreview38N {
  readonly revision: typeof VIDA38_MICROBIAL_PREVIEW_REVISION_38N;
  readonly form: Vida38MicrobialForm38N;
  readonly cellBodies: number;
  readonly structuralMeshes: number;
}

type Palette = Readonly<{ wall: THREE.Color; inside: THREE.Color; shade: THREE.Color; contrast: THREE.Color }>;
type MaterialKey = 'WALL' | 'INNER' | 'SHELL' | 'GEL' | 'SILICA' | 'SPORE';

const UP = new THREE.Vector3(0, 1, 0);
const FRONT = new THREE.Vector3(0, 0, 1);
function v(x: number, y: number, z: number): THREE.Vector3 { return new THREE.Vector3(x, y, z); }
function clamp(x: number, lo: number, hi: number): number { return Math.min(hi, Math.max(lo, x)); }

/** Matiz de celda estable por vértice: bandas orgánicas y tono de pared, sin ruido aleatorio de shader. */
function colorize(geometry: THREE.BufferGeometry, palette: Palette, seed: number, contrast = .22): THREE.BufferGeometry {
  const positions = geometry.getAttribute('position') as THREE.BufferAttribute;
  const data = new Float32Array(positions.count * 3);
  const c = new THREE.Color();
  const phase = (seed % 1024) * .01873;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
    const pigment = .45 + .20 * Math.sin(3.3 * x + 2.2 * y + phase)
      + .12 * Math.cos(4.7 * z - 1.3 * x + phase * .53)
      + .08 * Math.sin(12 * x + 9 * z + 1.8 * y + phase);
    const blend = clamp(pigment * (1 - contrast) + contrast * .35, .12, .86);
    c.copy(palette.wall).lerp(palette.inside, blend);
    c.lerp(palette.shade, clamp(.07 + .12 * Math.sin(y * 7 + z * 3 + phase), 0, .2));
    data[3 * i] = c.r; data[3 * i + 1] = c.g; data[3 * i + 2] = c.b;
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(data, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Membranas, mucosidad y sílice: microrelieve en geometría y respuesta PBR sin aspecto plástico. */
function buildMaterials(m: Vida38MicrobialMorphology38N): Record<MaterialKey, THREE.MeshPhysicalMaterial> {
  const material = (roughness: number, clearcoat: number, transmission = 0, opacity = 1): THREE.MeshPhysicalMaterial =>
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff, vertexColors: true, roughness, metalness: 0,
      clearcoat, clearcoatRoughness: .46, transmission,
      thickness: .12, transparent: opacity < 1, opacity, depthWrite: opacity >= 1,
      side: THREE.DoubleSide,
    });
  return {
    WALL: material(m.material === 'WAXY' ? .66 : .78, .10),
    INNER: material(.82, .07),
    SHELL: material(.72, .13),
    GEL: material(.43, .29, 0, .94),
    SILICA: material(.52, .24, .045),
    SPORE: material(.84, .07),
  };
}

interface Context {
  readonly group: THREE.Group;
  readonly m: Vida38MicrobialMorphology38N;
  readonly rng: Vida38MicrobialRandom38N;
  readonly q: Vida38MicrobialQuality38N;
  readonly colors: Palette;
  readonly materials: Record<MaterialKey, THREE.MeshPhysicalMaterial>;
  count: number;
  cells: number;
}

function makeContext(group: THREE.Group, contract: Vida38SpeciesVisualContract, m: Vida38MicrobialMorphology38N, q: Vida38MicrobialQuality38N): Context {
  const primary = new THREE.Color(contract.pigmentation.primaryColorHex);
  const secondary = new THREE.Color(contract.pigmentation.secondaryColorHex);
  return {
    group, m, q, rng: new Vida38MicrobialRandom38N(m.seed),
    colors: {
      wall: primary.clone().lerp(secondary, .09),
      inside: primary.clone().lerp(secondary, .47),
      shade: primary.clone().multiplyScalar(.51),
      contrast: secondary.clone().lerp(new THREE.Color('#e7dfcc'), .11),
    },
    materials: buildMaterials(m), count: 0, cells: 0,
  };
}

function emit(ctx: Context, geometry: THREE.BufferGeometry, label: string, key: MaterialKey = 'WALL', ownColor?: Palette): THREE.Mesh {
  const mesh = new THREE.Mesh(colorize(geometry, ownColor ?? ctx.colors, ctx.m.seed + ctx.count * 137), ctx.materials[key]);
  mesh.name = `VIDA38_2N_${label}`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  ctx.group.add(mesh);
  ctx.count++;
  return mesh;
}
function cell(ctx: Context, label: string, position: THREE.Vector3, size: THREE.Vector3, key: MaterialKey = 'WALL', organic = true): THREE.Mesh {
  const width = ctx.q === 'LOW' ? 15 : ctx.q === 'MEDIUM' ? 23 : 31;
  const height = ctx.q === 'LOW' ? 11 : ctx.q === 'MEDIUM' ? 17 : 23;
  const g = new THREE.SphereGeometry(1, width, height);
  const attr = g.getAttribute('position') as THREE.BufferAttribute;
  if (organic) {
    for (let i = 0; i < attr.count; i++) {
      const x = attr.getX(i), y = attr.getY(i), z = attr.getZ(i);
      const f = 1 + ctx.m.envelopeIrregularity * (
        .46 * Math.sin(5 * y + ctx.m.seed * .004) * Math.cos(4 * x + 2 * z)
        + .38 * Math.sin(7 * x - 3 * z + ctx.m.variation)
      );
      attr.setXYZ(i, x * f, y * f, z * f);
    }
  }
  g.scale(size.x, size.y, size.z);
  const mesh = emit(ctx, g, label, key);
  mesh.position.copy(position);
  return mesh;
}

/** Tubo con sección variable + extremo cerrado: no son líneas flotantes ni cilindros uniformes. */
function tubule(
  ctx: Context, label: string, path: readonly THREE.Vector3[], radius: number,
  kind: 'PLAIN' | 'ROD' | 'SPIRAL' | 'TAPER' = 'PLAIN', key: MaterialKey = 'WALL',
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3([...path]);
  const n = ctx.q === 'LOW' ? 18 : ctx.q === 'MEDIUM' ? 27 : 38;
  const sides = ctx.q === 'LOW' ? 8 : ctx.q === 'MEDIUM' ? 10 : 12;
  const pos: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const at = curve.getPoint(t), tangent = curve.getTangent(t).normalize();
    const baseNormal = new THREE.Vector3().crossVectors(tangent, Math.abs(tangent.dot(UP)) > .94 ? FRONT : UP).normalize();
    const binormal = new THREE.Vector3().crossVectors(tangent, baseNormal).normalize();
    const edge = Math.pow(Math.sin(Math.PI * t), .38);
    const septa = kind === 'ROD' ? 1 - .095 * Math.pow(Math.cos(t * Math.PI * 5), 14) : 1;
    const profile = kind === 'TAPER' ? (.07 + .93 * (1 - t)) : (kind === 'SPIRAL' ? .82 + .18 * edge : .13 + .87 * edge);
    const r = radius * profile * septa;
    for (let j = 0; j < sides; j++) {
      const phi = j / sides * Math.PI * 2;
      const perturb = 1 + ctx.m.envelopeIrregularity * .31 * Math.sin(t * 22 + phi * 3 + ctx.m.variation);
      const p = at.clone().addScaledVector(baseNormal, Math.cos(phi) * r * perturb).addScaledVector(binormal, Math.sin(phi) * r * perturb);
      pos.push(p.x, p.y, p.z);
      if (i < n) {
        const a = i * sides + j, b = i * sides + (j + 1) % sides;
        indices.push(a, a + sides, b, b, a + sides, b + sides);
      }
    }
  }
  // Cierres poligonales para permitir siluetas de célula continua.
  const a = path[0]!, b = path[path.length - 1]!;
  const begin = pos.length / 3;
  pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
  for (let j = 0; j < sides; j++) {
    indices.push(begin, (j + 1) % sides, j);
    indices.push(begin + 1, n * sides + j, n * sides + (j + 1) % sides);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(indices);
  return emit(ctx, g, label, key);
}

/** Lámina cerrada, estratificada, con contorno lobulado y superficie íntegra (no esfera aplastada). */
function membrane(ctx: Context, label: string, radius: number, height: number, folds: number, key: MaterialKey = 'GEL'): THREE.Mesh {
  const sides = ctx.q === 'LOW' ? 48 : ctx.q === 'MEDIUM' ? 70 : 90;
  const rings = ctx.q === 'LOW' ? 8 : 13;
  const verts: number[] = [];
  const faces: number[] = [];
  const variant = ctx.m.variation * .61 + 1.8;
  for (let layer = 0; layer < 2; layer++) {
    for (let r = 0; r <= rings; r++) {
      const t = r / rings;
      for (let s = 0; s < sides; s++) {
        const a = s / sides * Math.PI * 2;
        const undulate = 1 + .12 * Math.sin(folds * a + variant) + .09 * Math.sin((folds + 3) * a + 1.3 * variant);
        const d = radius * t * undulate;
        const y = height + (1 - t * t) * .19 + .045 * Math.sin(4 * a + variant) * t;
        verts.push(d * Math.cos(a), y - (layer ? .12 : 0), d * Math.sin(a));
        if (r < rings) {
          const a0 = layer * (rings + 1) * sides + r * sides + s;
          const b0 = layer * (rings + 1) * sides + r * sides + (s + 1) % sides;
          const c0 = a0 + sides, d0 = b0 + sides;
          if (layer === 0) faces.push(a0, b0, c0, b0, d0, c0);
          else faces.push(a0, c0, b0, b0, c0, d0);
        }
      }
    }
  }
  const under = (rings + 1) * sides;
  for (let s = 0; s < sides; s++) {
    const t = (s + 1) % sides, a = rings * sides + s, b = rings * sides + t;
    faces.push(a, b, under + a, b, under + b, under + a);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(faces);
  return emit(ctx, geo, label, key);
}

function fiber(ctx: Context, from: THREE.Vector3, to: THREE.Vector3, radius: number, name: string, material: MaterialKey = 'INNER'): void {
  const midpoint = from.clone().lerp(to, .5);
  midpoint.y += ctx.rng.range(-.07, .08);
  tubule(ctx, name, [from, midpoint, to], radius, 'TAPER', material);
}
function colonyPlace(ctx: Context, i: number, count: number, scale = 1): THREE.Vector3 {
  const golden = 2.399963229728653;
  const angle = i * golden + ctx.m.variation * .5;
  const radial = Math.sqrt((i + .5) / Math.max(count, 1)) * ctx.m.density;
  return v(Math.cos(angle) * radial * .73 * scale, ctx.rng.range(-.12, .18), Math.sin(angle) * radial * .54 * scale);
}
function underlay(ctx: Context, radius: number, height: number, key: MaterialKey = 'GEL'): void {
  // Sustrato biológico continuo solo en morfotipos que producen tapices; nunca una cápsula de cristal.
  membrane(ctx, 'BIOLOGICAL_SUBSTRATE', radius, height, 5 + (ctx.m.variation % 3), key);
}

function cocci(ctx: Context): void {
  const n = Math.round(10 + ctx.m.colonyCount * (ctx.q === 'LOW' ? 1 : 1.6));
  const chain = ctx.m.organization === 'CHAIN';
  for (let i = 0; i < n; i++) {
    const p = chain ? v((i - (n - 1) / 2) * .105, .035 + .045 * Math.sin(i * .65), .14 * Math.sin(i * .35))
      : colonyPlace(ctx, i, n, .78);
    const r = ctx.rng.range(.105, .19) * ctx.m.slenderness ** .22;
    cell(ctx, 'COCCOID_CELL', p, v(r, r * ctx.rng.range(.85, 1.22), r * ctx.rng.range(.85, 1.15)));
    ctx.cells++;
    if (i % 4 === 0) cell(ctx, 'BUDDING_CELL', p.clone().add(v(r * .82, r * .43, r * .48)), v(r * .38, r * .43, r * .42), 'INNER');
  }
}
function bacilli(ctx: Context): void {
  const n = ctx.q === 'LOW' ? 5 : 9;
  for (let i = 0; i < n; i++) {
    const p = colonyPlace(ctx, i, n, .64);
    const angle = i * 2.4 + ctx.m.variation;
    const dir = v(Math.cos(angle), ctx.rng.range(-.13, .18), Math.sin(angle));
    const r = ctx.rng.range(.11, .18), len = ctx.rng.range(.65, .98) * ctx.m.slenderness;
    const first = p.clone().addScaledVector(dir, -len * .5), last = p.clone().addScaledVector(dir, len * .5);
    tubule(ctx, 'BACILLUS_SEGMENTED_WALL', [first, p.clone().add(v(0, .07, 0)), last], r, 'ROD');
    ctx.cells++;
    if (i % 3 === 0) fiber(ctx, last, last.clone().addScaledVector(dir, .26).add(v(0, .12, 0)), .014, 'POLAR_FLAGELLUM');
  }
}
function spirilla(ctx: Context): void {
  const n = ctx.q === 'LOW' ? 3 : 5;
  for (let k = 0; k < n; k++) {
    const offset = colonyPlace(ctx, k, n, .37);
    const points: THREE.Vector3[] = [];
    const turns = 2 + (ctx.m.variation % 3) * .5;
    const rr = ctx.rng.range(.11, .21);
    for (let i = 0; i <= 30; i++) {
      const t = i / 30, a = turns * Math.PI * 2 * t + k * .8;
      points.push(v(offset.x + rr * Math.cos(a), offset.y + (t - .5) * 1.6,
        offset.z + rr * Math.sin(a)));
    }
    tubule(ctx, 'HELICAL_CELL', points, ctx.rng.range(.064, .095), 'SPIRAL');
    ctx.cells++;
  }
}
function vibrios(ctx: Context): void {
  const n = Math.round((ctx.q === 'LOW' ? 6 : 11) * ctx.m.density);
  for (let i = 0; i < n; i++) {
    const p = colonyPlace(ctx, i, n, .8);
    const rot = i * 2.39996;
    const path: THREE.Vector3[] = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8, bend = .3 * Math.sin(t * Math.PI);
      path.push(p.clone().add(v((t - .5) * .56 * Math.cos(rot) - bend * Math.sin(rot),
        (t - .5) * .30, (t - .5) * .56 * Math.sin(rot) + bend * Math.cos(rot))));
    }
    tubule(ctx, 'VIBRIO_COMMA_BODY', path, ctx.rng.range(.08, .12), 'PLAIN');
    ctx.cells++;
    if (i % 3 === 0) fiber(ctx, path[8]!, path[8]!.clone().add(v(.17, .21, -.14)), .009, 'CURVED_FLAGELLUM');
  }
}
function filaments(ctx: Context): void {
  const trunk: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    trunk.push(v(.1 * Math.sin(t * 5), -.6 + t * 1.35, .04 * Math.cos(t * 8)));
  }
  tubule(ctx, 'FILAMENT_MAIN_TRICHOME', trunk, .1, 'ROD', 'SHELL');
  ctx.cells++;
  const n = ctx.q === 'LOW' ? 7 : 12;
  for (let i = 0; i < n; i++) {
    const t = .18 + .73 * (i + .5) / n;
    const theta = (i * 2.399963 + ctx.m.variation) * .85;
    const start = v(.1 * Math.sin(t * 5), -.6 + t * 1.35, .04 * Math.cos(t * 8));
    const len = ctx.rng.range(.34, .83);
    const tip = start.clone().add(v(Math.cos(theta) * len, len * ctx.rng.range(.22, .65), Math.sin(theta) * len));
    const mid = start.clone().lerp(tip, .47).add(v(0, .09, 0));
    tubule(ctx, 'SEPTATE_BRANCH', [start, mid, tip], ctx.rng.range(.036, .075), 'ROD', 'SHELL');
    ctx.cells++;
    if (i % 3 === 0) {
      fiber(ctx, mid, mid.clone().add(v(.10 * Math.sin(theta), .22, .12 * Math.cos(theta))), .02, 'SECONDARY_BRANCH');
    }
  }
}
function biofilm(ctx: Context): void {
  underlay(ctx, 1.08, -.30, 'GEL');
  const n = ctx.q === 'LOW' ? 13 : 25;
  for (let i = 0; i < n; i++) {
    const p = colonyPlace(ctx, i, n, .83);
    p.y = -.13 + ctx.rng.range(-.035, .045);
    const r = ctx.rng.range(.068, .17);
    const oblate = cell(ctx, 'BIOFILM_MUCOSAL_ISLAND', p, v(r * 1.4, .05 + .6 * r, r * 1.6), 'GEL');
    oblate.rotation.y = ctx.rng.range(-.8, .8);
    ctx.cells++;
  }
}
function cilia(ctx: Context, pos: THREE.Vector3, size: THREE.Vector3, n: number): void {
  const geo = new THREE.ConeGeometry(.012, .21, 5, 1);
  colorize(geo, ctx.colors, ctx.m.seed + 823);
  const mesh = new THREE.InstancedMesh(geo, ctx.materials['INNER'], n);
  mesh.name = 'VIDA38_2N_CILIA_INSTANCED';
  const object = new THREE.Object3D();
  for (let i = 0; i < n; i++) {
    const a = i * 2.3999632, t = 2 * (i + .5) / n - 1;
    const phi = Math.acos(clamp(t, -1, 1));
    const dir = v(Math.sin(phi) * Math.cos(a), Math.cos(phi), Math.sin(phi) * Math.sin(a));
    // La base del cilio se ancla a la superficie elipsoidal y su mitad se proyecta hacia fuera.
    const origin = pos.clone().add(v(dir.x * size.x, dir.y * size.y, dir.z * size.z));
    const normal = v(dir.x / size.x, dir.y / size.y, dir.z / size.z).normalize();
    object.position.copy(origin).addScaledVector(normal, .094);
    object.quaternion.setFromUnitVectors(UP, normal);
    object.scale.setScalar(.8 + .32 * ((i * 7) % 13) / 13);
    object.updateMatrix(); mesh.setMatrixAt(i, object.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  ctx.group.add(mesh);
  ctx.count++;
}
function ciliates(ctx: Context): void {
  const n = ctx.q === 'LOW' ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const pos = v((i - (n - 1) / 2) * .7, .06, i === 0 ? 0 : -.1);
    const size = v(.36, .65, .27);
    cell(ctx, 'CILIATE_TAPERED_BODY', pos, size, 'WALL'); ctx.cells++;
    cilia(ctx, pos, size, ctx.q === 'LOW' ? 50 : ctx.q === 'MEDIUM' ? 90 : 140);
    // Surco oral: pliegue de pared, no ojos ni rasgos de mamífero.
    tubule(ctx, 'ORAL_GROOVE', [pos.clone().add(v(.14, .36, .2)), pos.clone().add(v(.23, .05, .26)), pos.clone().add(v(.12, -.28, .17))], .018, 'PLAIN', 'INNER');
  }
}
function amoebae(ctx: Context): void {
  const n = ctx.q === 'LOW' ? 1 : 2;
  for (let i = 0; i < n; i++) {
    const offset = v((i - (n - 1) / 2) * .75, 0, 0);
    const lobeCount = 4 + ctx.m.variation % 4;
    const body = membrane(ctx, 'AMOEBOID_LOBED_MEMBRANE', .62, -.13, lobeCount, 'GEL');
    body.position.copy(offset);
    ctx.cells++;
    for (let j = 0; j < lobeCount; j++) {
      const angle = j / lobeCount * Math.PI * 2 + ctx.m.variation;
      const base = offset.clone().add(v(.38 * Math.cos(angle), -.08, .38 * Math.sin(angle)));
      const tip = offset.clone().add(v(.78 * Math.cos(angle), -.17, .78 * Math.sin(angle)));
      tubule(ctx, 'PSEUDOPOD', [base, base.clone().lerp(tip, .5).add(v(0, .06, 0)), tip], .14, 'TAPER', 'GEL');
    }
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.4;
      cell(ctx, 'VACUOLAR_INCLUSION', offset.clone().add(v(.22 * Math.cos(angle), .125, .18 * Math.sin(angle))),
        v(.04 + j * .004, .022, .045), 'INNER', false);
    }
  }
}
function diatoms(ctx: Context): void {
  const n = ctx.q === 'LOW' ? 2 : 4;
  for (let i = 0; i < n; i++) {
    const offset = colonyPlace(ctx, i, n, .54);
    const shell = cell(ctx, 'DIATOM_SILICEOUS_FRUSTULE', offset, v(.38, .12, .77), 'SILICA', false);
    shell.rotation.y = i * 1.7;
    ctx.cells++;
    // Costillas transversales paralelas y quilla: ornamentación silícea integrada a las valvas.
    const ribs = ctx.q === 'LOW' ? 8 : 13;
    for (let j = 0; j < ribs; j++) {
      const z = (j / (ribs - 1) * 2 - 1) * .70;
      const half = .38 * Math.sqrt(Math.max(.015, 1 - (z / .77) ** 2));
      const points = [v(-half, .11, z), v(0, .122, z), v(half, .11, z)];
      const g = new THREE.Group();
      // No duplicar decoración en el espacio global: se transforma junto con la valva.
      // La geometría se construye en local y se aplica una transformada conjunta.
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, ctx.q === 'LOW' ? 10 : 16, .009, 5, false);
      colorize(geo, ctx.colors, ctx.m.seed + j * 11);
      const rib = new THREE.Mesh(geo, ctx.materials['SHELL']);
      rib.name = 'VIDA38_2N_FRUSTULE_TRANSVERSE_STRIA';
      rib.position.copy(offset); rib.rotation.y = shell.rotation.y;
      g.add(rib); ctx.group.add(g); ctx.count++;
    }
  }
}
function radiolarians(ctx: Context): void {
  const n = ctx.q === 'LOW' ? 1 : 2;
  for (let k = 0; k < n; k++) {
    const p = v((k - (n - 1) / 2) * 1.15, .1, 0);
    cell(ctx, 'RADIOLARIAN_LATTICED_SHELL', p, v(.4, .4, .4), 'SILICA');
    ctx.cells++;
    const count = ctx.q === 'LOW' ? 24 : ctx.q === 'MEDIUM' ? 36 : 52;
    const geo = new THREE.ConeGeometry(.045, .45, ctx.q === 'LOW' ? 5 : 7);
    colorize(geo, ctx.colors, ctx.m.seed + k * 171);
    const mesh = new THREE.InstancedMesh(geo, ctx.materials['SILICA'], count);
    mesh.name = 'VIDA38_2N_RADIAL_SPICULES';
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = i * 2.399963, yy = 1 - 2 * (i + .5) / count;
      const rr = Math.sqrt(Math.max(0, 1 - yy * yy));
      const dir = v(rr * Math.cos(a), yy, rr * Math.sin(a));
      dummy.position.copy(p).addScaledVector(dir, .40 + .22 * (.8 + (i % 5) / 10));
      dummy.quaternion.setFromUnitVectors(UP, dir);
      dummy.scale.set(.8 + (i % 4) / 8, .7 + (i % 7) / 12, .8 + (i % 4) / 8);
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    ctx.group.add(mesh); ctx.count++;
    // Poros de la envoltura: pequeños puntos anclados, no esferas flotantes.
    const pores = ctx.q === 'LOW' ? 10 : 18;
    for(let j=0; j<pores; j++) {
      const a=j*2.4, t = 1 - (j + .5) * 2/pores, rr=Math.sqrt(1-t*t);
      const dir=v(rr*Math.cos(a),t,rr*Math.sin(a));
      cell(ctx, 'FRUSTULE_PORE_RING', p.clone().addScaledVector(dir,.397), v(.035,.035,.035), 'INNER', false);
    }
  }
}

/** Exige contratos MICROORGANISMS y añade solo la reconstrucción del organismo, nunca atrezzo. */
export function createVida38MicrobialPreview38N(
  subject: THREE.Group, contract: Vida38SpeciesVisualContract, quality: Vida38MicrobialQuality38N = 'HIGH',
): Vida38MicrobialPreview38N {
  const m = deriveVida38MicrobialMorphology38N(contract);
  const architecture = new THREE.Group();
  architecture.name = 'VIDA38_2N_MICROBIAL_ARCHITECTURE';
  const ctx = makeContext(architecture, contract, m, quality);
  switch (m.form) {
    case 'COCCOID_AGGREGATE': cocci(ctx); break;
    case 'BACILLI': bacilli(ctx); break;
    case 'SPIRILLA': spirilla(ctx); break;
    case 'VIBRIOS': vibrios(ctx); break;
    case 'BRANCHING_FILAMENTS': filaments(ctx); break;
    case 'BIOFILM': biofilm(ctx); break;
    case 'CILIATED': ciliates(ctx); break;
    case 'AMOEBOID': amoebae(ctx); break;
    case 'DIATOM': diatoms(ctx); break;
    case 'RADIOLARIAN': radiolarians(ctx); break;
  }
  subject.add(architecture);
  subject.userData['microbialMorphotype38N'] = m.form;
  subject.userData['microbialOrganization38N'] = m.organization;
  subject.userData['microbialSourceLengthMeters'] = m.sourceLengthMeters;
  subject.userData['microbialScientificStatus38N'] = m.provenance;
  subject.userData['microbialMaterial38N'] = m.material;
  return Object.freeze({revision: VIDA38_MICROBIAL_PREVIEW_REVISION_38N, form: m.form, cellBodies: ctx.cells, structuralMeshes: ctx.count});
}
