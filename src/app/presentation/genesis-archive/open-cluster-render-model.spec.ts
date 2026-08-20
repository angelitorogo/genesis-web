import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  OpenClusterRenderModelBuilder,
} from './open-cluster-render-model';

describe(
  'OpenClusterRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      seed =
        'GENESIS-OPEN-CLUSTER-RENDER-V1',

      kind:
        ArchiveGalacticObjectRenderKind =
        ArchiveGalacticObjectRenderKind
          .OPEN_CLUSTER,
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Cúmulo abierto procedural de prueba',
        variant:
          null,
        renderProfile:
          ArchiveGalacticObjectRenderProfile
            .OPEN_CLUSTER_FIELD,
        scale:
          0.52,
        density:
          0.58,
        energy:
          0.66,
        concentration:
          0.44,
      });
    }

    it(
      'should preserve one seed-fixed cluster identity through all four knowledge levels',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              OpenClusterRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    'OPEN-CLUSTER-SAME-OBJECT',
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL
                      ? ArchiveGalacticObjectRenderKind.STAR_CLUSTER
                      : ArchiveGalacticObjectRenderKind.OPEN_CLUSTER,
                  ),
                ),
          );

        const fingerprints =
          models.map(
            current =>
              JSON.stringify({
                structureSeedX:
                  current.structureSeedX,
                structureSeedY:
                  current.structureSeedY,
                morphologyIndex:
                  current.morphologyIndex,
                morphologyFamily:
                  current.morphologyFamily,
                paletteIndex:
                  current.paletteIndex,
                paletteFamily:
                  current.paletteFamily,
                orientationRadians:
                  current.orientationRadians,
                structureAspect:
                  current.structureAspect,
                apparentExtent:
                  current.apparentExtent,
                concentrationBias:
                  current.concentrationBias,
                subclusterStrength:
                  current.subclusterStrength,
                asymmetryStrength:
                  current.asymmetryStrength,
                elongationStrength:
                  current.elongationStrength,
                haloStrength:
                  current.haloStrength,
                chainStrength:
                  current.chainStrength,
                memberRichness:
                  current.memberRichness,
                brightMemberBias:
                  current.brightMemberBias,
                binaryHint:
                  current.binaryHint,
                hazeStrength:
                  current.hazeStrength,
                hotStarBias:
                  current.hotStarBias,
                warmStarBias:
                  current.warmStarBias,
                colorVariance:
                  current.colorVariance,
              }),
          );

        expect(
          new Set(
            fingerprints,
          ).size,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should monotonically resolve more members, faint stars and chroma as knowledge improves',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              OpenClusterRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                  ),
                ),
          );

        expect(
          models.map(
            current =>
              current.memberVisibility,
          ),
        ).toEqual([
          0.24,
          0.44,
          0.76,
          1,
        ]);

        expect(
          models.map(
            current =>
              current.faintMemberVisibility,
          ),
        ).toEqual([
          0.08,
          0.24,
          0.68,
          1,
        ]);

        expect(
          models.map(
            current =>
              current.chromaGain,
          ),
        ).toEqual([
          0.08,
          0.28,
          0.78,
          1,
        ]);
      },
    );

    it(
      'should distribute all eight morphology families and several stellar palettes across deterministic seeds',
      () => {
        const models =
          Array.from(
            {
              length:
                256,
            },
            (
              _,
              index,
            ) =>
              OpenClusterRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                    `OPEN-CLUSTER-DIVERSITY-${index}`,
                  ),
                ),
          );

        expect(
          new Set(
            models.map(
              current =>
                current.morphologyFamily,
            ),
          ),
        ).toEqual(
          new Set([
            'LOOSE',
            'COMPACT',
            'ELONGATED',
            'SUBCLUSTERED',
            'CHAIN',
            'ASYMMETRIC',
            'HALO',
            'MULTI_CORE',
          ]),
        );

        expect(
          new Set(
            models.map(
              current =>
                current.paletteFamily,
            ),
          ).size,
        ).toBeGreaterThanOrEqual(
          5,
        );

        expect(
          new Set(
            models.map(
              current =>
                [
                  current.morphologyFamily,
                  current.paletteFamily,
                  current.structureAspect.toFixed(3),
                  current.apparentExtent.toFixed(3),
                  current.memberRichness.toFixed(3),
                ].join('/'),
            ),
          ).size,
        ).toBeGreaterThan(
          72,
        );
      },
    );

    it(
      'should keep renderer parameters inside tighter open-cluster visual ranges',
      () => {
        for (
          let index =
            0;
          index <
            96;
          index +=
            1
        ) {
          const current =
            OpenClusterRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                  `OPEN-CLUSTER-RANGES-${index}`,
                ),
              );

          expect(
            current.structureAspect,
          ).toBeGreaterThanOrEqual(
            0.82,
          );

          expect(
            current.structureAspect,
          ).toBeLessThanOrEqual(
            1.48,
          );

          expect(
            current.apparentExtent,
          ).toBeGreaterThanOrEqual(
            0.58,
          );

          expect(
            current.apparentExtent,
          ).toBeLessThanOrEqual(
            1.02,
          );

          expect(
            current.memberRichness,
          ).toBeGreaterThanOrEqual(
            0.64,
          );

          expect(
            current.memberRichness,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            current.hazeStrength,
          ).toBeGreaterThanOrEqual(
            0.004,
          );

          expect(
            current.hazeStrength,
          ).toBeLessThanOrEqual(
            0.07,
          );

          expect(
            current.hotStarBias,
          ).toBeGreaterThanOrEqual(
            0.38,
          );

          expect(
            current.hotStarBias,
          ).toBeLessThanOrEqual(
            0.96,
          );

          expect(
            current.warmStarBias,
          ).toBeGreaterThanOrEqual(
            0.08,
          );

          expect(
            current.warmStarBias,
          ).toBeLessThanOrEqual(
            0.58,
          );

          expect(
            current.colorVariance,
          ).toBeGreaterThanOrEqual(
            0.38,
          );

          expect(
            current.colorVariance,
          ).toBeLessThanOrEqual(
            0.84,
          );
        }
      },
    );

    it(
      'should expose a deliberately wider V1.1 stellar colour mix across deterministic clusters',
      () => {
        const models =
          Array.from(
            {
              length:
                512,
            },
            (
              _,
              index,
            ) =>
              OpenClusterRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                    `OPEN-CLUSTER-COLOUR-V11-${index}`,
                  ),
                ),
          );

        expect(
          Math.max(
            ...models.map(
              current =>
                current.hotStarBias,
            ),
          ),
        ).toBeGreaterThan(
          0.90,
        );

        expect(
          Math.max(
            ...models.map(
              current =>
                current.warmStarBias,
            ),
          ),
        ).toBeGreaterThan(
          0.50,
        );

        expect(
          Math.max(
            ...models.map(
              current =>
                current.colorVariance,
            ),
          ),
        ).toBeGreaterThan(
          0.78,
        );
      },
    );

    it(
      'should not use physical descriptor values to move the seed-fixed star-field geometry or choose families',
      () => {
        const baseline =
          OpenClusterRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                'OPEN-CLUSTER-PHYSICAL-INDEPENDENCE',
              ),
            );

        const altered =
          OpenClusterRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                  'OPEN-CLUSTER-PHYSICAL-INDEPENDENCE',
                ),
                scale:
                  0.94,
                density:
                  0.08,
                energy:
                  0.04,
                concentration:
                  0.96,
              }),
            );

        expect({
          morphologyFamily:
            altered.morphologyFamily,
          paletteFamily:
            altered.paletteFamily,
          orientationRadians:
            altered.orientationRadians,
          structureAspect:
            altered.structureAspect,
          apparentExtent:
            altered.apparentExtent,
          subclusterStrength:
            altered.subclusterStrength,
          asymmetryStrength:
            altered.asymmetryStrength,
          elongationStrength:
            altered.elongationStrength,
          haloStrength:
            altered.haloStrength,
          chainStrength:
            altered.chainStrength,
          memberRichness:
            altered.memberRichness,
          brightMemberBias:
            altered.brightMemberBias,
          hazeStrength:
            altered.hazeStrength,
        }).toEqual({
          morphologyFamily:
            baseline.morphologyFamily,
          paletteFamily:
            baseline.paletteFamily,
          orientationRadians:
            baseline.orientationRadians,
          structureAspect:
            baseline.structureAspect,
          apparentExtent:
            baseline.apparentExtent,
          subclusterStrength:
            baseline.subclusterStrength,
          asymmetryStrength:
            baseline.asymmetryStrength,
          elongationStrength:
            baseline.elongationStrength,
          haloStrength:
            baseline.haloStrength,
          chainStrength:
            baseline.chainStrength,
          memberRichness:
            baseline.memberRichness,
          brightMemberBias:
            baseline.brightMemberBias,
          hazeStrength:
            baseline.hazeStrength,
        });
      },
    );

    it(
      'should accept the opaque early STAR_CLUSTER profile and the scientific OPEN_CLUSTER kind',
      () => {
        expect(
          OpenClusterRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
                'OPEN-CLUSTER-EARLY',
                ArchiveGalacticObjectRenderKind.STAR_CLUSTER,
              ),
            )
            .morphologyFamily,
        ).toBeTruthy();

        expect(
          OpenClusterRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                  'OPEN-CLUSTER-CONFIRMED',
                ),
                renderProfile:
                  null,
              }),
            )
            .morphologyFamily,
        ).toBeTruthy();
      },
    );

    it(
      'should reject unrelated renderer kinds',
      () => {
        expect(
          () =>
            OpenClusterRenderModelBuilder
              .build(
                Object.freeze({
                  ...descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                  ),
                  kind:
                    ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER,
                }),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
