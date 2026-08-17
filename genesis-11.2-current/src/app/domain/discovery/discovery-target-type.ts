import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../generation/procedural-locator';

const GALAXY =
  Object.freeze({
    name:
      'GALAXY',

    code:
      1,
  } as const);

const SECTOR =
  Object.freeze({
    name:
      'SECTOR',

    code:
      2,
  } as const);

const GALACTIC_OBJECT =
  Object.freeze({
    name:
      'GALACTIC_OBJECT',

    code:
      3,
  } as const);

const SYSTEM =
  Object.freeze({
    name:
      'SYSTEM',

    code:
      4,
  } as const);

const BODY =
  Object.freeze({
    name:
      'BODY',

    code:
      5,
  } as const);

const CIVILIZATION =
  Object.freeze({
    name:
      'CIVILIZATION',

    code:
      6,
  } as const);

export type DiscoveryTargetTypeValue =
  | typeof GALAXY
  | typeof SECTOR
  | typeof GALACTIC_OBJECT
  | typeof SYSTEM
  | typeof BODY
  | typeof CIVILIZATION;

export type DiscoveryTargetTypeCode =
  DiscoveryTargetTypeValue[
    'code'
  ];

const VALUES:
  readonly DiscoveryTargetTypeValue[] =
  Object.freeze([
    GALAXY,
    SECTOR,
    GALACTIC_OBJECT,
    SYSTEM,
    BODY,
    CIVILIZATION,
  ]);

export const DiscoveryTargetType =
  Object.freeze({
    GALAXY,

    SECTOR,

    GALACTIC_OBJECT,

    SYSTEM,

    BODY,

    CIVILIZATION,

    values:
      VALUES,

    fromCodeOrNull(
      code: number,
    ): DiscoveryTargetTypeValue | null {

      switch (
        code
      ) {
        case 1:
          return GALAXY;

        case 2:
          return SECTOR;

        case 3:
          return GALACTIC_OBJECT;

        case 4:
          return SYSTEM;

        case 5:
          return BODY;

        case 6:
          return CIVILIZATION;

        default:
          return null;
      }
    },

    fromCode(
      code: number,
    ): DiscoveryTargetTypeValue {

      const targetType =
        this.fromCodeOrNull(
          code,
        );

      if (
        targetType ===
        null
      ) {
        throw new RangeError(
          `Unknown DiscoveryTargetType code: ${code}`,
        );
      }

      return targetType;
    },

    fromLocator(
      locator:
        ProceduralLocator,
    ): DiscoveryTargetTypeValue {

      if (
        locator instanceof
        GalaxyLocator
      ) {
        return GALAXY;
      }

      if (
        locator instanceof
        SectorLocator
      ) {
        return SECTOR;
      }

      if (
        locator instanceof
        GalacticObjectLocator
      ) {
        return GALACTIC_OBJECT;
      }

      if (
        locator instanceof
        SystemLocator
      ) {
        return SYSTEM;
      }

      if (
        locator instanceof
        BodyLocator
      ) {
        return BODY;
      }

      if (
        locator instanceof
        CivilizationLocator
      ) {
        return CIVILIZATION;
      }

      throw new TypeError(
        'Unsupported ProceduralLocator.',
      );
    },
  });