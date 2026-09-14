import {
  genesisRoutes,
} from '../../app.routes';

const PHASE_26_SCIENTIFIC_PATHS =
  Object.freeze([
    'galaxies/:galaxyIndex',
    'system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    'system/:galaxyIndex/:sectorKey/:galacticObjectIndex/planet/:bodyIndex',
    'system/:galaxyIndex/:sectorKey/:galacticObjectIndex/planet/:bodyIndex/moon/:moonIndex',
    'system/:galaxyIndex/:sectorKey/:galacticObjectIndex/minor-body/:minorBodyKind/:proceduralId',
    'archive/system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    'archive/galactic-object/:galaxyIndex/:sectorKey/:galacticObjectIndex',
    'observatory/system/:galaxyIndex/:sectorKey/:galacticObjectIndex',
  ] as const);

describe(
  'phase-26 stable scientific routes point 26.10',
  () => {
    it(
      'should preserve every public scientific route as an explicit stable path',
      () => {
        const actual =
          new Set(
            genesisRoutes
              .map(
                route =>
                  route.path ??
                  '',
              ),
          );

        for (
          const expected of
            PHASE_26_SCIENTIFIC_PATHS
        ) {
          expect(
            actual.has(
              expected,
            ),
          ).toBe(true);
        }
      },
    );

    it(
      'should never encode procedural Ground Truth inputs in route path parameters',
      () => {
        const serialized =
          PHASE_26_SCIENTIFIC_PATHS
            .join(
              '\n',
            )
            .toLowerCase();

        for (
          const forbidden of
            [
              'seed',
              'generationkey',
              'bodyseed',
              'moonseed',
              'systemseed',
              'mass',
              'radius',
              'temperature',
            ]
        ) {
          expect(
            serialized,
          ).not.toContain(
            forbidden,
          );
        }
      },
    );
  },
);
