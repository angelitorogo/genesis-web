import {
  type GalacticObjectLocator,
  type SectorLocator,
  type SystemLocator,
} from '../generation/procedural-locator';

import {
  type UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  type SectorSeed,
} from '../seed/hierarchical-seeds';

import {
  type GalaxySectorCoordinates,
} from './galaxy-sector-coordinates';

import {
  GalaxySectorKeyCodec,
} from './galaxy-sector-key-codec';

import {
  type GalaxySectorStellarDensity,
} from './galaxy-sector-stellar-density';

/**
 * Pure regenerable Ground Truth for one requested galactic sector.
 *
 * GalaxySectorContent represents only the procedural content of the
 * addressed sector.
 *
 * It is not:
 *
 * - discovery state;
 * - observation state;
 * - persistence;
 * - a cache of the galaxy;
 * - a materialized collection of every sector.
 *
 * Child locators are deterministic procedural identities and remain ordered.
 */
export class GalaxySectorContent {

  readonly systemLocators:
    readonly SystemLocator[];

  readonly galacticObjectLocators:
    readonly GalacticObjectLocator[];

  constructor(
    readonly generationKey:
      UniverseGenerationKey,

    readonly locator:
      SectorLocator,

    readonly coordinates:
      GalaxySectorCoordinates,

    readonly seed:
      SectorSeed,

    readonly stellarDensity:
      GalaxySectorStellarDensity,

    systemLocators:
      readonly SystemLocator[],

    galacticObjectLocators:
      readonly GalacticObjectLocator[],
  ) {
    if (
      locator.sectorKey !==
      GalaxySectorKeyCodec.encode(
        coordinates,
      )
    ) {
      throw new RangeError(
        'Sector locator key must match sector coordinates.',
      );
    }

    if (
      systemLocators.some(
        (child) =>
          child.galaxyIndex !==
            locator.galaxyIndex ||
          child.sectorKey !==
            locator.sectorKey,
      )
    ) {
      throw new RangeError(
        'All system locators must belong to this sector.',
      );
    }

    if (
      galacticObjectLocators.some(
        (child) =>
          child.galaxyIndex !==
            locator.galaxyIndex ||
          child.sectorKey !==
            locator.sectorKey,
      )
    ) {
      throw new RangeError(
        'All galactic object locators must belong to this sector.',
      );
    }

    const systemKeys =
      systemLocators.map(
        (child) =>
          child.galacticObjectIndex,
      );

    if (
      new Set(
        systemKeys,
      ).size !==
      systemKeys.length
    ) {
      throw new RangeError(
        'GalaxySectorContent cannot contain duplicate system keys.',
      );
    }

    const galacticObjectKeys =
      galacticObjectLocators.map(
        (child) =>
          child.galacticObjectIndex,
      );

    if (
      new Set(
        galacticObjectKeys,
      ).size !==
      galacticObjectKeys.length
    ) {
      throw new RangeError(
        'GalaxySectorContent cannot contain duplicate galactic object keys.',
      );
    }

    this.systemLocators =
      Object.freeze([
        ...systemLocators,
      ]);

    this.galacticObjectLocators =
      Object.freeze([
        ...galacticObjectLocators,
      ]);
  }
}