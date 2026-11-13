import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  VIDA38_SPECIES_VISUAL_REVISION,
  type Vida38SpeciesVisualContract,
} from './vida38-species-visual-contract';
import {
  deriveVida38ReptileMorphology38J,
} from './vida38-reptile-morphology-38-2j';
import {
  VIDA38_REPTILE_MESH_REVISION,
  type Vida38ReptileRawMeshV1,
} from './vida38-reptile-organic-field-38-2j';
import {
  createVida38ReptileSkin38J,
  VIDA38_REPTILE_MATERIAL_REVISION,
} from './vida38-reptile-materials-38-2j';

function specimen(): Vida38SpeciesVisualContract {
  return {
    revision: VIDA38_SPECIES_VISUAL_REVISION,
    speciesId: 'vida6:reptile:visibility-regression',
    speciesName: 'Reptil de regresión',
    variantSeedUint32: 0x6215af12,
    appearanceFingerprint: 'reptile-visibility',
    provenance: {
      status: 'CONFIRMED_SYSTEM_CT0',
      representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION',
      observedImageAvailable: false,
      bodyStorageKey: 'V3:reptile-test',
      ecosystemDigest: 'reptile-test',
    },
    morphology: { group: 'REPTILES', bodyPlan: 'TETRAPOD', covering: 'SCALES', appendagePairs: 2 },
    ecology: { habitat: 'SURFACE_OPEN_TERRAIN', niche: 'SURFACE_OPEN_TERRAIN/PREDATOR', nutrition: 'PREDATOR' },
    locomotion: 'WALKING',
    bodyLengthMeters: 1.73,
    pigmentation: {
      primaryColorHex: '#827e61', secondaryColorHex: '#3c7853',
      pattern: 'BANDS', bioluminescent: false,
    },
    adaptations: ['RESOURCE_FORAGING'],
    intelligence: null,
  };
}

/** Solo necesitamos un triángulo válido para comprobar el material sin
 * generar miles de triángulos SDF por cada ejecución de la regresión. */
function minimalGeometry(c: Vida38SpeciesVisualContract): Vida38ReptileRawMeshV1 {
  const morphology = deriveVida38ReptileMorphology38J(c);
  return {
    revision: VIDA38_REPTILE_MESH_REVISION,
    morphology, quality: 'LOW',
    positions: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    normals: new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1]),
    uvs: new Float32Array([0, 0, 1, 0, 0, 1]),
    indices: new Uint32Array([0, 1, 2]),
    bounds: { min: [0, 0, 0], max: [1, 1, 0] },
  };
}

/** Las redeclaraciones de variables en un mismo ámbito GLSL impiden compilar
 * el programa, pero el material de sombras puede seguir proyectando la malla. */
function assertNoDuplicateLocalDeclarations(shader: string): void {
  const main = shader.slice(shader.indexOf('void main()'));
  expect(main).toContain('void main()');
  const source = main.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const lexicalScopes: Array<Set<string>> = [new Set()];
  const tokens = source.match(/\{|\}|\b(?:float|vec2|vec3|vec4|int|bool)\s+[A-Za-z_]\w*\s*(?==|;|,)/g) ?? [];
  for (const token of tokens) {
    if (token === '{') { lexicalScopes.push(new Set()); continue; }
    if (token === '}') { expect(lexicalScopes.length).toBeGreaterThan(1); lexicalScopes.pop(); continue; }
    const name = /\b(?:float|vec2|vec3|vec4|int|bool)\s+([A-Za-z_]\w*)/.exec(token)?.[1];
    if (!name) continue;
    const local = lexicalScopes[lexicalScopes.length - 1]!;
    expect(local.has(name), `Variable GLSL redeclarada en el mismo ámbito: ${name}`).toBe(false);
    local.add(name);
  }
  expect(lexicalScopes).toHaveLength(1);
}

describe('GENESIS 38.2j.a — visibilidad del cuerpo reptiliano', () => {
  it('mantiene el cuerpo opaco, coloreable y preparado para sombras', () => {
    const c = specimen();
    const skin = createVida38ReptileSkin38J(minimalGeometry(c), c);
    const material = skin.material as THREE.MeshPhysicalMaterial;
    expect(material.transparent).toBe(false);
    expect(material.opacity).toBe(1);
    expect(material.alphaTest).toBe(0);
    expect(material.alphaMap).toBeNull();
    expect(material.depthWrite).toBe(true);
    expect(material.depthTest).toBe(true);
    expect(material.colorWrite).toBe(true);
    expect(material.side).toBe(THREE.FrontSide);
    expect(skin.castShadow).toBe(true);
    expect(skin.visible).toBe(true);
    expect(VIDA38_REPTILE_MATERIAL_REVISION).toContain('38.2j.a');
    skin.geometry.dispose();
    material.dispose();
  });

  it('si faltan chunks de Three conserva un PBR opaco sin GLSL parcial', () => {
    const c = specimen();
    const skin = createVida38ReptileSkin38J(minimalGeometry(c), c);
    const material = skin.material as THREE.MeshPhysicalMaterial;
    const fragmentShader = '#include <common>\nvoid main(){gl_FragColor=vec4(1.0);}';
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <common>\nvoid main(){\n#include <begin_vertex>\n}',
      fragmentShader,
    };
    material.onBeforeCompile(shader as Parameters<typeof material.onBeforeCompile>[0], {} as Parameters<typeof material.onBeforeCompile>[1]);
    expect(shader.fragmentShader).toBe(fragmentShader);
    expect(Object.keys(shader.uniforms)).toHaveLength(0);
    expect(material.color.getHexString()).toBe('827e61');
    expect(material.transparent).toBe(false);
    skin.geometry.dispose();
    material.dispose();
  });

  it('evita la redeclaración de p, n y dorsal al combinar color y rugosidad', () => {
    const c = specimen();
    const skin = createVida38ReptileSkin38J(minimalGeometry(c), c);
    const material = skin.material as THREE.MeshPhysicalMaterial;
    const shader = {
      uniforms: {} as Record<string, unknown>,
      vertexShader: '#include <common>\nvoid main(){\n#include <begin_vertex>\n}',
      fragmentShader: '#include <common>\nvoid main(){\n#include <color_fragment>\n#include <roughnessmap_fragment>\n}',
    };
    material.onBeforeCompile(shader as Parameters<typeof material.onBeforeCompile>[0], {} as Parameters<typeof material.onBeforeCompile>[1]);
    expect(shader.fragmentShader).toContain('diffuseColor.rgb*=bio');
    expect(shader.fragmentShader).toContain('roughnessFactor=clamp');
    expect(shader.fragmentShader).toContain('vida38ReptileScaleMask');
    expect(shader.fragmentShader).toContain('fwidth');
    expect(shader.fragmentShader).not.toContain('discard');
    expect(shader.fragmentShader).not.toContain('gl_FragCoord');
    expect(shader.fragmentShader.match(/\bvec3 p\s*=/g)).toHaveLength(2);
    expect(shader.fragmentShader.match(/\bvec3 n\s*=/g)).toHaveLength(2);
    expect(shader.fragmentShader.match(/\bfloat dorsal\s*=/g)).toHaveLength(2);
    assertNoDuplicateLocalDeclarations(shader.fragmentShader);
    expect(shader.uniforms['uVida38ReptilePrimary']).toBeDefined();
    expect(shader.uniforms['uVida38ReptileSecondary']).toBeDefined();
    skin.geometry.dispose();
    material.dispose();
  });
});
