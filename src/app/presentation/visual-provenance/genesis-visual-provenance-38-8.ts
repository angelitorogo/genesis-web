/**
 * GENESIS 38.8 — trazabilidad documental de los renderizadores procedurales.
 *
 * No es un registro de observaciones ni una puerta de conocimiento. Los datos
 * científicos pertenecen al dominio (o VIDA); los campos de presentación y
 * decisiones gráficas pertenecen a sus adaptadores/renderizadores existentes.
 * Este contrato NO añade física, vida, civilizaciones, imágenes ni permisos.
 *
 * Las fichas, SystemScene y los visores de especies conservan las autoridades
 * existentes (38.5, 38.7 y 38.7x). No consultar jamás Ground Truth aquí.
 */
export const GENESIS_VISUAL_PROVENANCE_REVISION_388 =
  'GENESIS.38.8/code-procedural-provenance/v1' as const;

export type GenesisVisualSubjectKind388 =
  | 'STAR' | 'PLANET' | 'MOON' | 'ASTEROID' | 'COMET'
  | 'TRANS_NEPTUNIAN_OBJECT' | 'CAPTURED_EXTRASOLAR_OBJECT'
  | 'SPECIES' | 'CIVILIZATION' | 'COLONIAL_INFRASTRUCTURE';

export type GenesisVisualCanonicalAuthority388 =
  | 'STELLAR_PHYSICS' | 'PLANETARY_PHYSICS' | 'MINOR_BODY_PHYSICS'
  | 'VIDA6_BIOLOGY' | 'VIDA7_CIVILIZATIONS' | 'VIDA8_COLONIZATION';

/** Lists are *field provenance*, not an additional source of scientific facts. */
export interface GenesisVisualFieldProvenance388 {
  readonly canonicalAuthority: GenesisVisualCanonicalAuthority388;
  /** Representative inputs already validated/selected by their source adapter. */
  readonly canonicalInputs: readonly string[];
  /** Projection fields; some are derived from canonical inputs, not artistic guesses. */
  readonly presentationOutputs: readonly string[];
  /** Renderer-only choices that must not be promoted to new domain facts. */
  readonly rendererDetails: readonly string[];
}

export interface GenesisVisualTrace388 {
  readonly revision: typeof GENESIS_VISUAL_PROVENANCE_REVISION_388;
  readonly subjectKind: GenesisVisualSubjectKind388;
  readonly identity: string;
  readonly appearanceKey: string | null;
  readonly generation: 'CODE_PROCEDURAL';
  /** The existing authorizer still decides when this trace may be exposed. */
  readonly knowledgePolicy: 'INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION';
  readonly provenance: GenesisVisualFieldProvenance388;
}

/** Field classification shared by all visual entry points; immutable and static. */
function fields(
  canonicalAuthority: GenesisVisualCanonicalAuthority388,
  canonicalInputs: readonly string[],
  presentationOutputs: readonly string[],
  rendererDetails: readonly string[],
): GenesisVisualFieldProvenance388 {
  return Object.freeze({
    canonicalAuthority,
    canonicalInputs: Object.freeze([...canonicalInputs]),
    presentationOutputs: Object.freeze([...presentationOutputs]),
    rendererDetails: Object.freeze([...rendererDetails]),
  });
}

