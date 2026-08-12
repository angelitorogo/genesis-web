import {
  DiscoveryTargetType,
} from '../../domain/discovery/discovery-target-type';

import {
  BodyLocator,
  CivilizationLocator,
  GalacticObjectLocator,
  GalaxyLocator,
  type ProceduralLocator,
  SectorLocator,
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  LocatedObservationObject,
  ObservationClassification,
  ObservationClassificationAssessment,
  ObservationSubjectKind,
  ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from '../../domain/observation/observation-classification';

import {
  Observatory,
} from '../../domain/observation/observatory';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  ObservationClassificationCatalogV1,
} from './observation-classification-catalog';

import {
  ObservationClassificationEngine,
} from './observation-classification-engine';

import {
  ObservationEngine,
} from './observation-engine';

describe(
  'ObservationClassificationEngine',
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
      'should preserve exactly two subject kinds one Unclassified classification and Unclassified as initial V1 classification',
      () => {
        expect(
          ObservationClassificationCatalogV1
            .supportedSubjectKinds,
        ).toEqual([
          ObservationSubjectKind
            .OBJECT,
          ObservationSubjectKind
            .TRANSIENT,
        ]);

        expect(
          ObservationClassificationCatalogV1
            .supportedClassifications,
        ).toEqual([
          ObservationClassification
            .Unclassified,
        ]);

        expect(
          ObservationClassificationCatalogV1
            .initialClassification,
        ).toBe(
          ObservationClassification
            .Unclassified,
        );

        expect(
          Object.isFrozen(
            ObservationClassificationCatalogV1
              .supportedSubjectKinds,
          ),
        ).toBe(
          true,
        );

        expect(
          Object.isFrozen(
            ObservationClassificationCatalogV1
              .supportedClassifications,
          ),
        ).toBe(
          true,
        );
      },
    );

    it(
      'should keep a BodyLocator-backed object explicitly Unclassified without inferring PLANET or any physical taxonomy',
      () => {
        const assessment =
          ObservationClassificationEngine
            .createUnclassifiedObject(
              canonicalGenerationKey,
              new BodyLocator(
                0n,
                10n,
                2n,
                4n,
              ),
            );

        expect(
          assessment.subjectKind,
        ).toBe(
          ObservationSubjectKind
            .OBJECT,
        );

        expect(
          assessment.classification,
        ).toBe(
          ObservationClassification
            .Unclassified,
        );

        expect(
          assessment.isUnclassified,
        ).toBe(
          true,
        );

        expect(
          assessment.subject,
        ).toBeInstanceOf(
          LocatedObservationObject,
        );

        expect(
          Object.keys(
            assessment,
          ),
        ).not.toContain(
          'planet',
        );
      },
    );

    it(
      'should support all six procedural locator classes without inferring classification from locator type',
      () => {
        const locators:
          readonly ProceduralLocator[] =
          [
            new GalaxyLocator(
              3n,
            ),

            new SectorLocator(
              3n,
              10n,
            ),

            new GalacticObjectLocator(
              3n,
              10n,
              1n,
            ),

            new SystemLocator(
              3n,
              10n,
              2n,
            ),

            new BodyLocator(
              3n,
              10n,
              2n,
              4n,
            ),

            new CivilizationLocator(
              3n,
              10n,
              2n,
              4n,
              1n,
            ),
          ];

        for (
          const locator
          of locators
        ) {
          const assessment =
            ObservationClassificationEngine
              .createUnclassifiedObject(
                canonicalGenerationKey,
                locator,
              );

          expect(
            assessment.subjectKind,
          ).toBe(
            ObservationSubjectKind
              .OBJECT,
          );

          expect(
            assessment.isUnclassified,
          ).toBe(
            true,
          );

          const subject =
            assessment.subject as
              LocatedObservationObject;

          expect(
            subject.targetLocator,
          ).toBe(
            locator,
          );
        }
      },
    );

    it(
      'should create transient candidate seven as Unclassified without any ProceduralLocator',
      () => {
        const assessment =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        expect(
          assessment.subjectKind,
        ).toBe(
          ObservationSubjectKind
            .TRANSIENT,
        );

        expect(
          assessment.classification,
        ).toBe(
          ObservationClassification
            .Unclassified,
        );

        const subject =
          assessment.subject as
            ObservationTransientCandidate;

        expect(
          subject.candidateId.index,
        ).toBe(
          7n,
        );

        expect(
          Object.keys(
            subject,
          ),
        ).not.toContain(
          'targetLocator',
        );
      },
    );

    it(
      'should preserve structural equality for the same transient candidate id in the same universe',
      () => {
        const first =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        const repeatedGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V1,
          );

        const second =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              repeatedGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );

    it(
      'should scope identical transient candidate ids by UniverseGenerationKey',
      () => {
        const first =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        const otherGenerationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B2',
            ),
            GeneratorVersion.V1,
          );

        const second =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              otherGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        expect(
          second,
        ).not.toEqual(
          first,
        );

        expect(
          second.generationKey,
        ).toBe(
          otherGenerationKey,
        );
      },
    );

    it(
      'should keep different transient candidate ids distinct inside the same universe',
      () => {
        const seven =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        const eight =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                8n,
              ),
            );

        expect(
          eight,
        ).not.toEqual(
          seven,
        );
      },
    );

    it(
      'should delegate both 8.9 wrappers from ObservationEngine without sessions or known discoveries',
      () => {
        const objectAssessment =
          ObservationEngine
            .unclassifiedObject(
              canonicalObservatory,
              new BodyLocator(
                0n,
                10n,
                2n,
                4n,
              ),
            );

        const transientAssessment =
          ObservationEngine
            .unclassifiedTransient(
              canonicalObservatory,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        expect(
          objectAssessment,
        ).toEqual(
          ObservationClassificationEngine
            .createUnclassifiedObject(
              canonicalGenerationKey,
              new BodyLocator(
                0n,
                10n,
                2n,
                4n,
              ),
            ),
        );

        expect(
          transientAssessment,
        ).toEqual(
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            ),
        );

        expect(
          ObservationEngine
            .unclassifiedObject
            .length,
        ).toBe(
          2,
        );

        expect(
          ObservationEngine
            .unclassifiedTransient
            .length,
        ).toBe(
          2,
        );
      },
    );

    it(
      'should keep Unclassified independent from DiscoveryState certainty uncertainty completeness and measurements',
      () => {
        const assessment =
          ObservationClassificationEngine
            .createUnclassifiedTransient(
              canonicalGenerationKey,
              new ObservationTransientCandidateId(
                7n,
              ),
            );

        const keys =
          Object.keys(
            assessment,
          );

        expect(
          keys,
        ).toEqual([
          'subject',
          'classification',
        ]);

        for (
          const forbidden
          of [
            'discoveryState',
            'certainty',
            'uncertainty',
            'completeness',
            'measurement',
            'instrumentType',
            'level',
            'globalDiscoveryPoints',
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
      'should introduce no physical taxonomy transient locator or DiscoveryTargetType TRANSIENT',
      () => {
        expect(
          ObservationClassificationCatalogV1
            .supportedClassifications
            .length,
        ).toBe(
          1,
        );

        expect(
          Object.keys(
            ObservationClassification,
          ),
        ).toEqual([
          'Unclassified',
        ]);

        expect(
          DiscoveryTargetType
            .values,
        ).toEqual([
          DiscoveryTargetType
            .GALAXY,
          DiscoveryTargetType
            .SECTOR,
          DiscoveryTargetType
            .GALACTIC_OBJECT,
          DiscoveryTargetType
            .SYSTEM,
          DiscoveryTargetType
            .BODY,
          DiscoveryTargetType
            .CIVILIZATION,
        ]);

        expect(
          'classify' in
            ObservationClassificationEngine,
        ).toBe(
          false,
        );

        expect(
          'TransientLocator' in
            ObservationClassificationEngine,
        ).toBe(
          false,
        );
      },
    );

    it(
      'should reject negative or overflowing candidate ids unsupported versions and noncanonical runtime subjects',
      () => {
        expect(
          () =>
            new ObservationTransientCandidateId(
              -1n,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationTransientCandidateId(
              9_223_372_036_854_775_808n,
            ),
        ).toThrow(
          RangeError,
        );

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
            ObservationClassificationEngine
              .createUnclassifiedObject(
                unsupportedGenerationKey,
                new GalaxyLocator(
                  0n,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            ObservationClassificationEngine
              .createUnclassifiedTransient(
                unsupportedGenerationKey,
                new ObservationTransientCandidateId(
                  7n,
                ),
              ),
        ).toThrow(
          RangeError,
        );

        const forgedSubject =
          {
            generationKey:
              canonicalGenerationKey,

            kind:
              ObservationSubjectKind
                .OBJECT,
          } as unknown as
            LocatedObservationObject;

        expect(
          () =>
            ObservationClassificationEngine
              .createUnclassified(
                forgedSubject,
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new ObservationClassificationAssessment(
              forgedSubject,
              ObservationClassification
                .Unclassified,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
