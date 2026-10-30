import * as THREE from 'three';

/** Purely visual engineering detail. Never changes orbital motion, VIDA or saved data. */
export interface OrbitalMaterialBindingV5 {
  readonly material: THREE.MeshBasicMaterial | THREE.MeshStandardMaterial;
  readonly baseColor: THREE.Color;
  readonly role: 'body' | 'panel' | 'accent' | 'truss' | 'window';
}

type ResourceV5 = { dispose(): void };
type RoleV5 = OrbitalMaterialBindingV5['role'];
export type OrbitalConstructionKindV5 = 'SATELLITE' | 'INDUSTRIAL' | 'HABITAT' | 'PLATFORM';

/** Metal is shaded by the lights already installed in both Three.js scenes. */
export function createOrbitalMetalMaterialV5(color: THREE.Color): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.56,
    roughness: 0.38,
    transparent: false,
    opacity: 1,
    side: THREE.FrontSide,
    toneMapped: true,
    emissive: new THREE.Color(0x0c131c),
    emissiveIntensity: 0.05,
  });
}

/** Small deterministic data textures: brushed plating / photovoltaic cells / cabin glazing. */
export function createOrbitalEngineeringTextureV5(
  seed: number,
  kind: 'HULL' | 'SOLAR' | 'GLAZING',
): THREE.DataTexture {
  const width = 64;
  const height = 64;
  const pixels = new Uint8Array(width * height * 4);
  const salt = kind === 'HULL' ? 0x15e9 : kind === 'SOLAR' ? 0x27ab : 0x39cf;
  const offset = mix(seed ^ salt) % 7;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const jitter = mix(seed ^ Math.imul(x + 1, 137) ^ Math.imul(y + 1, 199) ^ salt) % 13;
      let red = 225;
      let green = 229;
      let blue = 235;

      if (kind === 'HULL') {
        const seam = (x + offset) % 16 === 0 || (y + offset) % 16 === 0;
        const rivet = ((x + offset) % 16 === 2 && (y + offset) % 16 === 2);
        const grain = 1 + ((x * 3 + jitter) % 7);
        const brightness = seam ? 112 : rivet ? 155 : 219 + grain;
        red = brightness;
        green = brightness + 2;
        blue = brightness + 5;
      } else if (kind === 'SOLAR') {
        const cellEdge = (x + offset) % 12 <= 1 || (y + offset) % 14 <= 1;
        const conductor = (x + offset) % 12 === 6 || (y + offset) % 14 === 7;
        red = cellEdge ? 42 : conductor ? 158 : 184 + jitter;
        green = cellEdge ? 63 : conductor ? 178 : 207 + jitter;
        blue = cellEdge ? 93 : conductor ? 198 : 233 + jitter;
      } else {
        const frame = (x + offset) % 16 <= 2 || (y + offset) % 12 <= 2;
        const lit = ((Math.floor((x + offset) / 16) + Math.floor((y + offset) / 12) + seed) % 7) !== 0;
        red = frame ? 54 : lit ? 189 + jitter : 85;
        green = frame ? 72 : lit ? 218 + jitter : 110;
        blue = frame ? 91 : lit ? 245 : 143;
      }
      pixels[index] = Math.min(255, red);
      pixels[index + 1] = Math.min(255, green);
      pixels[index + 2] = Math.min(255, blue);
      pixels[index + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat);
  texture.name = `GENESIS orbital ${kind.toLowerCase()}-${seed >>> 0}`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** Finishing passes are per asset and own their textures; no global GPU cache/leak. */
export function finishOrbitalMaterialsV5(
  bindings: readonly OrbitalMaterialBindingV5[],
  resources: ResourceV5[],
  seed: number,
): void {
  const textures = {
    HULL: createOrbitalEngineeringTextureV5(seed, 'HULL'),
    SOLAR: createOrbitalEngineeringTextureV5(seed, 'SOLAR'),
    GLAZING: createOrbitalEngineeringTextureV5(seed, 'GLAZING'),
  };
  resources.push(textures.HULL, textures.SOLAR, textures.GLAZING);

  for (const binding of bindings) {
    const material = binding.material;
    if (!(material instanceof THREE.MeshStandardMaterial)) continue;
    const role = binding.role;
    material.metalness = role === 'body' ? 0.64 : role === 'truss' ? 0.72 : role === 'panel' ? 0.32 : 0.22;
    material.roughness = role === 'body' ? 0.38 : role === 'truss' ? 0.31 : role === 'panel' ? 0.25 : 0.29;
    material.map = role === 'panel' ? textures.SOLAR : role === 'window' ? textures.GLAZING : textures.HULL;
    material.emissive.copy(binding.baseColor);
    material.emissiveIntensity = role === 'window' ? 0.12 : role === 'accent' ? 0.08 : 0.015;
    material.needsUpdate = true;
  }
}

class DetailBuilderV5 {
  private readonly materialPool = new Map<string, THREE.MeshStandardMaterial>();

  constructor(
    private readonly group: THREE.Group,
    private readonly bindings: OrbitalMaterialBindingV5[],
    private readonly resources: ResourceV5[],
  ) {}

  material(hex: string, role: RoleV5): THREE.MeshStandardMaterial {
    const key = `${hex}|${role}`;
    const existing = this.materialPool.get(key);
    if (existing) return existing;
    const color = new THREE.Color(hex);
    const material = createOrbitalMetalMaterialV5(color);
    this.materialPool.set(key, material);
    this.resources.push(material);
    this.bindings.push({ material, baseColor: color.clone(), role });
    return material;
  }

  box(
    width: number, height: number, depth: number,
    x: number, y: number, z: number,
    color: string, role: RoleV5,
    rotationY = 0,
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geometry, this.material(color, role));
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
    this.group.add(mesh);
    this.resources.push(geometry);
  }

  cylinder(
    radius: number, length: number,
    x: number, y: number, z: number,
    color: string, role: RoleV5,
  ): void {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 12, 1);
    const mesh = new THREE.Mesh(geometry, this.material(color, role));
    mesh.rotation.z = Math.PI / 2;
    mesh.position.set(x, y, z);
    this.group.add(mesh);
    this.resources.push(geometry);
  }

  /** One GPU draw call for a repeated row of detail boxes. */
  boxesInstanced(
    count: number,
    width: number, height: number, depth: number,
    at: (index: number) => readonly [number, number, number],
    color: string, role: RoleV5,
  ): void {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const batch = new THREE.InstancedMesh(geometry, this.material(color, role), count);
    const object = new THREE.Object3D();
    for (let i = 0; i < count; i += 1) {
      const [x, y, z] = at(i);
      object.position.set(x, y, z);
      object.updateMatrix();
      batch.setMatrixAt(i, object.matrix);
    }
    batch.instanceMatrix.needsUpdate = true;
    this.group.add(batch);
    this.resources.push(geometry);
  }
}

