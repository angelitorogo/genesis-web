/** Shared VISBIO vegetation profile. The fiche and confirmed system scene MUST
 * use this very same pure function to preserve continents, vegetation, and
 * civilization-night settlement geography at every camera scale. */
import type { Vida6EcosystemSnapshot } from '../../domain/life/vida6-ecosystems-species';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import type { ScientificPlanetVegetationPreviewProfile } from '../scientific/scientific-body-preview';

export function resolvePlanetVegetationPreviewProfileV1(
  biology:
    Vida9BiologyRecord | undefined,

  fallbackEcosystem:
    Vida6EcosystemSnapshot | undefined,
): ScientificPlanetVegetationPreviewProfile | null {
  const ecosystem = biology?.ecosystem ?? fallbackEcosystem;

  if (
    ecosystem === undefined ||
    !ecosystem.biospherePresent ||
    !ecosystem.effectiveGroups.includes('PLANTS_TREES')
  ) {
    return null;
  }

  const floraSpeciesCount =
    ecosystem.species.filter(
      species => species.group === 'PLANTS_TREES',
    );

  if (floraSpeciesCount.length === 0) {
    return null;
  }

  // VISBIO.1c: fraction of *vegetatable land*, not of the full sphere.
  // The former global cap (0.40) made 3, 4 and 8 species almost identical
  // once the planetary water and desert masks had consumed most pixels.
  let coverage =
    0.10 + Math.min(0.70, (floraSpeciesCount.length - 1) * 0.105);

  let lushness =
    0.24 +
    Math.min(0.26, floraSpeciesCount.length * 0.05);

  if (ecosystem.habitatsOccupied.includes('SURFACE_CANOPY')) {
    coverage += 0.045;
    lushness += 0.18;
  }

  if (ecosystem.habitatsOccupied.includes('SURFACE_OPEN_TERRAIN')) {
    coverage += 0.035;
    lushness += 0.08;
  }

  if (ecosystem.habitatsOccupied.includes('SURFACE_WET_MARGIN')) {
    coverage += 0.025;
    lushness += 0.07;
  }

  if (ecosystem.regime === 'SURFACE_DIVERSE') {
    coverage += 0.035;
    lushness += 0.08;
  } else {
    coverage -= 0.02;
  }

  const paletteHexes =
    uniqueVegetationPaletteHexesV1(
      floraSpeciesCount.flatMap(
        species => [
          species.phenotype.primaryColorHex,
          species.phenotype.secondaryColorHex,
        ],
      ),
    );
  const paletteEntries =
    buildWeightedVegetationPaletteEntriesV1(
      floraSpeciesCount,
    );

  return Object.freeze({
    coverageFraction01: Number(
      Math.max(0.08, Math.min(0.86, coverage))
        .toFixed(3),
    ),
    lushness01: Number(
      Math.max(0.26, Math.min(0.92, lushness))
        .toFixed(3),
    ),
    floraSpeciesCount:
      floraSpeciesCount.length,
    paletteHexes:
      Object.freeze(
        paletteHexes.length > 0
          ? paletteHexes
          : ['#8FBE63'],
      ),
    paletteEntries:
      Object.freeze(
        paletteEntries.length > 0
          ? paletteEntries
          : [Object.freeze({ hex: '#8FBE63', weight01: 1 })],
      ),
  });
}

function buildWeightedVegetationPaletteEntriesV1(
  floraSpecies:
    ReadonlyArray<Vida6EcosystemSnapshot['species'][number]>,
): readonly { readonly hex: string; readonly weight01: number }[] {
  const weights = new Map<string, number>();
  const add = (
    hex: string | null | undefined,
    weight: number,
  ): void => {
    const normalized = normalizeHexColorV1(hex);
    if (normalized === null || weight <= 0) {
      return;
    }
    weights.set(normalized, (weights.get(normalized) ?? 0) + weight);
  };

  floraSpecies.forEach((species, speciesIndex) => {
    const importance = 1 + Math.max(0, 0.14 - speciesIndex * 0.02);
    add(species.phenotype.primaryColorHex, 1.0 * importance);
    add(species.phenotype.secondaryColorHex, 0.62 * importance);

    const blend = blendHexColorsV1(
      species.phenotype.primaryColorHex,
      species.phenotype.secondaryColorHex,
      0.5,
    );
    add(blend, 0.30 * importance);
  });

  const totalWeight = Array.from(weights.values())
    .reduce((sum, value) => sum + value, 0);

  if (totalWeight <= 0) {
    return [];
  }

  return Object.freeze(
    Array.from(weights.entries())
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 12)
      .map(([hex, weight]) => Object.freeze({
        hex,
        weight01: Number((weight / totalWeight).toFixed(4)),
      })),
  );
}

function blendHexColorsV1(
  left: string | null | undefined,
  right: string | null | undefined,
  mix01: number,
): string | null {
  const leftRgb = parseHexColorV1(left);
  const rightRgb = parseHexColorV1(right);
  if (leftRgb === null && rightRgb === null) {
    return null;
  }
  const source = leftRgb ?? rightRgb!;
  const target = rightRgb ?? leftRgb!;
  return rgbToHexV1([
    Math.round(source[0] + (target[0] - source[0]) * mix01),
    Math.round(source[1] + (target[1] - source[1]) * mix01),
    Math.round(source[2] + (target[2] - source[2]) * mix01),
  ]);
}

function uniqueVegetationPaletteHexesV1(
  values:
    readonly string[],
): string[] {
  const unique = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const normalized = normalizeHexColorV1(value);
    if (normalized === null || unique.has(normalized)) {
      continue;
    }

    unique.add(normalized);
    result.push(normalized);

    if (result.length >= 6) {
      break;
    }
  }

  return result;
}

function normalizeHexColorV1(
  value:
    string | null | undefined,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const hex = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toUpperCase();
  }
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`.toUpperCase();
  }
  return null;
}

function parseHexColorV1(
  value: string | null | undefined,
): [number, number, number] | null {
  const normalized = normalizeHexColorV1(value);
  if (normalized === null) {
    return null;
  }
  return [
    Number.parseInt(normalized.slice(1, 3), 16),
    Number.parseInt(normalized.slice(3, 5), 16),
    Number.parseInt(normalized.slice(5, 7), 16),
  ];
}

function rgbToHexV1(
  rgb: [number, number, number],
): string {
  return `#${rgb.map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

