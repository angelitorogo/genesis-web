import { describe, expect, it } from 'vitest';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import {
  VIDA38_ADVANCED_REPTILIAN_THUMB_CACHE_LIMIT_38S3,
  VIDA38_ADVANCED_REPTILIAN_THUMB_QUALITY_38S3,
  getVida38AdvancedReptilianThumbnails38S3,
  storeVida38AdvancedReptilianThumbnails38S3,
} from './vida38-advanced-reptilian-thumbnails-38-2s3';

describe('38.2s3 — optimización de galería reptiliana avanzada', () => {
  const entries = buildVida38AdvancedReptilianGallery38S(12);
  const photos = {
    FRONT: 'data:image/png;base64,front-38s3',
    SIDE: 'data:image/png;base64,side-38s3',
    BACK: 'data:image/png;base64,back-38s3',
  };

  it('usa LOW para miniaturas sin exigir esa calidad al visor principal', () => {
    expect(VIDA38_ADVANCED_REPTILIAN_THUMB_QUALITY_38S3).toBe('LOW');
    expect(entries).toHaveLength(12);
  });

  it('solo memoriza ejemplares con las tres vistas completas', () => {
    const contract = { ...entries[0]!.contract, speciesId: 'LAB-38S3-CACHE-COMPLETE' };
    expect(getVida38AdvancedReptilianThumbnails38S3(contract)).toBeNull();
    storeVida38AdvancedReptilianThumbnails38S3(contract, { FRONT: photos.FRONT });
    expect(getVida38AdvancedReptilianThumbnails38S3(contract)).toBeNull();
    storeVida38AdvancedReptilianThumbnails38S3(contract, photos);
    expect(getVida38AdvancedReptilianThumbnails38S3(contract)).toEqual(photos);
  });

  it('evita mezclar miniaturas de identidades y apariencias diferentes', () => {
    const base = { ...entries[1]!.contract, speciesId: 'LAB-38S3-CACHE-IDENTITY' };
    const fingerprint = { ...base, appearanceFingerprint: base.appearanceFingerprint + '/otra-variacion' };
    const seed = { ...base, variantSeedUint32: (base.variantSeedUint32 + 17) >>> 0 };
    storeVida38AdvancedReptilianThumbnails38S3(base, photos);
    expect(getVida38AdvancedReptilianThumbnails38S3(base)).toEqual(photos);
    expect(getVida38AdvancedReptilianThumbnails38S3(fingerprint)).toBeNull();
    expect(getVida38AdvancedReptilianThumbnails38S3(seed)).toBeNull();
  });

  it('mantiene las instantáneas inmutables y una caché acotada', () => {
    const base = { ...entries[2]!.contract, speciesId: 'LAB-38S3-CACHE-IMMUTABLE' };
    const mutable = { ...photos };
    storeVida38AdvancedReptilianThumbnails38S3(base, mutable);
    mutable.FRONT = 'other-front';
    const cached = getVida38AdvancedReptilianThumbnails38S3(base);
    expect(cached?.FRONT).toBe(photos.FRONT);
    expect(Object.isFrozen(cached)).toBe(true);
    expect(VIDA38_ADVANCED_REPTILIAN_THUMB_CACHE_LIMIT_38S3).toBeLessThanOrEqual(48);
  });
});