/** Adds engineered silhouette and surface greebles without changing the orbital position. */
export function addOrbitalEngineeringDetailV5(
  group: THREE.Group,
  bindings: OrbitalMaterialBindingV5[],
  resources: ResourceV5[],
  kind: OrbitalConstructionKindV5,
  size: number,
  seed: number,
): void {
  const d = new DetailBuilderV5(group, bindings, resources);
  const silver = '#98a9b7';
  const titanium = '#a9b4c0';
  const dark = '#3d5163';
  const graphite = '#596879';
  const blue = '#496d96';
  const copper = '#9c8567';
  const led = '#b2d7ed';

  if (kind === 'SATELLITE') {
    // Rectilinear miniature equipment: solar-panel frame rails, bus plates,
    // mechanical hinges, compact sensor mast. No spherical or transparent parts.
    const scale = size;
    d.box(scale * 0.62, scale * 0.095, scale * 0.065, 0, scale * 0.23, 0, silver, 'body');
    d.box(scale * 0.44, scale * 0.08, scale * 0.06, 0, -scale * 0.25, 0, dark, 'truss');
    for (const side of [-1, 1]) {
      const x = side * scale * 1.19;
      d.box(scale * 1.08, scale * 0.045, scale * 0.13, x, scale * 0.14, 0, titanium, 'truss');
      d.box(scale * 1.08, scale * 0.045, scale * 0.13, x, -scale * 0.14, 0, titanium, 'truss');
      d.box(scale * 0.085, scale * 0.12, scale * 0.08, side * scale * 0.57, 0, 0, graphite, 'truss');
    }
    d.box(scale * 0.06, scale * 0.64, scale * 0.055, 0, scale * 0.59, 0, silver, 'truss');
    d.box(scale * 0.25, scale * 0.085, scale * 0.14, 0, scale * 0.91, 0, led, 'accent');
    d.box(scale * 0.18, scale * 0.13, scale * 0.11, 0, 0, scale * 0.27, copper, 'accent');
  } else if (kind === 'INDUSTRIAL') {
    const length = size * (3.0 + 0.25 * (mix(seed + 17) / 4294967295));
    for (const y of [-1, 1]) {
      for (const z of [-1, 1]) {
        d.box(length, size * 0.065, size * 0.065, 0, y * size * 0.27, z * size * 0.24, dark, 'truss');
      }
    }
    d.box(length * 0.6, size * 0.08, size * 0.10, 0, size * 0.48, 0, silver, 'truss');
    d.box(length * 0.6, size * 0.08, size * 0.10, 0, -size * 0.48, 0, silver, 'truss');
    d.boxesInstanced(9, size * 0.05, size * 0.52, size * 0.10,
      i => [(i - 4) * length / 10.2, 0, size * 0.30], titanium, 'truss');
    d.boxesInstanced(8, size * 0.18, size * 0.10, size * 0.08,
      i => [(i - 3.5) * length / 8.5, size * 0.31, size * 0.12], copper, 'accent');
    for (const side of [-1, 1]) {
      d.cylinder(size * 0.29, size * 0.20, side * length * 0.53, 0, 0, titanium, 'body');
      d.cylinder(size * 0.20, size * 0.22, side * length * 0.55, 0, 0, dark, 'truss');
      d.box(size * 0.34, size * 0.08, size * 0.48, side * length * 0.24, size * 0.55, 0, blue, 'panel');
    }
    d.box(size * 0.07, size * 0.91, size * 0.06, 0, size * 0.77, 0, silver, 'truss');
    d.box(size * 0.32, size * 0.09, size * 0.10, 0, size * 1.15, 0, led, 'accent');
  } else if (kind === 'HABITAT') {
    const span = size * 2.45;
    for (const side of [-1, 1]) {
      const x = side * span * 0.39;
      d.cylinder(size * 0.34, size * 0.72, x, 0, 0, titanium, 'body');
      d.cylinder(size * 0.38, size * 0.085, x + side * size * 0.38, 0, 0, dark, 'truss');
      for (const y of [-1, 1]) {
        d.box(size * 0.74, size * 0.055, size * 0.06, x, y * size * 0.36, 0, graphite, 'truss');
      }
      d.boxesInstanced(6, size * 0.065, size * 0.16, size * 0.055,
        i => [x + (i - 2.5) * size * 0.12, size * 0.04, size * 0.345], led, 'window');
    }
    d.box(span, size * 0.095, size * 0.095, 0, size * 0.28, size * 0.26, silver, 'truss');
    d.box(span, size * 0.095, size * 0.095, 0, -size * 0.28, -size * 0.26, silver, 'truss');
    d.boxesInstanced(5, size * 0.085, size * 0.46, size * 0.09,
      i => [(i - 2) * span / 6.0, 0, -size * 0.40], blue, 'panel');
    d.box(size * 0.065, size * 0.66, size * 0.065, 0, size * 0.74, 0, silver, 'truss');
    d.box(size * 0.31, size * 0.11, size * 0.21, 0, size * 1.04, 0, led, 'window');
  } else {
    // Platform: distinct docking pads, hangar bay panel seams and edge rails;
    // its top is no longer a huge featureless beige rectangle.
    const length = size * 3.70;
    const breadth = size * 1.65;
    for (const z of [-1, 1]) {
      d.box(length * 0.96, size * 0.09, size * 0.10, 0, size * 0.15, z * breadth * 0.48, graphite, 'truss');
      d.boxesInstanced(7, size * 0.06, size * 0.25, size * 0.07,
        i => [(i - 3) * length * 0.92 / 7, size * 0.21, z * breadth * 0.48], silver, 'truss');
    }
    d.boxesInstanced(4, size * 0.63, size * 0.024, size * 0.66,
      i => [(i - 1.5) * length / 4.75, size * 0.16, 0], dark, 'body');
    d.boxesInstanced(4, size * 0.48, size * 0.018, size * 0.035,
      i => [(i - 1.5) * length / 4.75, size * 0.19, size * 0.18], silver, 'truss');
    d.boxesInstanced(9, size * 0.085, size * 0.12, size * 0.09,
      i => [(i - 4) * length / 10, size * 0.20, -breadth * 0.33], copper, 'accent');
    for (const side of [-1, 1]) {
      d.box(size * 0.13, size * 0.78, size * 0.15, side * length * 0.35, size * 0.54, -size * 0.44, silver, 'truss');
      d.box(size * 0.52, size * 0.12, size * 0.24, side * length * 0.35, size * 0.89, -size * 0.44, led, 'window');
      d.box(size * 0.82, size * 0.09, size * 0.21, side * length * 0.23, -size * 0.22, 0, blue, 'panel');
    }
  }
}

