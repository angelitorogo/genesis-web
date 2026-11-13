/**
 * GENESIS 38.4a — comprobación funcional de la fábrica 3D.
 * No modifica renderers, bases de datos ni estado del universo.
 * La procedencia de la semilla se audita en el mapper VIDA→visual (38.4a1).
 */
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38SpeciesPreviewModelV1 } from './vida38-species-visual-preview-scene';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { buildVida38PrimitiveReptilianGallery38U } from './vida38-primitive-reptilian-fixtures-38-2u';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { buildVida38AdvancedInsectoidGallery38T } from './vida38-advanced-insectoid-fixtures-38-2t';
import { buildVida38PrimitiveInsectoidGallery38V } from './vida38-primitive-insectoid-fixtures-38-2v';
import { buildVida38HumanoidGallery38R } from './vida38-civilized-humanoid-fixtures-38-2r';
import { buildVida38AdvancedHumanoidGallery38W } from './vida38-advanced-humanoid-fixtures-38-2w';
import { buildVida38PrimitiveHumanoidGallery38X } from './vida38-primitive-humanoid-fixtures-38-2x';

const FAMILIAS = [
  ['reptiliano muy avanzado', buildVida38ReptilianGallery38OE5],
  ['reptiliano avanzado', buildVida38AdvancedReptilianGallery38S],
  ['reptiliano primitivo', buildVida38PrimitiveReptilianGallery38U],
  ['insectoide muy avanzado', buildVida38InsectoidGallery38Q],
  ['insectoide avanzado', buildVida38AdvancedInsectoidGallery38T],
  ['insectoide primitivo', buildVida38PrimitiveInsectoidGallery38V],
  ['humanoide muy avanzado', buildVida38HumanoidGallery38R],
  ['humanoide avanzado', buildVida38AdvancedHumanoidGallery38W],
  ['humanoide primitivo', buildVida38PrimitiveHumanoidGallery38X],
] as const;

/** FNV-1a doble. Se procesan todos los bytes de cada atributo/index, no solo muestras. */
class Digest {
  private a = 2166136261 >>> 0;
  private b = 0x811c9dc5 >>> 0;
  text(s: string): void {
    for (let i = 0; i < s.length; i++) {
      const c = s.charCodeAt(i);
      this.byte(c & 255); this.byte(c >>> 8);
    }
  }
  byte(n: number): void {
    this.a = Math.imul(this.a ^ (n & 255), 16777619) >>> 0;
    this.b = Math.imul(this.b ^ (n & 255), 2246822519) >>> 0;
  }
  buffer(a: ArrayBufferView): void {
    const v = new Uint8Array(a.buffer, a.byteOffset, a.byteLength);
    this.text(`${a.constructor.name}:${a.byteLength};`);
    for (let i = 0; i < v.length; i++) this.byte(v[i]!);
  }
  finish(): string { return `${this.a.toString(16).padStart(8,'0')}${this.b.toString(16).padStart(8,'0')}`; }
}

function colorId(c: THREE.Color | undefined): string { return c ? c.getHexString() : ''; }
function materialFingerprint(m: THREE.Material, d: Digest): void {
  const material = m as THREE.MeshStandardMaterial;
  // Nunca incluir UUID ni id: son contadores globales, no propiedades visuales.
  d.text(JSON.stringify({type:m.type,side:m.side,transparent:m.transparent,opacity:m.opacity,
    depthWrite:m.depthWrite,visible:m.visible,wireframe:'wireframe' in m ? (m as THREE.MeshBasicMaterial).wireframe : null,
    color:colorId(material.color),emissive:colorId(material.emissive),
    emissiveIntensity:material.emissiveIntensity??null,roughness:material.roughness??null,
    metalness:material.metalness??null}));
  for (const k of ['map','normalMap','bumpMap','alphaMap','emissiveMap'] as const) {
    const tex = material[k] as THREE.Texture | null | undefined;
    if (!tex) continue;
    d.text(k);d.text(JSON.stringify({type:tex.type,wrapS:tex.wrapS,wrapT:tex.wrapT,rotation:tex.rotation,
      repeat:[tex.repeat.x,tex.repeat.y],offset:[tex.offset.x,tex.offset.y]}));
    const source=tex.image as {data?:ArrayBufferView;width?:number;height?:number}|undefined;
    if (source) {
      d.text(`${source.width??0}x${source.height??0}`);
      if (source.data && ArrayBuffer.isView(source.data)) d.buffer(source.data);
    }
  }
}

