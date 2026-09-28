import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { PlanetType } from '../../domain/planetary/planet-type';
import { MoonWaterRegime } from '../../domain/planetary/moon-water-regime';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorContentGenerator } from '../sector/galaxy-sector-content-generator';
import { StellarDesignationGenerator } from '../stellar/stellar-designation-generator';
import {
  StellarMultihostFormation,
  type GeneratedSingleHost,
} from '../stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../stellar/stellar-multihost-physical-source-key';
import { GalaxyGenerator } from '../universe/galaxy-generator';

const PUBLIC_V2_KEY = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
  GeneratorVersion.V2,
);

const HOME_FIXTURES = Object.freeze([
  { x: 15, y: 9, name: 'Pulaer' },
  { x: 3, y: 25, name: 'Vathum' },
  { x: 2, y: 17, name: 'Heriia' },
  { x: 22, y: 20, name: 'Triaraia' },
  { x: -22, y: 24, name: 'Chuthoria' },
  { x: 22, y: 12, name: 'Kiraum' },
  { x: 18, y: -30, name: 'Menaar' },
  { x: 40, y: 13, name: 'Phoseria' },
  { x: 0, y: 16, name: 'Stinaion' },
]);

const ROCKY_MOON_MAX_ICE_01 = 0.35;
const ICY_MOON_MIN_ICE_01 = 0.65;

function locatorAt(
  x: number,
  y: number,
  systemName: string,
): SystemLocator {
  const physicalKey = multihostPhysicalSourceKey(PUBLIC_V2_KEY);
  const galaxy = GalaxyGenerator.generate(physicalKey, 0n);
  const content = GalaxySectorContentGenerator.generate(
    galaxy,
    new GalaxySectorCoordinates(x, y),
  );

  const locator = content.systemLocators.find(candidate =>
    StellarDesignationGenerator.generate(physicalKey, candidate).name === systemName,
  );

  if (locator === undefined) {
    throw new Error(`Expected ${systemName} in (${x}, ${y}).`);
  }

  return locator;
}

function physicalHostsFor(
  locator: SystemLocator,
): readonly GeneratedSingleHost[] {
  const multiple = StellarMultihostFormation.generateOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (multiple !== null) {
    return multiple.components;
  }

  const single = StellarMultihostFormation.generateV2SingleOrNull(
    PUBLIC_V2_KEY,
    locator,
  );

  if (single === null) {
    throw new Error('Expected SINGLE or multiple physical host.');
  }

  return Object.freeze([single]);
}

function hasSubsurfaceEvidence(
  regime: MoonWaterRegime,
): boolean {
  return regime === MoonWaterRegime.SUBSURFACE_OCEAN ||
    regime === MoonWaterRegime.ICE_AND_SUBSURFACE_OCEAN ||
    regime === MoonWaterRegime.MIXED;
}

function compositionBucket(
  ice: number,
): 'ROCKY' | 'MIXED_ROCK_ICE' | 'ICY' {
  if (ice < ROCKY_MOON_MAX_ICE_01) {
    return 'ROCKY';
  }

  if (ice >= ICY_MOON_MIN_ICE_01) {
    return 'ICY';
  }

  return 'MIXED_ROCK_ICE';
}

function round(value: number, digits = 4): number {
  return Number(value.toFixed(digits));
}

function quantile(
  values: readonly number[],
  q: number,
): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const position = (sorted.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);

  if (lower === upper) {
    return sorted[lower];
  }

  return (
    sorted[lower] * (upper - position) +
    sorted[upper] * (position - lower)
  );
}

function distribution(
  values: readonly number[],
) {
  return {
    min: round(Math.min(...values)),
    p10: round(quantile(values, 0.10)),
    p50: round(quantile(values, 0.50)),
    p90: round(quantile(values, 0.90)),
    max: round(Math.max(...values)),
  };
}