/** Ring detail is instanced inside a nested group to preserve the two legacy
 * direct InstancedMesh children used by the VISCIV.4 orbital visual contract. */
export function addOrbitalRingEngineeringDetailV5(
  rotor: THREE.Group,
  bindings: OrbitalMaterialBindingV5[],
  resources: ResourceV5[],
  radius: number,
  thickness: number,
  seed: number,
): void {
  const details = new THREE.Group();
  details.name = 'Orbital ring railings and intersegment braces VISCIV5';
  rotor.add(details);
  const d = new DetailBuilderV5(details, bindings, resources);
  const segments = 96;
  const length = 2 * Math.PI * radius / segments;
  const temp = new THREE.Object3D();
  const railGeometry = new THREE.BoxGeometry(thickness * 0.38, thickness * 0.38, length * 0.92);
  const railBatch = new THREE.InstancedMesh(railGeometry, d.material('#8397a8', 'truss'), segments * 2);
  for (let i = 0; i < segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    for (let side = -1; side <= 1; side += 2) {
      temp.position.set((radius + side * thickness * 1.6) * Math.cos(angle), side * thickness * 0.6, (radius + side * thickness * 1.6) * Math.sin(angle));
      temp.rotation.set(0, -angle, 0);
      temp.updateMatrix();
      railBatch.setMatrixAt(i * 2 + (side === 1 ? 1 : 0), temp.matrix);
    }
  }
  railBatch.instanceMatrix.needsUpdate = true;
  details.add(railBatch);
  resources.push(railGeometry);

  const braceGeometry = new THREE.BoxGeometry(thickness * 3.1, thickness * 0.27, thickness * 0.36);
  const braces = new THREE.InstancedMesh(braceGeometry, d.material('#b4c4cf', 'body'), segments / 2);
  for (let i = 0; i < segments / 2; i += 1) {
    const angle = ((i * 2) / segments) * Math.PI * 2;
    temp.position.set(radius * Math.cos(angle), 0, radius * Math.sin(angle));
    temp.rotation.set(0, -angle, 0);
    temp.updateMatrix();
    braces.setMatrixAt(i, temp.matrix);
  }
  braces.instanceMatrix.needsUpdate = true;
  details.add(braces);
  resources.push(braceGeometry);
  void seed;
}

function mix(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
}
