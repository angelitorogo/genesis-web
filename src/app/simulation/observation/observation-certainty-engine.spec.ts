import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationCertainty,
  ObservationCertaintyAssessment,
} from '../../domain/observation/observation-certainty';

import {
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationCertaintyCatalogV1,
} from './observation-certainty-catalog';

import {
  ObservationCertaintyEngine,
} from './observation-certainty-engine';

import {
  ObservationEngine,
} from './observation-engine';

describe(
  'ObservationCertaintyEngine',
  () => {
    const canonicalSeed =
      UniverseSeed.parse(
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      );

    const canonicalGenerationKey =
      new UniverseGenerationKey(
        canonicalSeed,
        GeneratorVersion.V1,
      );

    const canonicalObservatory =
      new Observatory(
        canonicalGenerationKey,
      );

    it(
      'should preserve the exact frozen V1 certainty catalog',
      () => {
        expect(
          ObservationCertaintyCatalogV1
            .supportedCertainties,
        ).toEqual([
          ObservationCertainty
            .CANDIDATE,
          ObservationCertainty
            .PROBABLE,
          ObservationCertainty
            .CONFIRMED,
        ]);

        expect(
          ObservationCertaintyCatalogV1
            .initialCertainty,
        ).toBe(
          ObservationCertainty
            .CANDIDATE,
        );

        expect(
          ObservationCertaintyCatalogV1
            .maximumCertainty,
        ).toBe(
          ObservationCertainty
            .CONFIRMED,
        );

        expect(
          Object.isFrozen(
            ObservationCertaintyCatalogV1
              .supportedCertainties,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should preserve next previous and distance mappings for all three stages',
      () => {
        expect(
          ObservationCertaintyCatalogV1
            .nextCertainty(
              ObservationCertainty
                .CANDIDATE,
            ),
        ).toBe(
          ObservationCertainty
            .PROBABLE,
        );

        expect(
          ObservationCertaintyCatalogV1
            .nextCertainty(
              ObservationCertainty
                .PROBABLE,
            ),
        ).toBe(
          ObservationCertainty
            .CONFIRMED,
        );

        expect(
          ObservationCertaintyCatalogV1
            .nextCertainty(
              ObservationCertainty
                .CONFIRMED,
            ),
        ).toBeNull();

        expect(
          ObservationCertaintyCatalogV1
            .previousCertainty(
              ObservationCertainty
                .CANDIDATE,
            ),
        ).toBeNull();

        expect(
          ObservationCertaintyCatalogV1
            .previousCertainty(
              ObservationCertainty
                .PROBABLE,
            ),
        ).toBe(
          ObservationCertainty
            .CANDIDATE,
        );

        expect(
          ObservationCertaintyCatalogV1
            .previousCertainty(
              ObservationCertainty
                .CONFIRMED,
            ),
        ).toBe(
          ObservationCertainty
            .PROBABLE,
        );

        expect(
          ObservationCertaintyCatalogV1
            .distanceInStages(
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .CONFIRMED,
            ),
        ).toBe(
          2,
        );

        expect(
          ObservationCertaintyCatalogV1
            .distanceInStages(
              ObservationCertainty
                .CONFIRMED,
              ObservationCertainty
                .CANDIDATE,
            ),
        ).toBe(
          -2,
        );
      },
    );

    it(
      'should create CANDIDATE as the initial assessment through both certainty and observation engines',
      () => {
        const direct =
          ObservationCertaintyEngine
            .createCandidate(
              canonicalGenerationKey,
            );

        const wrapped =
          ObservationEngine
            .initialObservationCertainty(
              canonicalObservatory,
            );

        expect(
          direct.certainty,
        ).toBe(
          ObservationCertainty
            .CANDIDATE,
        );

        expect(
          wrapped,
        ).toEqual(
          direct,
        );

        expect(
          wrapped.isCandidate,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should accept exactly the five valid transitions in the complete three by three matrix',
      () => {
        const validPairs:
          readonly [
            ObservationCertainty,
            ObservationCertainty,
          ][] =
          [
            [
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .CANDIDATE,
            ],
            [
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .PROBABLE,
            ],
            [
              ObservationCertainty
                .PROBABLE,
              ObservationCertainty
                .PROBABLE,
            ],
            [
              ObservationCertainty
                .PROBABLE,
              ObservationCertainty
                .CONFIRMED,
            ],
            [
              ObservationCertainty
                .CONFIRMED,
              ObservationCertainty
                .CONFIRMED,
            ],
          ];

        for (
          const [
            previous,
            next,
          ]
          of validPairs
        ) {
          const transition =
            ObservationCertaintyEngine
              .evaluateTransition(
                canonicalGenerationKey,
                previous,
                next,
              );

          expect(
            transition
              .previousCertainty,
          ).toBe(
            previous,
          );

          expect(
            transition
              .newCertainty,
          ).toBe(
            next,
          );

          expect(
            transition.didChange,
          ).toBe(
            previous !==
              next,
          );

          expect(
            transition.didAdvance,
          ).toBe(
            next.rank >
              previous.rank,
          );

          expect(
            transition.isIdempotent,
          ).toBe(
            previous ===
              next,
          );
        }
      },
    );

    it(
      'should reject the four invalid transitions in the complete three by three matrix',
      () => {
        const invalidPairs:
          readonly [
            ObservationCertainty,
            ObservationCertainty,
          ][] =
          [
            [
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .CONFIRMED,
            ],
            [
              ObservationCertainty
                .PROBABLE,
              ObservationCertainty
                .CANDIDATE,
            ],
            [
              ObservationCertainty
                .CONFIRMED,
              ObservationCertainty
                .CANDIDATE,
            ],
            [
              ObservationCertainty
                .CONFIRMED,
              ObservationCertainty
                .PROBABLE,
            ],
          ];

        for (
          const [
            previous,
            next,
          ]
          of invalidPairs
        ) {
          expect(
            () =>
              ObservationCertaintyEngine
                .evaluateTransition(
                  canonicalGenerationKey,
                  previous,
                  next,
                ),
          ).toThrow(
            RangeError,
          );
        }
      },
    );

    it(
      'should preserve the complete advance sequence CANDIDATE PROBABLE CONFIRMED CONFIRMED',
      () => {
        const candidate =
          ObservationCertaintyEngine
            .createCandidate(
              canonicalGenerationKey,
            );

        const probable =
          ObservationCertaintyEngine
            .advance(
              canonicalGenerationKey,
              candidate,
            );

        const confirmed =
          ObservationCertaintyEngine
            .advance(
              canonicalGenerationKey,
              probable,
            );

        const confirmedAgain =
          ObservationCertaintyEngine
            .advance(
              canonicalGenerationKey,
              confirmed,
            );

        expect(
          [
            candidate.certainty,
            probable.certainty,
            confirmed.certainty,
            confirmedAgain.certainty,
          ],
        ).toEqual([
          ObservationCertainty
            .CANDIDATE,
          ObservationCertainty
            .PROBABLE,
          ObservationCertainty
            .CONFIRMED,
          ObservationCertainty
            .CONFIRMED,
        ]);

        expect(
          confirmedAgain,
        ).toBe(
          confirmed,
        );
      },
    );

    it(
      'should delegate all three 8.5 wrappers from ObservationEngine without session or instrument input',
      () => {
        const candidate =
          ObservationEngine
            .initialObservationCertainty(
              canonicalObservatory,
            );

        const transition =
          ObservationEngine
            .evaluateObservationCertaintyTransition(
              canonicalObservatory,
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .PROBABLE,
            );

        const probable =
          ObservationEngine
            .advanceObservationCertainty(
              canonicalObservatory,
              candidate,
            );

        expect(
          transition.didAdvance,
        ).toBe(
          true,
        );

        expect(
          probable.certainty,
        ).toBe(
          ObservationCertainty
            .PROBABLE,
        );
      },
    );

    it(
      'should remain independent from instrument capability progression and DiscoveryState concepts',
      () => {
        const assessment =
          ObservationCertaintyEngine
            .createCandidate(
              canonicalGenerationKey,
            );

        const keys =
          Object.keys(
            assessment,
          );

        expect(
          keys,
        ).toEqual([
          'certainty',
        ]);

        for (
          const forbidden
          of [
            'targetLocator',
            'discoveryState',
            'instrumentType',
            'level',
            'normalizedSensitivity',
            'normalizedPrecision',
            'normalizedReach',
            'globalDiscoveryPoints',
            'probability',
            'confidence',
            'evidenceScore',
            'measurement',
            'uncertainty',
          ]
        ) {
          expect(
            keys,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should be deterministic for repeated transition evaluation and advancement',
      () => {
        const firstTransition =
          ObservationCertaintyEngine
            .evaluateTransition(
              canonicalGenerationKey,
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .PROBABLE,
            );

        const repeatedTransition =
          ObservationCertaintyEngine
            .evaluateTransition(
              canonicalGenerationKey,
              ObservationCertainty
                .CANDIDATE,
              ObservationCertainty
                .PROBABLE,
            );

        expect(
          repeatedTransition,
        ).toEqual(
          firstTransition,
        );

        const candidate =
          new ObservationCertaintyAssessment(
            ObservationCertainty
              .CANDIDATE,
          );

        expect(
          ObservationCertaintyEngine
            .advance(
              canonicalGenerationKey,
              candidate,
            ),
        ).toEqual(
          ObservationCertaintyEngine
            .advance(
              canonicalGenerationKey,
              candidate,
            ),
        );
      },
    );

    it(
      'should apply the same qualitative V1 machine across different universe seeds',
      () => {
        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const canonical =
          ObservationCertaintyEngine
            .advance(
              canonicalGenerationKey,
              ObservationCertaintyEngine
                .createCandidate(
                  canonicalGenerationKey,
                ),
            );

        const other =
          ObservationCertaintyEngine
            .advance(
              otherGenerationKey,
              ObservationCertaintyEngine
                .createCandidate(
                  otherGenerationKey,
                ),
            );

        expect(
          other.certainty,
        ).toBe(
          canonical.certainty,
        );

        expect(
          other.certainty,
        ).toBe(
          ObservationCertainty
            .PROBABLE,
        );
      },
    );

    it(
      'should reject unsupported generator versions and non-canonical runtime certainty values',
      () => {
        const unsupportedGenerationKey =
          {
            universeSeed:
              canonicalSeed,

            generatorVersion: {
              code:
                999,
            },
          } as unknown as
            UniverseGenerationKey;

        expect(
          () =>
            ObservationCertaintyEngine
              .createCandidate(
                unsupportedGenerationKey,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationEngine
              .initialObservationCertainty(
                new Observatory(
                  unsupportedGenerationKey,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        const invalid =
          {
            name:
              'PROBABLE',

            rank:
              2,
          } as unknown as
            ObservationCertainty;

        expect(
          () =>
            ObservationCertaintyEngine
              .evaluateTransition(
                canonicalGenerationKey,
                invalid,
                ObservationCertainty
                  .CONFIRMED,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationCertaintyCatalogV1
              .nextCertainty(
                invalid,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