export const GENESIS_VISUAL_FIELDS_388: Readonly<Record<GenesisVisualSubjectKind388, GenesisVisualFieldProvenance388>> =
  Object.freeze({
    STAR: fields('STELLAR_PHYSICS',
      ['sourceRadiusSolar', 'sourceLuminositySolar', 'sourceEffectiveTemperatureKelvin', 'motionContributions'],
      ['radiusScene', 'opticalRadiusScene', 'colorHex', 'lightIntensity'],
      ['stellarGlow', 'presentationLighting', 'cameraScale']),
    PLANET: fields('PLANETARY_PHYSICS',
      ['physicalRadiusEarthCOLVIS1', 'surfaceEnvironment', 'giantAtmosphere', 'spin', 'opticalSurfaceGravityMetersPerSecondSquared'],
      ['radiusScene', 'surfaceStyle', 'specialPresentation', 'visualVegetationProfile'],
      ['terrainMicrodetail', 'cloudMicrodetail', 'materialRoughness', 'sceneScale']),
    MOON: fields('PLANETARY_PHYSICS',
      ['hostPlanetId', 'spin', 'motionContributions'],
      ['radiusScene', 'colorHex', 'visualPresentation', 'visualInfrastructurePlans'],
      ['localTerrainMicrodetail', 'cameraFraming']),
    ASTEROID: fields('MINOR_BODY_PHYSICS',
      ['diameterKilometers', 'carbonaceousFraction01', 'silicateFraction01', 'metalFraction01', 'iceFraction01'],
      ['presentationRoughness01', 'presentationIrregularity01', 'visualVariantUint32'],
      ['facetMicrodetail', 'presentationLighting']),
    COMET: fields('MINOR_BODY_PHYSICS',
      ['activityRegime', 'hasComa', 'hasDustTail', 'hasIonTail'],
      ['presentationNucleusColorHex', 'presentationComaOpacity01', 'presentationDustTailLengthScene'],
      ['nucleusMicrodetail', 'tailParticleAppearance']),
    TRANS_NEPTUNIAN_OBJECT: fields('MINOR_BODY_PHYSICS',
      ['title'],
      ['sourceRadiusScene', 'colorHex', 'presentation'],
      ['materialMicrodetail', 'lighting']),
    CAPTURED_EXTRASOLAR_OBJECT: fields('MINOR_BODY_PHYSICS',
      ['title'],
      ['sourceRadiusScene', 'colorHex', 'presentation'],
      ['materialMicrodetail', 'lighting']),
    SPECIES: fields('VIDA6_BIOLOGY',
      ['speciesId', 'morphology', 'ecology', 'bodyLengthMeters', 'pigmentation', 'adaptations'],
      ['appearanceFingerprint', 'variantSeedUint32', 'renderFamily', 'bodyScaleClass'],
      ['skinMicrodetail', 'costumeOrnament', 'secondaryAnatomicalFinish']),
    CIVILIZATION: fields('VIDA7_CIVILIZATIONS',
      ['founderSpeciesId', 'lineage', 'tier', 'culture', 'technology', 'settlementPatterns'],
      ['visualCivilizationTier', 'nightLighting', 'architecturePresentation'],
      ['buildingMicrodetail', 'lightingArrangement', 'clothingFinish']),
    COLONIAL_INFRASTRUCTURE: fields('VIDA8_COLONIZATION',
      ['bodyStorageKey', 'id', 'provenance', 'tier', 'habitatTechnology', 'locationStatus'],
      ['visualInfrastructurePlans', 'settlementLayout'],
      ['facadeDetail', 'trafficDecoration', 'localLighting']),
  });

/**
 * Optional diagnostics only: never a new guard around confirmed content.
 * Stable across repeated calls and independent of frame time, random state and
 * the order in which scene objects happen to be rendered.
 */
export function genesisVisualTrace388(
  subjectKind: GenesisVisualSubjectKind388,
  identity: string,
  appearanceKey: string | number | null = null,
): GenesisVisualTrace388 {
  return Object.freeze({
    revision: GENESIS_VISUAL_PROVENANCE_REVISION_388,
    subjectKind,
    identity,
    appearanceKey: appearanceKey === null ? null : String(appearanceKey),
    generation: 'CODE_PROCEDURAL',
    knowledgePolicy: 'INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION',
    provenance: GENESIS_VISUAL_FIELDS_388[subjectKind],
  });
}

/**
 * Pure audit helper. It does not merge or mutate the domain model: a
 * presentation field must not silently overwrite a canonical field.
 */
export function genesisVisualPresentationHasNoCanonicalOverride388(
  canonical: Readonly<Record<string, unknown>>,
  presentation: Readonly<Record<string, unknown>>,
): boolean {
  return Object.keys(presentation).every(field => !Object.prototype.hasOwnProperty.call(canonical, field));
}

/** A scene is a scientific procedural projection even when knowledge is partial. */
export function genesisVisualSceneTrace388(
  proceduralIdentity: string,
): Readonly<{
  revision: typeof GENESIS_VISUAL_PROVENANCE_REVISION_388;
  representation: 'CODE_PROCEDURAL_SCIENTIFIC_SCENE';
  identity: string;
  knowledgePolicy: 'INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION';
  supportedKinds: readonly GenesisVisualSubjectKind388[];
}> {
  return Object.freeze({
    revision: GENESIS_VISUAL_PROVENANCE_REVISION_388,
    representation: 'CODE_PROCEDURAL_SCIENTIFIC_SCENE',
    identity: proceduralIdentity,
    knowledgePolicy: 'INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION',
    supportedKinds: Object.freeze([
      'STAR', 'PLANET', 'MOON', 'ASTEROID', 'COMET',
      'TRANS_NEPTUNIAN_OBJECT', 'CAPTURED_EXTRASOLAR_OBJECT',
      'CIVILIZATION', 'COLONIAL_INFRASTRUCTURE',
    ] as const),
  });
}
