import {
  PlanetaryFormationAnchor,
} from './planetary-formation-anchor';

import {
  PlanetaryFormationMaturityRegime,
} from './planetary-formation-maturity-regime';

import {
  PlanetarySystemFormationBlueprint,
} from './planetary-system-formation-blueprint';

import {
  ProtoplanetCompositionMixture,
} from './protoplanet-composition-mixture';

describe(
  'PlanetarySystemFormationBlueprint point 17.7',
  () => {
    it(
      'should preserve the complete formation lineage and freeze the phase-18 handoff anchors',
      () => {
        const anchors = [
          anchor(
            1,
            [
              1,
              2,
            ],
            0.8,
            1.5,
            1,
          ),
          anchor(
            2,
            [
              3,
            ],
            3.5,
            0.5,
            0,
          ),
        ];

        const blueprint =
          new PlanetarySystemFormationBlueprint(
            2,
            6,
            42,
            1,
            0.05,
            120,
            5_000,
            20,
            2,
            18,
            120,
            3,
            2,
            2,
            1,
            PlanetaryFormationMaturityRegime.DYNAMICALLY_REWORKED,
            anchors,
          );

        anchors.length =
          0;

        expect(
          blueprint.anchorCount,
        ).toBe(2);

        expect(
          blueprint.hasFormationAnchors,
        ).toBe(true);

        expect(
          blueprint.isDynamicallyReworked,
        ).toBe(true);

        expect(
          Object.isFrozen(
            blueprint.formationAnchors,
          ),
        ).toBe(true);

        expect(
          'planetCount' in blueprint,
        ).toBe(false);

        expect(
          'orbitalPeriods' in blueprint,
        ).toBe(false);
      },
    );

    it(
      'should support a disk that forms no candidate cores without inventing planets',
      () => {
        const blueprint =
          new PlanetarySystemFormationBlueprint(
            1,
            7,
            7,
            0.8,
            0.04,
            90,
            4_000,
            5,
            0,
            5,
            0,
            0,
            0,
            0,
            0,
            PlanetaryFormationMaturityRegime.NO_PLANET_FORMING_CORES,
            [],
          );

        expect(
          blueprint.hasFormationAnchors,
        ).toBe(false);

        expect(
          blueprint.hasStrongGasEnvelopeOpportunity,
        ).toBe(false);
      },
    );

    it(
      'should reject broken solid-reservoir accounting and duplicate lineage',
      () => {
        expect(
          () =>
            new PlanetarySystemFormationBlueprint(
              1,
              6,
              20,
              1,
              0.05,
              100,
              4_000,
              10,
              2,
              9,
              10,
              2,
              2,
              0,
              0,
              PlanetaryFormationMaturityRegime.SOLID_CORE_SYSTEM,
              [
                anchor(
                  1,
                  [
                    1,
                  ],
                  1,
                  1,
                  0,
                ),
                anchor(
                  2,
                  [
                    2,
                  ],
                  3,
                  1,
                  0,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new PlanetarySystemFormationBlueprint(
              1,
              6,
              20,
              1,
              0.05,
              100,
              4_000,
              10,
              2,
              8,
              10,
              2,
              2,
              0,
              0,
              PlanetaryFormationMaturityRegime.SOLID_CORE_SYSTEM,
              [
                anchor(
                  1,
                  [
                    1,
                  ],
                  1,
                  1,
                  0,
                ),
                anchor(
                  2,
                  [
                    1,
                  ],
                  3,
                  1,
                  0,
                ),
              ],
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function anchor(
  anchorOrdinal:
    number,

  sourceFormationOrdinals:
    readonly number[],

  assemblyRadiusAu:
    number,

  solidCoreMassEarth:
    number,

  collisionCount:
    number,
): PlanetaryFormationAnchor {

  return new PlanetaryFormationAnchor(
    anchorOrdinal,
    sourceFormationOrdinals,
    assemblyRadiusAu,
    solidCoreMassEarth,
    new ProtoplanetCompositionMixture(
      0,
      0.5,
      0.5,
      0,
    ),
    0.7,
    0.4,
    0.6,
    0.5,
    collisionCount,
  );
}
