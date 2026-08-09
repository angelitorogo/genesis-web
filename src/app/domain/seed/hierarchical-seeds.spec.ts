import {
  BodySeed,
  CivilizationSeed,
  EvolutionSeed,
  GalacticObjectSeed,
  GalaxySeed,
  HistorySeed,
  SectorSeed,
  SystemSeed,
} from './hierarchical-seeds';

describe(
  'Hierarchical procedural seeds',
  () => {
    const normalized =
      '8BA08585BCBD4D3041C1FD9EEBD048E4';

    const formatted =
      '8BA0-8585-BCBD-4D30-41C1-FD9E-EBD0-48E4';

    it(
      'should normalize and format all hierarchical seed types',
      () => {
        const seeds = [
          new GalaxySeed(
            normalized,
          ),
          new SectorSeed(
            normalized,
          ),
          new GalacticObjectSeed(
            normalized,
          ),
          new SystemSeed(
            normalized,
          ),
          new BodySeed(
            normalized,
          ),
          new HistorySeed(
            normalized,
          ),
          new EvolutionSeed(
            normalized,
          ),
          new CivilizationSeed(
            normalized,
          ),
        ];

        for (
          const seed
          of seeds
        ) {
          expect(
            seed.normalizedValue,
          ).toBe(
            normalized,
          );

          expect(
            seed.toString(),
          ).toBe(
            formatted,
          );
        }
      },
    );

    it(
      'should normalize lowercase and dashed values',
      () => {
        const seed =
          new GalaxySeed(
            formatted
              .toLowerCase(),
          );

        expect(
          seed.normalizedValue,
        ).toBe(
          normalized,
        );

        expect(
          seed.toString(),
        ).toBe(
          formatted,
        );
      },
    );

    it(
      'should compare seeds by normalized value',
      () => {
        const first =
          new GalaxySeed(
            normalized,
          );

        const second =
          new GalaxySeed(
            formatted,
          );

        const different =
          new GalaxySeed(
            '00000000000000000000000000000001',
          );

        expect(
          first.equals(
            second,
          ),
        ).toBe(true);

        expect(
          first.equals(
            different,
          ),
        ).toBe(false);
      },
    );

    it(
      'should reject malformed procedural seeds',
      () => {
        const invalid = [
          '',
          'GENESIS',
          '0000',
          'FFFFFFFF',
          '8BA08585BCBD4D3041C1FD9EEBD048EG',
          '8BA08585BCBD4D3041C1FD9EEBD048E400',
        ];

        for (
          const value
          of invalid
        ) {
          expect(
            () =>
              new GalaxySeed(
                value,
              ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );
  },
);