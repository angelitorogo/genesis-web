export type SystemSceneAsteroidCompositionRegime =
  | 'CARBONACEOUS'
  | 'SILICACEOUS'
  | 'METALLIC'
  | 'ICE_RICH'
  | 'MIXED_ROCK_ICE';

export type SystemSceneAsteroidStructureRegime =
  | 'COHERENT'
  | 'FRACTURED'
  | 'RUBBLE_PILE';

export type SystemSceneAsteroidMultiplicityRegime =
  | 'SINGLE'
  | 'CONTACT_BINARY'
  | 'BINARY';

export interface SystemSceneAsteroidPresentationInputV1 {
  readonly proceduralId: string;
  readonly diameterKilometers: number;
  readonly compositionRegime: SystemSceneAsteroidCompositionRegime;
  readonly structureRegime: SystemSceneAsteroidStructureRegime;
  readonly multiplicityRegime: SystemSceneAsteroidMultiplicityRegime;
  readonly carbonaceousFraction01: number;
  readonly silicateFraction01: number;
  readonly metalFraction01: number;
  readonly iceFraction01: number;
  readonly porosityIndex01: number;
  readonly bulkDensityGramsPerCubicCentimeter: number;
  readonly geometricAlbedo01: number;
  readonly binaryMassRatio01: number | null;
  readonly binarySeparationPrimaryRadii: number | null;
}

export interface SystemSceneAsteroidPresentationV1 {
  readonly version: 1;
  readonly source: 'PHASE_22_4_ASTEROID_TAXONOMY';
  readonly proceduralId: string;
  readonly sourceDiameterKilometers: number;
  readonly compositionRegime: SystemSceneAsteroidCompositionRegime;
  readonly structureRegime: SystemSceneAsteroidStructureRegime;
  readonly multiplicityRegime: SystemSceneAsteroidMultiplicityRegime;
  readonly carbonaceousFraction01: number;
  readonly silicateFraction01: number;
  readonly metalFraction01: number;
  readonly iceFraction01: number;
  readonly porosityIndex01: number;
  readonly bulkDensityGramsPerCubicCentimeter: number;
  readonly geometricAlbedo01: number;
  readonly binaryMassRatio01: number | null;
  readonly binarySeparationPrimaryRadii: number | null;
  readonly shapeSeedUint32: number;
  readonly presentationColorHex: string;
  readonly presentationRoughness01: number;
  readonly presentationMetalness01: number;
  readonly presentationIrregularity01: number;
  readonly presentationFacetContrast01: number;
  readonly presentationAxisScaleX: number;
  readonly presentationAxisScaleY: number;
  readonly presentationAxisScaleZ: number;
  readonly presentationOrientationXRadians: number;
  readonly presentationOrientationYRadians: number;
  readonly presentationOrientationZRadians: number;
  readonly presentationContactSecondaryRadiusScale01: number | null;
  readonly presentationDetachedSecondaryRadiusScale01: number | null;
  readonly presentationDetachedSeparation01: number | null;
  readonly presentationSeparationAdjusted: boolean;
}

export const SYSTEM_SCENE_ASTEROID_PRESENTATION_VERSION =
  1 as const;

const TWO_PI = Math.PI * 2;
const FRACTION_TOLERANCE = 1e-8;

interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Point-25.7 read-only presentation projection for one relevant asteroid.
 *
 * Physical/taxonomic inputs are frozen products of point 22.4. Shape axes,
 * static orientation and facet contrast are presentation-only derivatives of
 * the stable procedural id; no new seed/PRNG draw or physical spin is created.
 */
