import {
  MinorBodyApproachTargetKind,
} from './minor-body-approach-target-kind';

describe(
  'MinorBodyApproachTargetKind point 23.3',
  () => {
    it(
      'should preserve stable PLANET/MOON codes and reject unknown codes',
      () => {
        expect(
          MinorBodyApproachTargetKind
            .fromCode(1),
        ).toBe(
          MinorBodyApproachTargetKind.PLANET,
        );

        expect(
          MinorBodyApproachTargetKind
            .fromCode(2),
        ).toBe(
          MinorBodyApproachTargetKind.MOON,
        );

        expect(
          MinorBodyApproachTargetKind
            .fromCodeOrNull(99),
        ).toBeNull();
      },
    );
  },
);
