import {
  describe,
  expect,
  it,
} from 'vitest';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  GalacticObjectProceduralRenderModelBuilder,
} from './galactic-object-procedural-render-model';

describe(
  'GalacticObjectProceduralRenderModelBuilder',
  () => {
    function descriptor(
      overrides:
        Partial<ArchiveGalacticObjectRenderDescriptor> = {},
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.NEBULA,
        knowledgeLevel:
          ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
        seed:
          'GENESIS-12.8-VECTOR-A',
        accessibleLabel:
          'Render procedural de prueba',
        variant:
          null,
        scale:
          0.55,
        density:
          0.62,
        energy:
          0.58,
        concentration:
          0.5,
        ...overrides,
      });
    }

    it(
      'should generate exactly the same renderer-only primitives for the same descriptor',
      () => {
        const input =
          descriptor();

        expect(
          GalacticObjectProceduralRenderModelBuilder
            .build(
              input,
            ),
        ).toEqual(
          GalacticObjectProceduralRenderModelBuilder
            .build(
              input,
            ),
        );
      },
    );

    it(
      'should change the visual sample when only the renderer seed changes',
      () => {
        const first =
          GalacticObjectProceduralRenderModelBuilder
            .build(
              descriptor({
                seed:
                  'GENESIS-12.8-VECTOR-A',
              }),
            );

        const second =
          GalacticObjectProceduralRenderModelBuilder
            .build(
              descriptor({
                seed:
                  'GENESIS-12.8-VECTOR-B',
              }),
            );

        expect(
          first.stars,
        ).not.toEqual(
          second.stars,
        );
      },
    );

    it(
      'should keep a DETECTED extreme-object signal generic and free of morphology-specific core behavior',
      () => {
        const model =
          GalacticObjectProceduralRenderModelBuilder
            .build(
              descriptor({
                kind:
                  ArchiveGalacticObjectRenderKind.EXTREME_OBJECT,
                knowledgeLevel:
                  ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
                variant:
                  null,
              }),
            );

        expect(
          model.rings.length,
        ).toBe(
          3,
        );

        expect(
          model.coreRadius,
        ).toBe(
          8,
        );
      },
    );

    it(
      'should render a loose open cluster and a denser globular cluster as distinct deterministic structures',
      () => {
        const open =
          GalacticObjectProceduralRenderModelBuilder
            .build(
              descriptor({
                kind:
                  ArchiveGalacticObjectRenderKind.OPEN_CLUSTER,
                knowledgeLevel:
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                density:
                  0.8,
                concentration:
                  0.45,
              }),
            );

        const globular =
          GalacticObjectProceduralRenderModelBuilder
            .build(
              descriptor({
                kind:
                  ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER,
                knowledgeLevel:
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                density:
                  0.8,
                concentration:
                  0.9,
              }),
            );

        expect(
          globular.stars.length,
        ).toBeGreaterThan(
          open.stars.length,
        );

        expect(
          globular.coreRadius,
        ).toBeGreaterThan(
          open.coreRadius,
        );
      },
    );

    it(
      'should expose shell filaments plus a central plerionic core for a composite supernova remnant',
      () => {
        const model =
          GalacticObjectProceduralRenderModelBuilder
            .build(
              descriptor({
                kind:
                  ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT,
                knowledgeLevel:
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                variant:
                  'COMPOSITE',
                scale:
                  0.7,
                energy:
                  0.85,
              }),
            );

        expect(
          model.rings.length,
        ).toBeGreaterThanOrEqual(
          3,
        );

        expect(
          model.filaments.length,
        ).toBeGreaterThan(
          10,
        );

        expect(
          model.coreRadius,
        ).toBeGreaterThan(
          12,
        );
      },
    );

    it(
      'should keep every generated SVG primitive finite and inside the renderer contract',
      () => {
        const kinds =
          Object.values(
            ArchiveGalacticObjectRenderKind,
          );

        for (
          const kind
          of kinds
        ) {
          const model =
            GalacticObjectProceduralRenderModelBuilder
              .build(
                descriptor({
                  kind,
                  knowledgeLevel:
                    ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                  variant:
                    kind ===
                      ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT
                      ? 'SHELL'
                      : null,
                }),
              );

          for (
            const star
            of model.stars
          ) {
            expect(
              Number.isFinite(
                star.x,
              ),
            ).toBe(
              true,
            );

            expect(
              Number.isFinite(
                star.y,
              ),
            ).toBe(
              true,
            );

            expect(
              star.radius,
            ).toBeGreaterThan(
              0,
            );

            expect(
              star.opacity,
            ).toBeGreaterThanOrEqual(
              0,
            );

            expect(
              star.opacity,
            ).toBeLessThanOrEqual(
              1,
            );
          }

          for (
            const ring
            of model.rings
          ) {
            expect(
              ring.radiusX,
            ).toBeGreaterThan(
              0,
            );

            expect(
              ring.radiusY,
            ).toBeGreaterThan(
              0,
            );

            expect(
              Number.isFinite(
                ring.rotationDegrees,
              ),
            ).toBe(
              true,
            );
          }
        }
      },
    );

    it(
      'should reject non-normalized render parameters before generating SVG primitives',
      () => {
        expect(
          () =>
            GalacticObjectProceduralRenderModelBuilder
              .build(
                descriptor({
                  energy:
                    1.1,
                }),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