export function buildSystemSceneAsteroidPresentationV1(
  input: SystemSceneAsteroidPresentationInputV1,
): SystemSceneAsteroidPresentationV1 {
  validateInput(input);

  const shapeSeedUint32 =
    systemSceneAsteroidPresentationSeed(input.proceduralId);
  const structureBase =
    irregularityForStructure(input.structureRegime);
  const irregularity =
    clamp01(
      structureBase +
        input.porosityIndex01 * 0.19 +
        (seedUnit(shapeSeedUint32, 3) - 0.5) * 0.08,
    );
  const elongation =
    0.08 +
    irregularity * 0.24;

  const rawAxes = [
    1 + (seedUnit(shapeSeedUint32, 5) - 0.5) * elongation * 2,
    1 + (seedUnit(shapeSeedUint32, 7) - 0.5) * elongation * 2,
    1 + (seedUnit(shapeSeedUint32, 11) - 0.5) * elongation * 2,
  ] as const;
  const averageAxis =
    (rawAxes[0] + rawAxes[1] + rawAxes[2]) / 3;

  const compositionColor =
    asteroidCompositionColor(input.compositionRegime);
  const albedoBrightness =
    clamp(
      0.68 +
        Math.sqrt(input.geometricAlbedo01) * 0.86,
      0.68,
      1.34,
    );
  const colorVariation =
    0.92 +
    0.16 * seedUnit(shapeSeedUint32, 13);
  const presentationColor =
    multiplyRgb(
      compositionColor,
      albedoBrightness * colorVariation,
    );

  const contactScale =
    input.multiplicityRegime === 'CONTACT_BINARY'
      ? clamp(
          0.52 +
            0.36 * seedUnit(shapeSeedUint32, 17),
          0.50,
          0.90,
        )
      : null;

  const detachedSecondaryScale =
    input.multiplicityRegime === 'BINARY'
      ? Math.cbrt(input.binaryMassRatio01!)
      : null;

  const detachedPhysicalSeparation =
    input.binarySeparationPrimaryRadii;
  const detachedPresentationSeparation =
    detachedPhysicalSeparation === null
      ? null
      : clamp(
          0.58 +
            Math.log1p(
              Math.max(0, detachedPhysicalSeparation - 1),
            ) * 0.16,
          0.62,
          0.94,
        );

  return Object.freeze({
    version: SYSTEM_SCENE_ASTEROID_PRESENTATION_VERSION,
    source: 'PHASE_22_4_ASTEROID_TAXONOMY' as const,
    proceduralId: input.proceduralId,
    sourceDiameterKilometers: input.diameterKilometers,
    compositionRegime: input.compositionRegime,
    structureRegime: input.structureRegime,
    multiplicityRegime: input.multiplicityRegime,
    carbonaceousFraction01: input.carbonaceousFraction01,
    silicateFraction01: input.silicateFraction01,
    metalFraction01: input.metalFraction01,
    iceFraction01: input.iceFraction01,
    porosityIndex01: input.porosityIndex01,
    bulkDensityGramsPerCubicCentimeter:
      input.bulkDensityGramsPerCubicCentimeter,
    geometricAlbedo01: input.geometricAlbedo01,
    binaryMassRatio01: input.binaryMassRatio01,
    binarySeparationPrimaryRadii:
      input.binarySeparationPrimaryRadii,
    shapeSeedUint32,
    presentationColorHex: rgbToHex(presentationColor),
    presentationRoughness01:
      clamp(
        0.90 +
          input.porosityIndex01 * 0.08 -
          input.metalFraction01 * 0.17 -
          input.iceFraction01 * 0.06,
        0.62,
        0.98,
      ),
    presentationMetalness01:
      clamp01(
        0.015 +
          input.metalFraction01 * 0.42,
      ),
    presentationIrregularity01: irregularity,
    presentationFacetContrast01:
      clamp01(
        0.10 +
          irregularity * 0.42 +
          (input.structureRegime === 'FRACTURED' ? 0.12 : 0) +
          (input.structureRegime === 'RUBBLE_PILE' ? 0.16 : 0),
      ),
    presentationAxisScaleX: rawAxes[0] / averageAxis,
    presentationAxisScaleY: rawAxes[1] / averageAxis,
    presentationAxisScaleZ: rawAxes[2] / averageAxis,
    presentationOrientationXRadians:
      (seedUnit(shapeSeedUint32, 19) - 0.5) * Math.PI,
    presentationOrientationYRadians:
      seedUnit(shapeSeedUint32, 23) * TWO_PI,
    presentationOrientationZRadians:
      (seedUnit(shapeSeedUint32, 29) - 0.5) * Math.PI,
    presentationContactSecondaryRadiusScale01: contactScale,
    presentationDetachedSecondaryRadiusScale01:
      detachedSecondaryScale,
    presentationDetachedSeparation01:
      detachedPresentationSeparation,
    presentationSeparationAdjusted:
      detachedPhysicalSeparation !== null &&
      detachedPresentationSeparation !== null,
  });
}

