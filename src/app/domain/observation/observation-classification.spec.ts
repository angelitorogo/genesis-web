import {
  BodyLocator,
} from '../generation/procedural-locator';

import {
  GeneratorVersion,
} from '../generation/generator-version';

import {
  UniverseGenerationKey,
} from '../generation/universe-generation-key';

import {
  UniverseSeed,
} from '../universe/universe-seed';

import {
  LocatedObservationObject,
  ObservationClassification,
  ObservationClassificationAssessment,
  ObservationSubjectKind,
  ObservationTransientCandidate,
  ObservationTransientCandidateId,
} from './observation-classification';

describe(
  'ObservationClassification',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should preserve exactly OBJECT and TRANSIENT and validate signed-Long transient candidate ids',
      () => {
        expect(
          Object.values(
            ObservationSubjectKind,
          ),
        ).toEqual([
          ObservationSubjectKind
            .OBJECT,
          ObservationSubjectKind
            .TRANSIENT,
        ]);

        expect(
          new ObservationTransientCandidateId(
            0n,
          )
          .index,
        ).toBe(
          0n,
        );

        expect(
          new ObservationTransientCandidateId(
            9_223_372_036_854_775_807n,
          )
          .index,
        ).toBe(
          9_223_372_036_854_775_807n,
        );

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
      },
    );

    it(
      'should model a located object without inferring any physical classification from BodyLocator',
      () => {
        const locator =
          new BodyLocator(
            0n,
            10n,
            2n,
            4n,
          );

        const subject =
          new LocatedObservationObject(
            generationKey,
            locator,
          );

        expect(
          Object.keys(
            subject,
          ),
        ).toEqual([
          'generationKey',
          'targetLocator',
        ]);

        expect(
          subject.generationKey,
        ).toBe(
          generationKey,
        );

        expect(
          subject.targetLocator,
        ).toBe(
          locator,
        );

        expect(
          subject.kind,
        ).toBe(
          ObservationSubjectKind
            .OBJECT,
        );

        expect(
          Object.keys(
            subject,
          ),
        ).not.toContain(
          'classification',
        );
      },
    );

    it(
      'should model a transient candidate without locator coordinates timestamps or measurements',
      () => {
        const candidate =
          new ObservationTransientCandidate(
            generationKey,
            new ObservationTransientCandidateId(
              7n,
            ),
          );

        expect(
          Object.keys(
            candidate,
          ),
        ).toEqual([
          'generationKey',
          'candidateId',
        ]);

        expect(
          candidate.kind,
        ).toBe(
          ObservationSubjectKind
            .TRANSIENT,
        );

        expect(
          candidate.candidateId.index,
        ).toBe(
          7n,
        );

        for (
          const forbidden
          of [
            'targetLocator',
            'coordinates',
            'timestamp',
            'measurement',
            'spectrum',
            'period',
          ]
        ) {
          expect(
            Object.keys(
              candidate,
            ),
          ).not.toContain(
            forbidden,
          );
        }
      },
    );

    it(
      'should expose only the explicit Unclassified singleton and derive assessment context without other observation axes',
      () => {
        const subject =
          new LocatedObservationObject(
            generationKey,
            new BodyLocator(
              0n,
              10n,
              2n,
              4n,
            ),
          );

        const assessment =
          new ObservationClassificationAssessment(
            subject,
            ObservationClassification
              .Unclassified,
          );

        expect(
          Object.keys(
            ObservationClassification
              .Unclassified,
          ),
        ).toEqual(
          [],
        );

        expect(
          Object.keys(
            assessment,
          ),
        ).toEqual([
          'subject',
          'classification',
        ]);

        expect(
          assessment.generationKey,
        ).toBe(
          generationKey,
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

        for (
          const forbidden
          of [
            'discoveryState',
            'certainty',
            'uncertainty',
            'completeness',
            'measurement',
            'probability',
            'confidence',
          ]
        ) {
          expect(
            Object.keys(
              assessment,
            ),
          ).not.toContain(
            forbidden,
          );
        }

        expect(
          () =>
            new ObservationClassificationAssessment(
              subject,
              {} as
                ObservationClassification,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
