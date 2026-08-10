import {
  GalaxyDesignation,
} from './galaxy-designation';

describe(
  'GalaxyDesignation',
  () => {
    it(
      'should preserve its name and procedural code exactly',
      () => {
        const designation =
          new GalaxyDesignation(
            'Caeloria',
            'GEN-V1-G0-8BA08585BCBD4D3041C1FD9EEBD048E4',
          );

        expect(
          designation.name,
        ).toBe(
          'Caeloria',
        );

        expect(
          designation.proceduralCode,
        ).toBe(
          'GEN-V1-G0-8BA08585BCBD4D3041C1FD9EEBD048E4',
        );
      },
    );
  },
);