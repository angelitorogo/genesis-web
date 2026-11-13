/** GENESIS 38.2s3 — caché de miniaturas de laboratorio reptiliano ADVANCED.
 * Nunca comparte mallas ni recursos WebGL con el visor científico.
 * Mantiene las tres vistas por identidad CT-0 y permite reutilizarlas
 * cuando el usuario cambia entre secciones del Laboratorio de Civilizaciones.
 */
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';

export const VIDA38_ADVANCED_REPTILIAN_THUMB_REVISION_38S3 = 'VIDA.38.2s8/advanced-reptilian-gallery-diverse-wardrobe-cache/v5' as const;
export const VIDA38_ADVANCED_REPTILIAN_THUMB_QUALITY_38S3 = 'LOW' as const;
export const VIDA38_ADVANCED_REPTILIAN_THUMB_CACHE_LIMIT_38S3 = 48 as const;

export type Vida38AdvancedReptilianThumbView38S3 = 'FRONT' | 'SIDE' | 'BACK';
export type Vida38AdvancedReptilianThumbs38S3 = Readonly<Record<Vida38AdvancedReptilianThumbView38S3, string>>;

// La caché dura solamente durante la sesión de ejecución de la aplicación.
// Se almacenan imágenes pequeñas, nunca geometrías ni materiales GPU.
const imagesByIdentity = new Map<string, Vida38AdvancedReptilianThumbs38S3>();

function cacheKey(contract: Vida38SpeciesVisualContract): string {
  return [
    VIDA38_ADVANCED_REPTILIAN_THUMB_REVISION_38S3,
    contract.speciesId, contract.appearanceFingerprint,
    contract.variantSeedUint32,
    contract.pigmentation.primaryColorHex,
    contract.pigmentation.secondaryColorHex,
    contract.pigmentation.pattern,
    contract.intelligence?.lineage ?? '',
    contract.intelligence?.civilizationTier ?? '',
  ].join('|');
}

export function getVida38AdvancedReptilianThumbnails38S3(
  contract: Vida38SpeciesVisualContract,
): Vida38AdvancedReptilianThumbs38S3 | null {
  return imagesByIdentity.get(cacheKey(contract)) ?? null;
}

export function storeVida38AdvancedReptilianThumbnails38S3(
  contract: Vida38SpeciesVisualContract,
  images: Readonly<Partial<Record<Vida38AdvancedReptilianThumbView38S3, string>>>,
): void {
  if (!images.FRONT || !images.SIDE || !images.BACK) return;
  const key = cacheKey(contract);
  // Reinsertar al final para expulsar antes los elementos menos recientes.
  imagesByIdentity.delete(key);
  while (imagesByIdentity.size >= VIDA38_ADVANCED_REPTILIAN_THUMB_CACHE_LIMIT_38S3) {
    const oldest = imagesByIdentity.keys().next().value;
    if (oldest === undefined) break;
    imagesByIdentity.delete(oldest);
  }
  imagesByIdentity.set(key, Object.freeze({ FRONT: images.FRONT, SIDE: images.SIDE, BACK: images.BACK }));
}
