import {
  GalacticMapLayerId,
  INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
  withGalacticMapLayerVisibility,
} from './galactic-map-layer-state';

describe(
  'GalacticMapLayerState',
  () => {
    it(
      'should expose exactly the six roadmap-10.5 thematic layers',
      () => {
        expect(
          Object.values(
            GalacticMapLayerId,
          ),
        ).toEqual([
          'systems',
          'nebulae',
          'starClusters',
          'extremeObjects',
          'regions',
          'habitableZone',
        ]);
      },
    );

    it(
      'should start with every 10.5 thematic layer visible',
      () => {
        expect(
          INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
        ).toEqual({
          systems:
            true,
          nebulae:
            true,
          starClusters:
            true,
          extremeObjects:
            true,
          regions:
            true,
          habitableZone:
            true,
        });
      },
    );

    it(
      'should update one layer immutably without changing the others',
      () => {
        const next =
          withGalacticMapLayerVisibility(
            INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
            GalacticMapLayerId.NEBULAE,
            false,
          );

        expect(
          next.nebulae,
        ).toBe(
          false,
        );

        expect(
          next.systems,
        ).toBe(
          true,
        );

        expect(
          INITIAL_GALACTIC_MAP_LAYER_VISIBILITY
            .nebulae,
        ).toBe(
          true,
        );
      },
    );

    it(
      'should reject invented layer ids at runtime',
      () => {
        expect(
          () =>
            withGalacticMapLayerVisibility(
              INITIAL_GALACTIC_MAP_LAYER_VISIBILITY,
              'unknown' as
                GalacticMapLayerId,
              false,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
