import {
  ProtoplanetaryCondensationRegionKind,
} from './protoplanetary-condensation-region-kind';

describe(
  'ProtoplanetaryCondensationRegionKind point 17.3',
  () => {
    it(
      'should expose stable V1 codes from sublimated dust to volatile-rich solids',
      () => {
        expect(
          ProtoplanetaryCondensationRegionKind.values
            .map(
              value => [
                value.name,
                value.code,
                value.condensableSolidFraction01,
              ],
            ),
        ).toEqual([
          [
            'DUST_SUBLIMATION_ZONE',
            1,
            0,
          ],
          [
            'REFRACTORY_SOLIDS',
            2,
            0.18,
          ],
          [
            'ROCKY_SILICATE_SOLIDS',
            3,
            0.42,
          ],
          [
            'WATER_ICE_RICH_SOLIDS',
            4,
            0.72,
          ],
          [
            'CO2_ICE_RICH_SOLIDS',
            5,
            0.90,
          ],
          [
            'VOLATILE_ICE_RICH_SOLIDS',
            6,
            1,
          ],
        ]);
      },
    );

    it(
      'should increase the available condensed-solid reservoir monotonically outward in the V1 taxonomy',
      () => {
        const fractions =
          ProtoplanetaryCondensationRegionKind.values
            .map(
              value =>
                value.condensableSolidFraction01,
            );

        for (
          let index = 1;
          index < fractions.length;
          index += 1
        ) {
          expect(
            fractions[index],
          ).toBeGreaterThanOrEqual(
            fractions[index - 1],
          );
        }
      },
    );
  },
);