describe('Point 4 — subsurface-ocean frequency audit', () => {
  it('measures evidence only among physically materialized moons and traces its physical support', () => {
    let sampledPhysicalHosts = 0;
    let sampledPlanets = 0;
    let totalMoonIdentities = 0;
    let relevantMoons = 0;
    let unmaterializedMoons = 0;

    let evidenceCount = 0;
    let subsurfaceHabitabilityCandidateCount = 0;
    let evidenceAndHabitabilityCandidateCount = 0;
    let evidenceWithoutHabitabilityCandidateCount = 0;

    let evidenceLowTidalHeating = 0;
    let evidenceVeryLowTidalHeating = 0;
    let evidenceLowInternalHeat = 0;
    let evidenceNearOceanThreshold = 0;
    let evidenceNearEnergyThreshold = 0;

    const regimeCounts: Record<string, number> = {};
    const evidenceByComposition = {
      ROCKY: 0,
      MIXED_ROCK_ICE: 0,
      ICY: 0,
    };
    const totalByComposition = {
      ROCKY: 0,
      MIXED_ROCK_ICE: 0,
      ICY: 0,
    };

    const byHostType = new Map<
      PlanetType,
      {
        relevant: number;
        evidence: number;
        subsurfaceCandidates: number;
      }
    >();

    const evidenceOceanPotential: number[] = [];
    const evidenceWaterInventory: number[] = [];
    const evidenceTidalHeating: number[] = [];
    const evidenceInternalHeat: number[] = [];
    const evidenceEnergySupport: number[] = [];
    const evidenceHabitability: number[] = [];
    const evidenceMassEarth: number[] = [];
    const evidenceRadiusEarth: number[] = [];
    const evidenceSurfaceTemperatureKelvin: number[] = [];

    const nonEvidenceOceanPotential: number[] = [];
    const nonEvidenceWaterInventory: number[] = [];
    const nonEvidenceTidalHeating: number[] = [];
    const nonEvidenceInternalHeat: number[] = [];

    const evidenceWorlds: Array<{
      system: string;
      hostPlanet: string;
      hostType: PlanetType;
      moon: string;
      composition: 'ROCKY' | 'MIXED_ROCK_ICE' | 'ICY';
      waterRegime: MoonWaterRegime;
      massEarth: number;
      radiusEarth: number;
      iceRichness: number;
      waterInventory: number;
      oceanPotential: number;
      tidalHeating: number;
      internalHeatRetention: number;
      subsurfaceEnergySupport: number;
      subsurfaceHabitability: number;
      subsurfaceCandidate: boolean;
      surfaceTemperatureK: number;
    }> = [];

    for (const fixture of HOME_FIXTURES) {
      const locator = locatorAt(fixture.x, fixture.y, fixture.name);

      for (const host of physicalHostsFor(locator)) {
        sampledPhysicalHosts += 1;

        for (let index = 0; index < host.planets.length; index += 1) {
          const planet = host.planets[index];
          const moonSystem = host.moonSystems[index];

          sampledPlanets += 1;
          totalMoonIdentities += moonSystem.moonCount;
          relevantMoons += moonSystem.relevantMoonCount;
          unmaterializedMoons += moonSystem.unmaterializedMinorMoonCount;

          for (const moon of moonSystem.relevantMoons) {
            const environment = moon.environmentState;
            const habitability = moon.habitabilityState;
            const physical = moon.physicalProperties;

            const composition = compositionBucket(
              environment.inferredIceRichnessIndex01,
            );
            totalByComposition[composition] += 1;

            regimeCounts[environment.waterRegime] =
              (regimeCounts[environment.waterRegime] ?? 0) + 1;

            const typeTotals =
              byHostType.get(planet.planetType) ??
              {
                relevant: 0,
                evidence: 0,
                subsurfaceCandidates: 0,
              };

            typeTotals.relevant += 1;

            if (habitability.subsurfaceCandidate) {
              subsurfaceHabitabilityCandidateCount += 1;
              typeTotals.subsurfaceCandidates += 1;
            }

            const evidence = hasSubsurfaceEvidence(
              environment.waterRegime,
            );

            if (evidence) {
              evidenceCount += 1;
              typeTotals.evidence += 1;
              evidenceByComposition[composition] += 1;

              if (habitability.subsurfaceCandidate) {
                evidenceAndHabitabilityCandidateCount += 1;
              } else {
                evidenceWithoutHabitabilityCandidateCount += 1;
              }

              if (environment.sourceTidalHeatingIndex01 < 0.10) {
                evidenceLowTidalHeating += 1;
              }

              if (environment.sourceTidalHeatingIndex01 < 0.03) {
                evidenceVeryLowTidalHeating += 1;
              }

              if (environment.internalHeatRetentionIndex01 < 0.20) {
                evidenceLowInternalHeat += 1;
              }

              if (
                environment.subsurfaceOceanPotentialIndex01 >= 0.35 &&
                environment.subsurfaceOceanPotentialIndex01 < 0.45
              ) {
                evidenceNearOceanThreshold += 1;
              }

              if (
                habitability.subsurfaceEnergySupportIndex01 >= 0.20 &&
                habitability.subsurfaceEnergySupportIndex01 < 0.30
              ) {
                evidenceNearEnergyThreshold += 1;
              }

              evidenceOceanPotential.push(
                environment.subsurfaceOceanPotentialIndex01,
              );
              evidenceWaterInventory.push(
                environment.waterInventoryIndex01,
              );
              evidenceTidalHeating.push(
                environment.sourceTidalHeatingIndex01,
              );
              evidenceInternalHeat.push(
                environment.internalHeatRetentionIndex01,
              );
              evidenceEnergySupport.push(
                habitability.subsurfaceEnergySupportIndex01,
              );
              evidenceHabitability.push(
                habitability.subsurfaceHabitabilityIndex01,
              );
              evidenceMassEarth.push(physical.massEarth);
              evidenceRadiusEarth.push(physical.radiusEarth);
              evidenceSurfaceTemperatureKelvin.push(
                environment.estimatedSurfaceTemperatureKelvin,
              );

              evidenceWorlds.push({
                system: fixture.name,
                hostPlanet: planet.designation.name,
                hostType: planet.planetType,
                moon: moon.identity.designation.name,
                composition,
                waterRegime: environment.waterRegime,
                massEarth: round(physical.massEarth, 6),
                radiusEarth: round(physical.radiusEarth, 6),
                iceRichness: round(environment.inferredIceRichnessIndex01),
                waterInventory: round(environment.waterInventoryIndex01),
                oceanPotential: round(environment.subsurfaceOceanPotentialIndex01),
                tidalHeating: round(environment.sourceTidalHeatingIndex01),
                internalHeatRetention: round(environment.internalHeatRetentionIndex01),
                subsurfaceEnergySupport: round(
                  habitability.subsurfaceEnergySupportIndex01,
                ),
                subsurfaceHabitability: round(
                  habitability.subsurfaceHabitabilityIndex01,
                ),
                subsurfaceCandidate: habitability.subsurfaceCandidate,
                surfaceTemperatureK: round(
                  environment.estimatedSurfaceTemperatureKelvin,
                  2,
                ),
              });
            } else {
              nonEvidenceOceanPotential.push(
                environment.subsurfaceOceanPotentialIndex01,
              );
              nonEvidenceWaterInventory.push(
                environment.waterInventoryIndex01,
              );
              nonEvidenceTidalHeating.push(
                environment.sourceTidalHeatingIndex01,
              );
              nonEvidenceInternalHeat.push(
                environment.internalHeatRetentionIndex01,
              );
            }

            byHostType.set(planet.planetType, typeTotals);
          }
        }
      }
    }

    evidenceWorlds.sort(
      (left, right) =>
        right.oceanPotential - left.oceanPotential ||
        right.subsurfaceEnergySupport - left.subsurfaceEnergySupport,
    );

    const byHostTypeObject = Object.fromEntries(
      [...byHostType.entries()]
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([type, totals]) => [
          type,
          {
            ...totals,
            evidenceFraction:
              totals.relevant === 0
                ? 0
                : round(totals.evidence / totals.relevant),
            subsurfaceCandidateFraction:
              totals.relevant === 0
                ? 0
                : round(totals.subsurfaceCandidates / totals.relevant),
          },
        ]),
    );

    const summary = {
      sampledSystems: HOME_FIXTURES.length,
      sampledPhysicalHosts,
      sampledPlanets,

      totalMoonIdentities,
      physicallyMaterializedRelevantMoons: relevantMoons,
      unmaterializedMoonIdentities: unmaterializedMoons,

      /*
       * Correct denominator for current subsurface-ocean evidence telemetry:
       * only relevant/materialized moons possess MoonEnvironmentState.
       */
      subsurfaceOceanEvidence: evidenceCount,
      evidenceFractionOfRelevantMoons:
        relevantMoons === 0 ? 0 : round(evidenceCount / relevantMoons),
      evidenceFractionOfAllMoonIdentities:
        totalMoonIdentities === 0 ? 0 : round(evidenceCount / totalMoonIdentities),

      subsurfaceHabitabilityCandidates:
        subsurfaceHabitabilityCandidateCount,
      evidenceAndHabitabilityCandidates:
        evidenceAndHabitabilityCandidateCount,
      evidenceWithoutHabitabilityCandidate:
        evidenceWithoutHabitabilityCandidateCount,

      evidenceByComposition,
      totalByComposition,
      evidenceFractionByComposition: {
        ROCKY:
          totalByComposition.ROCKY === 0
            ? 0
            : round(evidenceByComposition.ROCKY / totalByComposition.ROCKY),
        MIXED_ROCK_ICE:
          totalByComposition.MIXED_ROCK_ICE === 0
            ? 0
            : round(
                evidenceByComposition.MIXED_ROCK_ICE /
                  totalByComposition.MIXED_ROCK_ICE,
              ),
        ICY:
          totalByComposition.ICY === 0
            ? 0
            : round(evidenceByComposition.ICY / totalByComposition.ICY),
      },

      waterRegimeCounts: regimeCounts,
      byHostType: byHostTypeObject,

      supportDiagnostics: {
        evidenceLowTidalHeatingBelow010: evidenceLowTidalHeating,
        evidenceVeryLowTidalHeatingBelow003: evidenceVeryLowTidalHeating,
        evidenceLowInternalHeatBelow020: evidenceLowInternalHeat,
        evidenceNearOceanThreshold035To045: evidenceNearOceanThreshold,
        evidenceNearEnergyThreshold020To030: evidenceNearEnergyThreshold,
      },

      evidenceDistributions: {
        oceanPotential: distribution(evidenceOceanPotential),
        waterInventory: distribution(evidenceWaterInventory),
        tidalHeating: distribution(evidenceTidalHeating),
        internalHeatRetention: distribution(evidenceInternalHeat),
        subsurfaceEnergySupport: distribution(evidenceEnergySupport),
        subsurfaceHabitability: distribution(evidenceHabitability),
        massEarth: distribution(evidenceMassEarth),
        radiusEarth: distribution(evidenceRadiusEarth),
        estimatedSurfaceTemperatureKelvin:
          distribution(evidenceSurfaceTemperatureKelvin),
      },

      nonEvidenceDistributions: {
        oceanPotential: distribution(nonEvidenceOceanPotential),
        waterInventory: distribution(nonEvidenceWaterInventory),
        tidalHeating: distribution(nonEvidenceTidalHeating),
        internalHeatRetention: distribution(nonEvidenceInternalHeat),
      },

      strongestEvidenceWorlds: evidenceWorlds.slice(0, 20),
      weakestSupportedEvidenceWorlds: [...evidenceWorlds]
        .sort(
          (left, right) =>
            left.subsurfaceEnergySupport - right.subsurfaceEnergySupport ||
            left.oceanPotential - right.oceanPotential,
        )
        .slice(0, 20),
    };

    console.log(
      '\nMOON_SUBSURFACE_OCEAN_V2_AUDIT_BEGIN\n' +
        JSON.stringify(summary, null, 2) +
        '\nMOON_SUBSURFACE_OCEAN_V2_AUDIT_END\n',
    );

    expect(relevantMoons + unmaterializedMoons)
      .toBe(totalMoonIdentities);

    expect(evidenceCount)
      .toBeLessThanOrEqual(relevantMoons);

    expect(evidenceAndHabitabilityCandidateCount)
      .toBeLessThanOrEqual(evidenceCount);

    /*
     * Evidence is a MoonWaterRegime property, not a claim that every such moon
     * is a habitability candidate. This keeps the audit from conflating the
     * 21.5 water-state threshold with the stricter 21.6 habitability route.
     */
    expect(
      evidenceAndHabitabilityCandidateCount +
        evidenceWithoutHabitabilityCandidateCount,
    ).toBe(evidenceCount);
  });
});
