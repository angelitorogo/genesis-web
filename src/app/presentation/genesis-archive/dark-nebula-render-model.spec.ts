import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  EmissionNebulaRenderModelBuilder,
} from './emission-nebula-render-model';

import {
  DarkNebulaRenderModelBuilder,
} from './dark-nebula-render-model';

describe(
  'DarkNebulaRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      variant:
        string | null =
        'DARK',

      seed =
        'GENESIS-DARK-NEBULA-V1',
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .NEBULA,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Nebulosa oscura de prueba',
        variant,
        scale:
          0.58,
        density:
          0.72,
        energy:
          0.18,
        concentration:
          0.11,
      });
    }

    it(
      'should preserve one structural identity through every knowledge level',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              DarkNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL ||
                      knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
                      ? null
                      : 'DARK',
                  ),
                ),
          );

        expect(
          new Set(
            models.map(
              model =>
                JSON.stringify({
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
                }),
            ),
          ).size,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should exactly preserve the generic high-fidelity nebula macro structure',
      () => {
        const generic =
          EmissionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .IDENTIFIED,
                null,
              ),
            );

        const dark =
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
                'DARK',
              ),
            );

        expect({
          structureSeedX:
            dark.structureSeedX,
          structureSeedY:
            dark.structureSeedY,
          orientationRadians:
            dark.orientationRadians,
          structureAspect:
            dark.structureAspect,
          macroScale:
            dark.macroScale,
          apparentExtent:
            dark.apparentExtent,
        }).toEqual({
          structureSeedX:
            generic.structureSeedX,
          structureSeedY:
            generic.structureSeedY,
          orientationRadians:
            generic.orientationRadians,
          structureAspect:
            generic.structureAspect,
          macroScale:
            generic.macroScale,
          apparentExtent:
            generic.apparentExtent,
        });
      },
    );

    it(
      'should reveal monotonically more dust microstructure without moving it',
      () => {
        const details =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              DarkNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL ||
                      knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
                      ? null
                      : 'DARK',
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
      'should not authorize the dark-nebula appearance while subtype is hidden',
      () => {
        expect(
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .IDENTIFIED,
                null,
              ),
            )
            .darkReveal,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should activate extinction rendering only after DARK is authorized',
      () => {
        expect(
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
                'DARK',
              ),
            )
            .darkReveal,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should produce different stable dark-cloud identities for different seeds',
      () => {
        const first =
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'DARK',
                'DARK-A',
              ),
            );

        const second =
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'DARK',
                'DARK-B',
              ),
            );

        expect([
          second.opacityBias,
          second.fragmentation,
          second.backgroundWarmth,
          second.backgroundBlueBias,
          second.edgeIllumination,
        ]).not.toEqual([
          first.opacityBias,
          first.fragmentation,
          first.backgroundWarmth,
          first.backgroundBlueBias,
          first.edgeIllumination,
        ]);
      },
    );

    it(
      'should keep dark-cloud identity stable when only knowledge changes',
      () => {
        const early =
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .SIGNAL,
                null,
              ),
            );

        const confirmed =
          DarkNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'DARK',
              ),
            );

        expect({
          opacityBias:
            confirmed.opacityBias,
          fragmentation:
            confirmed.fragmentation,
          backgroundWarmth:
            confirmed.backgroundWarmth,
          backgroundBlueBias:
            confirmed.backgroundBlueBias,
          edgeIllumination:
            confirmed.edgeIllumination,
        }).toEqual({
          opacityBias:
            early.opacityBias,
          fragmentation:
            early.fragmentation,
          backgroundWarmth:
            early.backgroundWarmth,
          backgroundBlueBias:
            early.backgroundBlueBias,
          edgeIllumination:
            early.edgeIllumination,
        });
      },
    );

    it(
      'should reject non-nebular and other specialized variants',
      () => {
        expect(
          () =>
            DarkNebulaRenderModelBuilder
              .build({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                ),
                kind:
                  ArchiveGalacticObjectRenderKind
                    .OPEN_CLUSTER,
              }),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            DarkNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  'REFLECTION',
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
