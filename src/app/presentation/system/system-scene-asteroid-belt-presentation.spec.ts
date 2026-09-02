import {
  buildSystemSceneAsteroidBeltBandPresentationV1,
} from './system-scene-asteroid-belt-presentation';

describe(
  'system-scene asteroid belt presentation point 25.11',
  () => {
    it(
      'should preserve exact phase-22.2 AU limits while keeping the population band subtle',
      () => {
        const band =
          buildSystemSceneAsteroidBeltBandPresentationV1({
            region:
              'OUTER',
            innerEdgeAu:
              8.4,
            outerEdgeAu:
              46,
            peakAu:
              20.55572634155551,
            populationIndex01:
              0.72,
            innerRadiusScene:
              3.2,
            outerRadiusScene:
              5.8,
            peakRadiusScene:
              4.65,
          });

        expect(
          band.innerEdgeAu,
        ).toBe(
          8.4,
        );
        expect(
          band.outerEdgeAu,
        ).toBe(
          46,
        );
        expect(
          band.peakAu,
        ).toBe(
          20.55572634155551,
        );
        expect(
          band.opacity <
            0.10,
        ).toBe(true);
        expect(
          band.peakOpacity <
            0.16,
        ).toBe(true);
        expect(
          Object.isFrozen(
            band,
          ),
        ).toBe(true);
      },
    );

    it(
      'should make a denser frozen population slightly more visible without changing its limits',
      () => {
        const sparse =
          buildSystemSceneAsteroidBeltBandPresentationV1({
            region:
              'INNER',
            innerEdgeAu:
              0.30,
            outerEdgeAu:
              0.98,
            peakAu:
              0.52,
            populationIndex01:
              0.15,
            innerRadiusScene:
              0.9,
            outerRadiusScene:
              1.5,
            peakRadiusScene:
              1.1,
          });
        const dense =
          buildSystemSceneAsteroidBeltBandPresentationV1({
            region:
              'INNER',
            innerEdgeAu:
              0.30,
            outerEdgeAu:
              0.98,
            peakAu:
              0.52,
            populationIndex01:
              0.90,
            innerRadiusScene:
              0.9,
            outerRadiusScene:
              1.5,
            peakRadiusScene:
              1.1,
          });

        expect(
          dense.opacity >
            sparse.opacity,
        ).toBe(true);
        expect(
          dense.innerEdgeAu,
        ).toBe(
          sparse.innerEdgeAu,
        );
        expect(
          dense.outerEdgeAu,
        ).toBe(
          sparse.outerEdgeAu,
        );
      },
    );

    it(
      'should reject a visual projection that would reverse the frozen radial ordering',
      () => {
        expect(
          () =>
            buildSystemSceneAsteroidBeltBandPresentationV1({
              region:
                'OUTER',
              innerEdgeAu:
                10,
              outerEdgeAu:
                20,
              peakAu:
                15,
              populationIndex01:
                0.5,
              innerRadiusScene:
                4,
              outerRadiusScene:
                3,
              peakRadiusScene:
                3.5,
            }),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
