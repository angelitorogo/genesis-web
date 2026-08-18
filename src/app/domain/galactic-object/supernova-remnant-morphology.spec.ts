import {
  SupernovaRemnantMorphology,
} from './supernova-remnant-morphology';

describe(
  'SupernovaRemnantMorphology',
  () => {
    it(
      'should expose exactly the three V1 persistent-remnant morphologies',
      () => {
        expect(
          Object.values(
            SupernovaRemnantMorphology,
          ),
        ).toEqual([
          'SHELL',
          'PLERION',
          'COMPOSITE',
        ]);
      },
    );

    it(
      'should keep the V1 morphology catalogue immutable',
      () => {
        expect(
          Object.isFrozen(
            SupernovaRemnantMorphology,
          ),
        ).toBe(true);
      },
    );
  },
);
