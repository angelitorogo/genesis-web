import {
  NebulaType,
} from './nebula-type';

describe(
  'NebulaType',
  () => {
    it(
      'should expose exactly the four physical point-12.2 nebula subtypes',
      () => {
        expect(
          Object.values(
            NebulaType,
          ),
        ).toEqual([
          'EMISSION',
          'REFLECTION',
          'DARK',
          'PLANETARY',
        ]);
      },
    );

    it(
      'should keep the values immutable at runtime',
      () => {
        expect(
          Object.isFrozen(
            NebulaType,
          ),
        ).toBe(
          true,
        );
      },
    );
  },
);
