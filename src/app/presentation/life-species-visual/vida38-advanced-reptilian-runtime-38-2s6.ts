/**
 * GENESIS 38.2s6 — garantía de renderer realmente aplicado a REPTILIAN/ADVANCED.
 * Se ejecuta al final del modelo de escena, no depende de la rama BIPED/QUADRUPED.
 * NO toca los modelos VERY_ADVANCED, INSECTOID ni HUMANOID.
 */
import * as THREE from 'three';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { createVida38AdvancedReptilianPreview38S2, isVida38AdvancedReptilian38S } from './vida38-advanced-reptilian-preview-38-2s2';
import { VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4 } from './vida38-advanced-reptilian-wardrobe-38-2s4';
import { VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7 } from './vida38-advanced-reptilian-visible-wear-38-2s7';
import type { Vida38HumanoidQuality } from './vida38-humanoid-organic-field-38-2e';

export const VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6 = 'VIDA.38.2s7/visible-scene-wardrobe/v1' as const;

export interface Vida38AdvancedReptilianRuntimeDiagnostics38S6 {
  readonly revision: typeof VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6;
  readonly wasRebuilt: boolean;
  readonly garmentCount: number;
  readonly structuralCount: number;
  readonly accessoryCount: number;
  readonly fullBodyCount: number;
  readonly legacyGarmentCount: number;
  readonly structuralBounds: Readonly<{ width: number; height: number; depth: number }>;
}

function isNewPart(o: THREE.Object3D): boolean {
  return o.userData['vida38AdvancedReptilianWardrobe38S4'] === VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4 ||
    o.userData['vida38AdvancedReptilianWear38S7'] === VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7;
}

/** Una comprobación geométrica, no una auditoría de nombres de planes o enums. */
export function inspectVida38AdvancedReptilianActualModel38S6(subject: THREE.Group): Vida38AdvancedReptilianRuntimeDiagnostics38S6 {
  const pieces: THREE.Object3D[] = [];
  subject.traverse(obj => { if (obj !== subject && isNewPart(obj)) pieces.push(obj); });
  const largeParts = pieces.filter(obj => obj.name.includes('360'));
  const accessories = pieces.filter(obj => obj.name.includes('ACCESSORY_'));
  const structural = pieces.filter(obj => obj.name.includes('COAT_360') || obj.name.includes('WORKSUIT_360') ||
    obj.name.includes('JACKET_360') || obj.name.includes('TAIL_AWARE_COAT_SKIRT'));
  const legacyGarmentCount = subject.children.filter(obj => obj.name === 'VIDA38_2OD_REPTILIAN_GARMENT' ||
    obj.userData['garmentPart38OE6'] !== undefined).length;
  const bounds = new THREE.Box3();
  for (const obj of structural) bounds.expandByObject(obj);
  const dims = bounds.isEmpty() ? new THREE.Vector3() : bounds.getSize(new THREE.Vector3());
  return Object.freeze({
    revision: VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6,
    wasRebuilt: false,
    garmentCount: pieces.length,
    structuralCount: structural.length,
    accessoryCount: accessories.length,
    fullBodyCount: largeParts.length,
    legacyGarmentCount,
    structuralBounds: Object.freeze({ width: dims.x, height: dims.y, depth: dims.z }),
  });
}

export function assertVida38AdvancedReptilianActualModel38S6(subject: THREE.Group): Vida38AdvancedReptilianRuntimeDiagnostics38S6 {
  const report = inspectVida38AdvancedReptilianActualModel38S6(subject);
  if (report.garmentCount < 6 || report.structuralCount < 1 || report.accessoryCount < 1 || report.fullBodyCount < 1 ||
      subject.userData['vida38AdvancedReptilianVisibleWear38S7'] !== VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7 ||
      report.legacyGarmentCount > 0 || report.structuralBounds.width < .24 || report.structuralBounds.height < .18 ||
      report.structuralBounds.depth < .14) {
    throw new Error(`38.2s6: vestuario ADVANCED NO visible en el modelo REAL. ` +
      `Mallas=${report.garmentCount}, prendas=${report.structuralCount}, accesorios=${report.accessoryCount}, ` +
      `antiguas=${report.legacyGarmentCount}, medidas=${JSON.stringify(report.structuralBounds)}. ` +
      `No se permite renderizar silenciosamente la camiseta antigua.`);
  }
  return report;
}

function disposeExistingGeometry(subject: THREE.Group): void {
  // La rama antigua ya no se va a representar, por tanto sus recursos se liberan
  // antes de reconstruir. No se reutilizan geometrías/materiales ajenos.
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  subject.traverse(obj => {
    if (!(obj instanceof THREE.Mesh)) return;
    geometries.add(obj.geometry);
    for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) materials.add(material);
  });
  subject.clear();
  geometries.forEach(g => g.dispose());
  materials.forEach(m => m.dispose());
}

/**
 * Postcondición de la escena. Si el selector original ha elegido el renderer
 * heredado, se sustituye; si la ropa 38s4 ya está en la escena, se conserva.
 */
export function enforceVida38AdvancedReptilianVisibleRenderer38S6(
  subject: THREE.Group,
  contract: Vida38SpeciesVisualContract,
  quality: Vida38HumanoidQuality,
): Vida38AdvancedReptilianRuntimeDiagnostics38S6 | null {
  if (!isVida38AdvancedReptilian38S(contract)) return null;
  const alreadyNew = subject.userData['vida38AdvancedReptilianWardrobeRevision38S4'] ===
    VIDA38_ADVANCED_REPTILIAN_WARDROBE_REVISION_38S4 &&
    subject.userData['vida38AdvancedReptilianVisibleWear38S7'] === VIDA38_ADVANCED_REPTILIAN_VISIBLE_WEAR_38S7;
  let wasRebuilt = false;
  if (!alreadyNew || inspectVida38AdvancedReptilianActualModel38S6(subject).legacyGarmentCount > 0) {
    disposeExistingGeometry(subject);
    createVida38AdvancedReptilianPreview38S2(subject, contract, quality);
    wasRebuilt = true;
  }
  const verified = assertVida38AdvancedReptilianActualModel38S6(subject);
  const result: Vida38AdvancedReptilianRuntimeDiagnostics38S6 = Object.freeze({ ...verified, wasRebuilt });
  subject.userData['vida38AdvancedReptilianRuntime38S6'] = VIDA38_ADVANCED_REPTILIAN_RUNTIME_REVISION_38S6;
  subject.userData['vida38AdvancedReptilianDiagnostics38S6'] = result;
  return result;
}
