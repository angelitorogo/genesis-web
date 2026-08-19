import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  EmissionNebulaRenderModelBuilder,
} from './emission-nebula-render-model';

describe(
  'EmissionNebulaRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      overrides:
        Partial<ArchiveGalacticObjectRenderDescriptor> = {},
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .NEBULA,
        knowledgeLevel,
        seed:
          'GENESIS-EMISSION-NEBULA-STRUCTURE-V1',
        accessibleLabel:
          'Nebulosa de emisión de prueba',
        variant:
          knowledgeLevel ===
              ArchiveGalacticObjectKnowledgeLevel
                .CATALOGUED ||
            knowledgeLevel ===
              ArchiveGalacticObjectKnowledgeLevel
                .CONFIRMED
            ? 'EMISSION'
            : null,
        scale:
          0.5,
        density:
          0.5,
        energy:
          0.5,
        concentration:
          0.5,
        ...overrides,
      });
    }

    it(
      'should preserve exactly the same structural identity through all four knowledge levels',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel
              .SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel
              .IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel
              .CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel
              .CONFIRMED,
          ].map(
            knowledgeLevel =>
              EmissionNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                      ArchiveGalacticObjectKnowledgeLevel
                        .CONFIRMED
                      ? {
                          scale:
                            0.84,
                          density:
                            0.71,
                          energy:
                            0.66,
                          concentration:
                            0.86,
                        }
                      : {},
                  ),
                ),
          );

        const structuralIdentity =
          models.map(
            model => ({
              structureSeedX:
                model.structureSeedX,
              structureSeedY:
                model.structureSeedY,
              orientationRadians:
                model.orientationRadians,
              structureAspect:
                model.structureAspect,
              macroScale:
                model.macroScale,
              apparentExtent:
                model.apparentExtent,
              paletteWarmShift:
                model.paletteWarmShift,
              paletteCoolShift:
                model.paletteCoolShift,
              paletteMagentaShift:
                model.paletteMagentaShift,
              paletteWarmCoolBalance:
                model.paletteWarmCoolBalance,
            }),
          );

        expect(
          new Set(
            structuralIdentity.map(
              identity =>
                JSON.stringify(
                  identity,
                ),
            ),
          ).size,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should reveal monotonically more of the same structure as knowledge increases',
      () => {
        const details =
          [
            ArchiveGalacticObjectKnowledgeLevel
              .SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel
              .IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel
              .CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel
              .CONFIRMED,
          ].map(
            knowledgeLevel =>
              EmissionNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                  ),
                )
                .detailFactor,
          );

        expect(
          details,
        ).toEqual([
          0.18,
          0.42,
          0.72,
          1,
        ]);
      },
    );

    it(
      'should keep generic SIGNAL and IDENTIFIED views free of the emission subtype flag',
      () => {
        for (
          const knowledgeLevel
          of [
            ArchiveGalacticObjectKnowledgeLevel
              .SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel
              .IDENTIFIED,
          ]
        ) {
          expect(
            EmissionNebulaRenderModelBuilder
              .build(
                descriptor(
                  knowledgeLevel,
                ),
              )
              .emissionReveal,
          ).toBe(
            0,
          );
        }
      },
    );

    it(
      'should enable the emission appearance only once EMISSION is authorized by the descriptor',
      () => {
        expect(
          EmissionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
              ),
            )
            .emissionReveal,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should change structural identity when and only when the render seed changes',
      () => {
        const first =
          EmissionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
              ),
            );

        const second =
          EmissionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                {
                  seed:
                    'GENESIS-EMISSION-NEBULA-STRUCTURE-V2',
                },
              ),
            );

        expect([
          second.structureSeedX,
          second.structureSeedY,
          second.orientationRadians,
          second.structureAspect,
          second.macroScale,
          second.apparentExtent,
          second.paletteWarmShift,
          second.paletteCoolShift,
          second.paletteMagentaShift,
          second.paletteWarmCoolBalance,
        ]).not.toEqual([
          first.structureSeedX,
          first.structureSeedY,
          first.orientationRadians,
          first.structureAspect,
          first.macroScale,
          first.apparentExtent,
          first.paletteWarmShift,
          first.paletteCoolShift,
          first.paletteMagentaShift,
          first.paletteWarmCoolBalance,
        ]);
      },
    );

    it(
      'should keep apparent size and palette stable even when later phases expose different physical descriptor values',
      () => {
        const early =
          EmissionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .SIGNAL,
                {
                  scale:
                    0.5,
                  density:
                    0.5,
                  energy:
                    0.5,
                  concentration:
                    0.5,
                },
              ),
            );

        const confirmed =
          EmissionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                {
                  scale:
                    0.93,
                  density:
                    0.17,
                  energy:
                    0.88,
                  concentration:
                    0.79,
                },
              ),
            );

        expect({
          apparentExtent:
            confirmed.apparentExtent,
          paletteWarmShift:
            confirmed.paletteWarmShift,
          paletteCoolShift:
            confirmed.paletteCoolShift,
          paletteMagentaShift:
            confirmed.paletteMagentaShift,
          paletteWarmCoolBalance:
            confirmed.paletteWarmCoolBalance,
        }).toEqual({
          apparentExtent:
            early.apparentExtent,
          paletteWarmShift:
            early.paletteWarmShift,
          paletteCoolShift:
            early.paletteCoolShift,
          paletteMagentaShift:
            early.paletteMagentaShift,
          paletteWarmCoolBalance:
            early.paletteWarmCoolBalance,
        });
      },
    );

    it(
      'should constrain seed-derived apparent size and palette controls to safe renderer ranges',
      () => {
        for (
          let index =
            0;
          index <
            128;
          index +=
            1
        ) {
          const current =
            EmissionNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  {
                    seed:
                      `GENESIS-EMISSION-DIVERSITY-${index}`,
                  },
                ),
              );

          expect(
            current.apparentExtent,
          ).toBeGreaterThanOrEqual(
            0.72,
          );

          expect(
            current.apparentExtent,
          ).toBeLessThan(
            1.20,
          );

          for (
            const value
            of [
              current.paletteWarmShift,
              current.paletteCoolShift,
              current.paletteMagentaShift,
              current.paletteWarmCoolBalance,
            ]
          ) {
            expect(
              value,
            ).toBeGreaterThanOrEqual(
              0,
            );

            expect(
              value,
            ).toBeLessThan(
              1,
            );
          }
        }
      },
    );

    it(
      'should produce visible procedural diversity in size and palette across a deterministic seed sample',
      () => {
        const models =
          Array.from(
            {
              length:
                32,
            },
            (
              _,
              index,
            ) =>
              EmissionNebulaRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel
                      .CONFIRMED,
                    {
                      seed:
                        `GENESIS-EMISSION-DIVERSITY-SAMPLE-${index}`,
                    },
                  ),
                ),
          );

        const extents =
          models.map(
            current =>
              current.apparentExtent,
          );

        expect(
          Math.max(
            ...extents,
          ) -
          Math.min(
            ...extents,
          ),
        ).toBeGreaterThan(
          0.25,
        );

        expect(
          new Set(
            models.map(
              current =>
                [
                  current.paletteWarmShift,
                  current.paletteCoolShift,
                  current.paletteMagentaShift,
                  current.paletteWarmCoolBalance,
                ]
                  .map(
                    value =>
                      value.toFixed(
                        3,
                      ),
                  )
                  .join(
                    '/',
                  ),
            ),
          ).size,
        ).toBeGreaterThan(
          24,
        );
      },
    );

    it(
      'should reject non-nebular and non-emission specialized descriptors explicitly',
      () => {
        expect(
          () =>
            EmissionNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  {
                    kind:
                      ArchiveGalacticObjectRenderKind
                        .OPEN_CLUSTER,
                  },
                ),
              ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            EmissionNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  {
                    variant:
                      'REFLECTION',
                  },
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
