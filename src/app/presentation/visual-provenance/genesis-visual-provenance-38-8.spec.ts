import { describe, expect, it } from 'vitest';
import type { SystemSceneBodySnapshot, SystemSceneMoonSnapshot } from '../system/system-scene-snapshot';
import type { ScientificAsteroidPreviewVisual } from '../scientific/scientific-body-preview';
import type { Vida38SpeciesVisualContract } from '../life-species-visual/vida38-species-visual-contract';
import type { Vida7Civilization } from '../../domain/life/vida7-intelligence-civilizations';
import type { Vida38InfrastructurePlan386 } from '../infrastructure/vida38-infrastructure-plan-38-6';

// Integración tipada: un cambio posterior de esquemas canónicos debe detectarse
// en CI, sin acoplar los renderizadores ni alterar su comportamiento en runtime.
const verifiedKeys388 = {
  star: ['sourceRadiusSolar', 'sourceEffectiveTemperatureKelvin', 'sourceLuminositySolar'] as const satisfies readonly (keyof SystemSceneBodySnapshot)[],
  planet: ['surfaceEnvironment', 'giantAtmosphere', 'spin'] as const satisfies readonly (keyof SystemSceneBodySnapshot)[],
  moon: ['hostPlanetId', 'visualPresentation', 'motionContributions'] as const satisfies readonly (keyof SystemSceneMoonSnapshot)[],
  asteroid: ['diameterKilometers', 'visualVariantUint32', 'presentationIrregularity01'] as const satisfies readonly (keyof ScientificAsteroidPreviewVisual)[],
  species: ['speciesId', 'morphology', 'bodyLengthMeters', 'appearanceFingerprint'] as const satisfies readonly (keyof Vida38SpeciesVisualContract)[],
  civilization: ['founderSpeciesId', 'lineage', 'tier', 'culture', 'technology'] as const satisfies readonly (keyof Vida7Civilization)[],
  infrastructure: ['id', 'bodyStorageKey', 'provenance', 'seedUint32'] as const satisfies readonly (keyof Vida38InfrastructurePlan386)[],
};
import {
  GENESIS_VISUAL_FIELDS_388,
  GENESIS_VISUAL_PROVENANCE_REVISION_388,
  genesisVisualPresentationHasNoCanonicalOverride388,
  genesisVisualSceneTrace388,
  genesisVisualTrace388,
  type GenesisVisualSubjectKind388,
} from './genesis-visual-provenance-38-8';

const allKinds: readonly GenesisVisualSubjectKind388[] = [
  'STAR', 'PLANET', 'MOON', 'ASTEROID', 'COMET',
  'TRANS_NEPTUNIAN_OBJECT', 'CAPTURED_EXTRASOLAR_OBJECT',
  'SPECIES', 'CIVILIZATION', 'COLONIAL_INFRASTRUCTURE',
];

describe('GENESIS 38.8 — traceabilidad procedural sin nuevos permisos', () => {
  it('cubre todas las familias con fuentes, proyecciones y detalles disjuntos', () => {
    expect(verifiedKeys388.civilization).toContain('tier');
    expect(verifiedKeys388.planet).toContain('surfaceEnvironment');
    expect(Object.keys(GENESIS_VISUAL_FIELDS_388).sort()).toEqual([...allKinds].sort());
    for (const kind of allKinds) {
      const family = GENESIS_VISUAL_FIELDS_388[kind];
      expect(Object.isFrozen(family)).toBe(true);
      expect(family.canonicalInputs.length).toBeGreaterThan(0);
      expect(family.presentationOutputs.length).toBeGreaterThan(0);
      expect(family.rendererDetails.length).toBeGreaterThan(0);
      const fields = [
        ...family.canonicalInputs,
        ...family.presentationOutputs,
        ...family.rendererDetails,
      ];
      expect(new Set(fields).size).toBe(fields.length);
      expect(Object.isFrozen(family.canonicalInputs)).toBe(true);
    }
  });

  it('preserva identidad, determinismo y metadatos sin generar hechos científicos', () => {
    const first = genesisVisualTrace388('PLANET', 'galaxy/sector/body:3', 4120);
    const again = genesisVisualTrace388('PLANET', 'galaxy/sector/body:3', 4120);
    expect(first).toEqual(again);
    expect(first.revision).toBe(GENESIS_VISUAL_PROVENANCE_REVISION_388);
    expect(first.generation).toBe('CODE_PROCEDURAL');
    expect(first.appearanceKey).toBe('4120');
    expect(first.knowledgePolicy).toBe('INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION');
    expect(Object.isFrozen(first)).toBe(true);
    expect(first).not.toHaveProperty('scientificImage');
    expect(first).not.toHaveProperty('discoveryState');
    expect(first).not.toHaveProperty('civilizationTier');
  });

  it('no eleva campos de presentación sobre los del dominio', () => {
    const domain = Object.freeze({ radiusEarth: 1, rotationDays: 0.5 });
    const projection = Object.freeze({ radiusScene: 2.4, terrainMicrodetail: 0.21 });
    expect(genesisVisualPresentationHasNoCanonicalOverride388(domain, projection)).toBe(true);
    expect(genesisVisualPresentationHasNoCanonicalOverride388(domain, { radiusEarth: 100 })).toBe(false);
    expect(domain).toEqual({ radiusEarth: 1, rotationDays: 0.5 });
  });

  it('no transforma las civilizaciones en observaciones ni exige nuevas confirmaciones', () => {
    for (const tier of ['PRIMITIVE', 'ADVANCED', 'VERY_ADVANCED'] as const) {
      // El tier llega del contrato VIDA autorizado, jamás se deduce por trazabilidad.
      const authorizedContract = { intelligence: { civilizationTier: tier }, speciesId: 'native:1' };
      const visual = genesisVisualTrace388('CIVILIZATION', authorizedContract.speciesId);
      expect(authorizedContract.intelligence.civilizationTier).toBe(tier);
      expect(visual.knowledgePolicy).toBe('INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION');
      expect(visual.provenance.canonicalAuthority).toBe('VIDA7_CIVILIZATIONS');
    }
    expect(genesisVisualTrace388('COLONIAL_INFRASTRUCTURE', 'colonial:1')
      .provenance.canonicalAuthority).toBe('VIDA8_COLONIZATION');
  });

  it('etiqueta SystemScene sin convertirlo en fotografía ni registrar datos privados', () => {
    const scene = genesisVisualSceneTrace388('seed|v3|system');
    expect(scene.representation).toBe('CODE_PROCEDURAL_SCIENTIFIC_SCENE');
    expect(scene.supportedKinds).toContain('PLANET');
    expect(scene.supportedKinds).toContain('MOON');
    expect(scene).not.toHaveProperty('confirmed');
    expect(scene).not.toHaveProperty('observedImageAvailable');
    expect(Object.isFrozen(scene.supportedKinds)).toBe(true);
  });
});
