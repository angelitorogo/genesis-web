import {
  GalacticObject,
} from '../../domain/galactic-object/galactic-object';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  GalaxySectorKeyCodec,
} from '../../domain/sector/galaxy-sector-key-codec';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticObjectGenerator,
} from './galactic-object-generator';

describe(
  'GalacticObjectGenerator',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    const canonicalSectorKey =
      123456789n;

    it(
      'should materialize the common point-12.1 model from a GalacticObjectLocator',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const object =
          GalacticObjectGenerator
            .generate(
              generationKey,
              locator,
            );

        expect(
          object,
        ).toBeInstanceOf(
          GalacticObject,
        );

        expect(
          object.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          object.locator,
        ).toBe(
          locator,
        );
      },
    );

    it(
      'should preserve the frozen V1 GalacticObjectLocator placement vector',
      () => {
        const object =
          GalacticObjectGenerator
            .generate(
              generationKey,
              new GalacticObjectLocator(
                0n,
                canonicalSectorKey,
                7n,
              ),
            );

        expect(
          object
            .location
            .sectorCoordinates,
        ).toEqual({
          x:
            0,

          y:
            123456789,
        });

        expect(
          object
            .location
            .normalizedX,
        ).toBe(
          0.300271924585104,
        );

        expect(
          object
            .location
            .normalizedY,
        ).toBe(
          0.19755980977788568,
        );
      },
    );

    it(
      'should regenerate exactly the same common object for the same procedural identity',
      () => {
        const locator =
          new GalacticObjectLocator(
            0n,
            canonicalSectorKey,
            7n,
          );

        const first =
          GalacticObjectGenerator
            .generate(
              generationKey,
              locator,
            );

        const second =
          GalacticObjectGenerator
            .generate(
              generationKey,
              locator,
            );

        expect(
          second.location,
        ).toEqual(
          first.location,
        );

        expect(
          second.galaxyIndex,
        ).toBe(
          first.galaxyIndex,
        );

        expect(
          second.galacticObjectIndex,
        ).toBe(
          first.galacticObjectIndex,
        );
      },
    );

    it(
      'should keep different GalacticObjectLocator indices procedurally independent',
      () => {
        const first =
          GalacticObjectGenerator
            .generate(
              generationKey,
              new GalacticObjectLocator(
                0n,
                canonicalSectorKey,
                7n,
              ),
            );

        const second =
          GalacticObjectGenerator
            .generate(
              generationKey,
              new GalacticObjectLocator(
                0n,
                canonicalSectorKey,
                8n,
              ),
            );

        expect(
          [
            second.location.normalizedX,
            second.location.normalizedY,
          ],
        ).not.toEqual([
          first.location.normalizedX,
          first.location.normalizedY,
        ]);
      },
    );

    it(
      'should preserve locator sector identity for arbitrary signed sector coordinates',
      () => {
        const sectorKey =
          GalaxySectorKeyCodec
            .encode({
              x:
                -72,

              y:
                91,
            });

        const object =
          GalacticObjectGenerator
            .generate(
              generationKey,
              new GalacticObjectLocator(
                4n,
                sectorKey,
                2n,
              ),
            );

        expect(
          object
            .location
            .sectorCoordinates,
        ).toEqual({
          x:
            -72,

          y:
            91,
        });

        expect(
          object.sectorKey,
        ).toBe(
          sectorKey,
        );
      },
    );
  },
);
