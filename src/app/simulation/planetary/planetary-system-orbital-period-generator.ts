import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  PlanetaryOrbitalPeriod,
} from '../../domain/planetary/planetary-orbital-period';

import {
  type PlanetarySystemFormationBlueprint,
} from '../../domain/planetary/planetary-system-formation-blueprint';

import {
  PlanetarySystemOrbitalPeriodLayout,
} from '../../domain/planetary/planetary-system-orbital-period-layout';

import {
  type PlanetarySystemOrbitalLayout,
} from '../../domain/planetary/planetary-system-orbital-layout';

import {
  PlanetarySystemOrbitTopology,
} from '../../domain/planetary/planetary-system-orbit-topology';

import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';

const DAYS_PER_JULIAN_YEAR =
  365.25;

/**
 * Point-18.4 deterministic Keplerian-period materializer.
 *
 * No random draw and no additional seed are consumed. The already-frozen
 * point-18.3 semi-major axes are read verbatim. Circumstellar periods use the
 * point-17.7 central mass; P-type circumbinary periods use A+B because the
 * planets orbit the inner-pair barycentre. A tertiary companion is deliberately
 * excluded from that central two-body mass and remains a point-18.5 perturbing
 * stability constraint.
 *
 * Planet mass is not added in V1 because phase 19 has not yet generated the
 * final planetary mass budget. Periods therefore remain a host-dominated
 * Keplerian approximation, consistent with the precision of the current model.
 */
export class PlanetarySystemOrbitalPeriodGenerator {

  private constructor() {}

  static generate(
    generationKey:
      UniverseGenerationKey,

    stellarSystem:
      StellarSystem,

    formationBlueprint:
      PlanetarySystemFormationBlueprint,

    orbitalLayout:
      PlanetarySystemOrbitalLayout,
  ): PlanetarySystemOrbitalPeriodLayout {

    if (
      generationKey
        .generatorVersion !==
      GeneratorVersion.V1
    ) {
      throw new RangeError(
        `Unsupported GeneratorVersion: ${generationKey.generatorVersion.code}.`,
      );
    }

    if (
      !generationKey.equals(
        stellarSystem.generationKey,
      )
    ) {
      throw new RangeError(
        'PlanetarySystemOrbitalPeriodGenerator requires the host StellarSystem to share the supplied UniverseGenerationKey.',
      );
    }

    if (
      orbitalLayout.planetCount ===
      0
    ) {
      return new PlanetarySystemOrbitalPeriodLayout(
        stellarSystem.locator,
        orbitalLayout.orbitTopology,
        null,
        [],
      );
    }

    const gravitatingMassSolar =
      gravitatingMassSolarV1(
        stellarSystem,
        formationBlueprint,
        orbitalLayout.orbitTopology,
      );

    const periods =
      orbitalLayout
        .orbits
        .map(
          orbit => {
            const periodYears =
              keplerPeriodYearsV1(
                orbit.semiMajorAxisAu,
                gravitatingMassSolar,
              );

            return new PlanetaryOrbitalPeriod(
              orbit.planetOrdinal,
              orbit.bodyLocator,
              orbit.bodySeed,
              orbit.semiMajorAxisAu,
              gravitatingMassSolar,
              periodYears,
              periodYears *
                DAYS_PER_JULIAN_YEAR,
            );
          },
        );

    return new PlanetarySystemOrbitalPeriodLayout(
      stellarSystem.locator,
      orbitalLayout.orbitTopology,
      gravitatingMassSolar,
      periods,
    );
  }
}

function gravitatingMassSolarV1(
  stellarSystem:
    StellarSystem,

  formationBlueprint:
    PlanetarySystemFormationBlueprint,

  orbitTopology:
    PlanetarySystemOrbitTopology,
): number {

  const primaryMassSolar =
    formationBlueprint
      .centralMassSolar;

  if (
    orbitTopology ===
    PlanetarySystemOrbitTopology.CIRCUMSTELLAR
  ) {
    return primaryMassSolar;
  }

  const secondaryCompanion =
    stellarSystem
      .secondaryCompanion;

  if (
    secondaryCompanion ===
    null
  ) {
    throw new RangeError(
      'A non-empty CIRCUMBINARY point-18.4 layout requires stellar component B.',
    );
  }

  return (
    primaryMassSolar +
    secondaryCompanion
      .physicalProperties
      .initialMassSolar
  );
}

function keplerPeriodYearsV1(
  semiMajorAxisAu:
    number,

  gravitatingMassSolar:
    number,
): number {

  return Math.sqrt(
    semiMajorAxisAu **
      3 /
    gravitatingMassSolar,
  );
}