export function systemSceneAsteroidPresentationSeed(
  proceduralId: string,
): number {
  const normalized = proceduralId.trim();
  if (normalized.length === 0) {
    throw new RangeError('Asteroid proceduralId must not be blank.');
  }

  const key = `${normalized}|GENESIS-25.7-ASTEROID-SHAPE-V1`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function validateInput(
  input: SystemSceneAsteroidPresentationInputV1,
): void {
  systemSceneAsteroidPresentationSeed(input.proceduralId);

  if (
    !(['CARBONACEOUS', 'SILICACEOUS', 'METALLIC', 'ICE_RICH', 'MIXED_ROCK_ICE'] as const)
      .includes(input.compositionRegime) ||
    !(['COHERENT', 'FRACTURED', 'RUBBLE_PILE'] as const)
      .includes(input.structureRegime) ||
    !(['SINGLE', 'CONTACT_BINARY', 'BINARY'] as const)
      .includes(input.multiplicityRegime)
  ) {
    throw new RangeError('Asteroid presentation requires known point-22.4 taxonomy regimes.');
  }

  if (!Number.isFinite(input.diameterKilometers) || input.diameterKilometers <= 0) {
    throw new RangeError('Asteroid diameter must be positive and finite.');
  }

  const fractions = [
    input.carbonaceousFraction01,
    input.silicateFraction01,
    input.metalFraction01,
    input.iceFraction01,
  ];
  fractions.forEach(value => assertUnit(value, 'Asteroid composition fraction'));
  if (Math.abs(fractions.reduce((sum, value) => sum + value, 0) - 1) > FRACTION_TOLERANCE) {
    throw new RangeError('Asteroid presentation composition fractions must sum to 1.');
  }

  assertUnit(input.porosityIndex01, 'Asteroid porosityIndex01');
  assertUnit(input.geometricAlbedo01, 'Asteroid geometricAlbedo01');

  if (
    !Number.isFinite(input.bulkDensityGramsPerCubicCentimeter) ||
    input.bulkDensityGramsPerCubicCentimeter <= 0
  ) {
    throw new RangeError('Asteroid bulk density must be positive and finite.');
  }

  if (input.multiplicityRegime === 'BINARY') {
    if (
      input.binaryMassRatio01 === null ||
      input.binarySeparationPrimaryRadii === null ||
      !Number.isFinite(input.binaryMassRatio01) ||
      input.binaryMassRatio01 <= 0 ||
      input.binaryMassRatio01 > 1 ||
      !Number.isFinite(input.binarySeparationPrimaryRadii) ||
      input.binarySeparationPrimaryRadii <= 1
    ) {
      throw new RangeError('Detached asteroid binaries require valid point-22.4 mass ratio and separation.');
    }
  } else if (
    input.binaryMassRatio01 !== null ||
    input.binarySeparationPrimaryRadii !== null
  ) {
    throw new RangeError('Only detached asteroid binaries may expose detached companion parameters.');
  }
}

function irregularityForStructure(
  structure: SystemSceneAsteroidStructureRegime,
): number {
  switch (structure) {
    case 'COHERENT':
      return 0.10;
    case 'FRACTURED':
      return 0.24;
    case 'RUBBLE_PILE':
      return 0.38;
  }
}

function asteroidCompositionColor(
  composition: SystemSceneAsteroidCompositionRegime,
): Rgb {
  switch (composition) {
    case 'CARBONACEOUS':
      return rgb(70, 61, 54);
    case 'SILICACEOUS':
      return rgb(151, 126, 100);
    case 'METALLIC':
      return rgb(139, 134, 128);
    case 'ICE_RICH':
      return rgb(171, 199, 211);
    case 'MIXED_ROCK_ICE':
      return rgb(137, 151, 155);
  }
}

function seedUnit(seed: number, salt: number): number {
  let hash = seed ^ Math.imul(salt, 0x9e3779b9);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  return (hash >>> 0) / 0xffffffff;
}

function assertUnit(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${label} must be finite in [0, 1].`);
  }
}

function rgb(r: number, g: number, b: number): Rgb {
  return { r, g, b };
}

function multiplyRgb(color: Rgb, factor: number): Rgb {
  return rgb(
    clamp(color.r * factor, 0, 255),
    clamp(color.g * factor, 0, 255),
    clamp(color.b * factor, 0, 255),
  );
}

function rgbToHex(color: Rgb): string {
  const byte = (value: number) =>
    Math.round(clamp(value, 0, 255))
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${byte(color.r)}${byte(color.g)}${byte(color.b)}`;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
