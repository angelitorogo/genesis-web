import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  EmissionNebulaRenderModelBuilder,
} from './emission-nebula-render-model';

import {
  ReflectionNebulaRenderModelBuilder,
} from './reflection-nebula-render-model';

describe(
  'ReflectionNebulaRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      variant:
        string | null =
        'REFLECTION',

      seed =
        'GENESIS-REFLECTION-NEBULA-V1',
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .NEBULA,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Nebulosa de reflexión de prueba',
        variant,
        scale:
          0.57,
        density:
          0.48,
        energy:
          0.51,
        concentration:
          0.45,
      });
    }

    it(
      'should preserve the same structural identity at every knowledge level',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              ReflectionNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL ||
                      knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
                      ? null
                      : 'REFLECTION',
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
      'should exactly match the frozen generic emission renderer macro structure for the same seed',
      () => {
        const generic =
          descriptor(
            ArchiveGalacticObjectKnowledgeLevel
              .IDENTIFIED,
            null,
          );

        const reflection =
          descriptor(
            ArchiveGalacticObjectKnowledgeLevel
              .CATALOGUED,
            'REFLECTION',
          );

        const genericModel =
          EmissionNebulaRenderModelBuilder
            .build(
              generic,
            );

        const reflectionModel =
          ReflectionNebulaRenderModelBuilder
            .build(
              reflection,
            );

        expect({
          structureSeedX:
            reflectionModel.structureSeedX,
          structureSeedY:
            reflectionModel.structureSeedY,
          orientationRadians:
            reflectionModel.orientationRadians,
          structureAspect:
            reflectionModel.structureAspect,
          macroScale:
            reflectionModel.macroScale,
          apparentExtent:
            reflectionModel.apparentExtent,
        }).toEqual({
          structureSeedX:
            genericModel.structureSeedX,
          structureSeedY:
            genericModel.structureSeedY,
          orientationRadians:
            genericModel.orientationRadians,
          structureAspect:
            genericModel.structureAspect,
          macroScale:
            genericModel.macroScale,
          apparentExtent:
            genericModel.apparentExtent,
        });
      },
    );

    it(
      'should reveal monotonically more detail without moving the structure',
      () => {
        const details =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              ReflectionNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL ||
                      knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
                      ? null
                      : 'REFLECTION',
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
      'should keep reflection disabled while the subtype remains restricted',
      () => {
        expect(
          ReflectionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .IDENTIFIED,
                null,
              ),
            )
            .reflectionReveal,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should activate reflected-light appearance only for the authorized subtype',
      () => {
        expect(
          ReflectionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
                'REFLECTION',
              ),
            )
            .reflectionReveal,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should generate different stable illuminator identities for different seeds',
      () => {
        const first =
          ReflectionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'REFLECTION',
                'REFLECTION-A',
              ),
            );

        const second =
          ReflectionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'REFLECTION',
                'REFLECTION-B',
              ),
            );

        expect([
          second.illuminatorBlueMix,
          second.illuminatorWarmMix,
          second.illuminatorVioletMix,
          second.illuminatorBalance,
          second.dustScatteringStrength,
        ]).not.toEqual([
          first.illuminatorBlueMix,
          first.illuminatorWarmMix,
          first.illuminatorVioletMix,
          first.illuminatorBalance,
          first.dustScatteringStrength,
        ]);
      },
    );

    it(
      'should keep reflection palette identity stable when only knowledge changes',
      () => {
        const early =
          ReflectionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .SIGNAL,
                null,
              ),
            );

        const confirmed =
          ReflectionNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'REFLECTION',
              ),
            );

        expect({
          blue:
            confirmed.illuminatorBlueMix,
          warm:
            confirmed.illuminatorWarmMix,
          violet:
            confirmed.illuminatorVioletMix,
          balance:
            confirmed.illuminatorBalance,
          scattering:
            confirmed.dustScatteringStrength,
        }).toEqual({
          blue:
            early.illuminatorBlueMix,
          warm:
            early.illuminatorWarmMix,
          violet:
            early.illuminatorVioletMix,
          balance:
            early.illuminatorBalance,
          scattering:
            early.dustScatteringStrength,
        });
      },
    );

    it(
      'should reject non-nebular and other specialized nebular variants',
      () => {
        expect(
          () =>
            ReflectionNebulaRenderModelBuilder
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
            ReflectionNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  'EMISSION',
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