/** Huella de escena, jerarquía, transformaciones, atributos, índices, colores y materiales. */
function fingerprint(contract: Vida38SpeciesVisualContract): {digest:string;meshes:number;vertices:number} {
  const model=createVida38SpeciesPreviewModelV1(contract,{humanoidQuality:'LOW'});
  const digest=new Digest();let meshes=0,vertices=0;
  try {
    model.root.traverse((o:THREE.Object3D)=>{
      digest.text(JSON.stringify({name:o.name,type:o.type,visible:o.visible,
        position:o.position.toArray(),rotation:o.rotation.toArray().slice(0,3),scale:o.scale.toArray()}));
      if (!(o instanceof THREE.Mesh)) return;
      meshes++;
      const g=o.geometry as THREE.BufferGeometry;
      const attrs=Object.keys(g.attributes).sort();
      for(const key of attrs){
        const attr=g.getAttribute(key);
        digest.text(`${key}:${attr.itemSize}:${attr.count}:${attr.normalized}`);
        if(ArrayBuffer.isView(attr.array))digest.buffer(attr.array);
      }
      const idx=g.getIndex();
      if(idx&&ArrayBuffer.isView(idx.array)){digest.text('indices');digest.buffer(idx.array);}
      vertices+=g.getAttribute('position')?.count??0;
      const mats=Array.isArray(o.material)?o.material:[o.material];
      for(const m of mats) if(m)materialFingerprint(m,digest);
    });
    return {digest:digest.finish(),meshes,vertices};
  } finally {model.dispose();}
}

function jsonRoundTrip<T>(value:T):T { return JSON.parse(JSON.stringify(value)) as T; }

// La semilla forma parte explícita del contrato. Alterarla artificialmente no simula
// un cambio de ubicación. Su procedencia productiva se audita por separado en 38.4a1.
describe('38.4a — certificación funcional (no implica backup IndexedDB)',()=>{
  for(const [name,build] of FAMILIAS){
    it(`dos reconstrucciones reales son idénticas: ${name}`,()=>{
      const c=build(12)[0]!.contract;
      const first=fingerprint(c);
      const second=fingerprint(c);
      expect(first.meshes,`${name}: falta malla`).toBeGreaterThan(0);
      expect(first.vertices,`${name}: faltan vértices`).toBeGreaterThan(0);
      expect(second,`${name}: diferencia de geometría/materiales`).toEqual(first);
    },120_000);
  }

  it('la serialización JSON del contrato conserva la escena (NO equivale a backup de BD)',()=>{
    for(const [name,build] of [FAMILIAS[0]!,FAMILIAS[4]!,FAMILIAS[7]!]){
      const contract=build(12)[0]!.contract;
      expect(fingerprint(jsonRoundTrip(contract)),name).toEqual(fingerprint(contract));
    }
  },120_000);

  it('metadatos espaciales de presentación no alteran la escena ni los rasgos VIDA',()=>{
    for(const [name,build] of [FAMILIAS[1]!,FAMILIAS[5]!,FAMILIAS[8]!]){
      const c=build(12)[0]!.contract;
      const elsewhere={...c,viewOnlyLocation:'SISTEMA_REMOTO',planetLabel:'PLANETA_B'};
      expect(fingerprint(elsewhere),name).toEqual(fingerprint(c));
    }
  },120_000);

  it('el renderer respeta una semilla explícita y permanece determinista tras cambiarla',()=>{
    // No es una certificación de procedencia: esa garantía pertenece al mapper real.
    // Un contrato con otra semilla es otro contrato de entrada, no otra ubicación.
    for(const [name,build] of [FAMILIAS[0]!,FAMILIAS[4]!,FAMILIAS[7]!]){
      const c=build(12)[0]!.contract;
      const changed={...c,variantSeedUint32:(c.variantSeedUint32+1)>>>0};
      const a=fingerprint(changed);
      expect(a.meshes,`${name}: modelo alternativo sin mallas`).toBeGreaterThan(0);
      expect(a,`${name}: la misma semilla debe ser estable`).toEqual(fingerprint(changed));
      expect(fingerprint(c),`${name}: la semilla original debe ser estable`).toEqual(fingerprint(c));
    }
  },120_000);
});
