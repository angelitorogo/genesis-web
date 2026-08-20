import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  GlobularClusterRenderModelBuilder,
} from './globular-cluster-render-model';

describe(
  'GlobularClusterRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,
      seed =
        'GENESIS-GLOBULAR-CLUSTER-RENDER-V1',
      kind:
        ArchiveGalacticObjectRenderKind =
        ArchiveGalacticObjectRenderKind
          .GLOBULAR_CLUSTER,
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Cúmulo globular procedural de prueba',
        variant:
          null,
        renderProfile:
          ArchiveGalacticObjectRenderProfile
            .GLOBULAR_CLUSTER_FIELD,
        scale:
          0.52,
        density:
          0.76,
        energy:
          0.34,
        concentration:
          0.82,
      });
    }

    it(
      'should preserve one seed-fixed globular identity through all four knowledge levels',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              GlobularClusterRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    'GLOBULAR-SAME-OBJECT',
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL
                      ? ArchiveGalacticObjectRenderKind.STAR_CLUSTER
                      : ArchiveGalacticObjectRenderKind.GLOBULAR_CLUSTER,
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
                coreRadius:
                  current.coreRadius,
                halfLightRadius:
                  current.halfLightRadius,
                tidalExtent:
                  current.tidalExtent,
                centralConcentration:
                  current.centralConcentration,
                haloFalloff:
                  current.haloFalloff,
                ellipticity:
                  current.ellipticity,
                asymmetryStrength:
                  current.asymmetryStrength,
                tidalStretch:
                  current.tidalStretch,
                granularCoreStrength:
                  current.granularCoreStrength,
                memberRichness:
                  current.memberRichness,
                brightGiantBias:
                  current.brightGiantBias,
                blueHorizontalBranchBias:
                  current.blueHorizontalBranchBias,
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
      'should monotonically resolve more members, faint stars, colour and optics as knowledge improves',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              GlobularClusterRenderModelBuilder
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
          0.22,
          0.44,
          0.78,
          1,
        ]);

        expect(
          models.map(
            current =>
              current.faintMemberVisibility,
          ),
        ).toEqual([
          0.06,
          0.22,
          0.70,
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
          0.80,
          1,
        ]);

        expect(
          models[3].opticalGain,
        ).toBeGreaterThan(
          models[2].opticalGain,
        );
      },
    );

    it(
      'should distribute all eight visual morphology families and several old-population palettes across deterministic seeds',
      () => {
        const models =
          Array.from(
            {
              length:
                384,
            },
            (
              _,
              index,
            ) =>
              GlobularClusterRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                    `GLOBULAR-DIVERSITY-${index}`,
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
            'CLASSIC',
            'CORE_COLLAPSED',
            'EXTENDED_HALO',
            'ELLIPTICAL',
            'TIDAL_STRETCHED',
            'ASYMMETRIC_HALO',
            'GRANULAR_CORE',
            'RICH_HALO',
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
                  current.coreRadius.toFixed(3),
                  current.halfLightRadius.toFixed(3),
                  current.memberRichness.toFixed(3),
                ].join('/'),
            ),
          ).size,
        ).toBeGreaterThan(
          96,
        );
      },
    );

    it(
      'should keep renderer parameters inside broadened V1.1 globular-cluster ranges',
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
            GlobularClusterRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                  `GLOBULAR-RANGES-${index}`,
                ),
              );

          expect(
            current.apparentExtent,
          ).toBeGreaterThanOrEqual(
            0.62,
          );

          expect(
            current.apparentExtent,
          ).toBeLessThanOrEqual(
            1.14,
          );

          expect(
            current.coreRadius,
          ).toBeGreaterThanOrEqual(
            0.075,
          );

          expect(
            current.coreRadius,
          ).toBeLessThanOrEqual(
            0.23,
          );

          expect(
            current.centralConcentration,
          ).toBeGreaterThanOrEqual(
            0.54,
          );

          expect(
            current.centralConcentration,
          ).toBeLessThanOrEqual(
            0.98,
          );

          expect(
            current.memberRichness,
          ).toBeGreaterThanOrEqual(
            0.72,
          );

          expect(
            current.memberRichness,
          ).toBeLessThanOrEqual(
            1,
          );

          expect(
            current.brightGiantBias,
          ).toBeGreaterThanOrEqual(
            0.30,
          );

          expect(
            current.brightGiantBias,
          ).toBeLessThanOrEqual(
            0.96,
          );

          expect(
            current.blueHorizontalBranchBias,
          ).toBeGreaterThanOrEqual(
            0.03,
          );

          expect(
            current.blueHorizontalBranchBias,
          ).toBeLessThanOrEqual(
            0.96,
          );

          expect(
            current.colorVariance,
          ).toBeGreaterThanOrEqual(
            0.40,
          );

          expect(
            current.colorVariance,
          ).toBeLessThanOrEqual(
            0.92,
          );
        }
      },
    );

    it(
      'should expose strongly separated V1.1 population colour biases and apparent scales',
      () => {
        const models =
          Array.from(
            {
              length:
                768,
            },
            (
              _,
              index,
            ) =>
              GlobularClusterRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                    `GLOBULAR-V11-POPULATION-${index}`,
                  ),
                ),
          );

        expect(
          Math.max(
            ...models.map(
              current =>
                current.brightGiantBias,
            ),
          ),
        ).toBeGreaterThan(
          0.92,
        );

        expect(
          Math.max(
            ...models.map(
              current =>
                current.blueHorizontalBranchBias,
            ),
          ),
        ).toBeGreaterThan(
          0.90,
        );

        expect(
          Math.max(
            ...models.map(
              current =>
                current.apparentExtent,
            ),
          ) -
          Math.min(
            ...models.map(
              current =>
                current.apparentExtent,
            ),
          ),
        ).toBeGreaterThan(
          0.42,
        );
      },
    );

    it(
      'should not use physical descriptor values to move seed-fixed geometry or choose visual families',
      () => {
        const baseline =
          GlobularClusterRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                'GLOBULAR-PHYSICAL-INDEPENDENCE',
              ),
            );

        const altered =
          GlobularClusterRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                  'GLOBULAR-PHYSICAL-INDEPENDENCE',
                ),
                scale:
                  0.96,
                density:
                  0.08,
                energy:
                  0.92,
                concentration:
                  0.12,
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
          coreRadius:
            altered.coreRadius,
          halfLightRadius:
            altered.halfLightRadius,
          tidalExtent:
            altered.tidalExtent,
          centralConcentration:
            altered.centralConcentration,
          haloFalloff:
            altered.haloFalloff,
          ellipticity:
            altered.ellipticity,
          asymmetryStrength:
            altered.asymmetryStrength,
          tidalStretch:
            altered.tidalStretch,
          memberRichness:
            altered.memberRichness,
          brightGiantBias:
            altered.brightGiantBias,
          blueHorizontalBranchBias:
            altered.blueHorizontalBranchBias,
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
          coreRadius:
            baseline.coreRadius,
          halfLightRadius:
            baseline.halfLightRadius,
          tidalExtent:
            baseline.tidalExtent,
          centralConcentration:
            baseline.centralConcentration,
          haloFalloff:
            baseline.haloFalloff,
          ellipticity:
            baseline.ellipticity,
          asymmetryStrength:
            baseline.asymmetryStrength,
          tidalStretch:
            baseline.tidalStretch,
          memberRichness:
            baseline.memberRichness,
          brightGiantBias:
            baseline.brightGiantBias,
          blueHorizontalBranchBias:
            baseline.blueHorizontalBranchBias,
        });
      },
    );

    it(
      'should accept the opaque early STAR_CLUSTER profile and the scientific GLOBULAR_CLUSTER kind',
      () => {
        expect(
          GlobularClusterRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
                'GLOBULAR-EARLY',
                ArchiveGalacticObjectRenderKind.STAR_CLUSTER,
              ),
            )
            .morphologyFamily,
        ).toBeTruthy();

        expect(
          GlobularClusterRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                  'GLOBULAR-CONFIRMED',
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
            GlobularClusterRenderModelBuilder
              .build(
                Object.freeze({
                  ...descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
                  ),
                  kind:
                    ArchiveGalacticObjectRenderKind.OPEN_CLUSTER,
                }),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
