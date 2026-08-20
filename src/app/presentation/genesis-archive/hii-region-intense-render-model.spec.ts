import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  HiiRegionIntenseRenderModelBuilder,
} from './hii-region-intense-render-model';

describe(
  'HiiRegionIntenseRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      seed =
        'GENESIS-HII-INTENSE-RENDER-V1',

      variant:
        string | null =
        null,
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          knowledgeLevel ===
            ArchiveGalacticObjectKnowledgeLevel
              .SIGNAL
            ? ArchiveGalacticObjectRenderKind
                .NEBULA
            : ArchiveGalacticObjectRenderKind
                .HII_REGION,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Región H II INTENSE de prueba',
        variant,
        renderProfile:
          ArchiveGalacticObjectRenderProfile
            .HII_INTENSE_VOLUME,
        scale:
          0.52,
        density:
          0.48,
        energy:
          0.55,
        concentration:
          0.32,
      });
    }

    it(
      'should preserve one structural identity through all four knowledge levels',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              HiiRegionIntenseRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    'HII-INTENSE-SAME-OBJECT',
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.CONFIRMED
                      ? 'INTENSE'
                      : null,
                  ),
                ),
          );

        const structuralFingerprints =
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
                volumeDepth:
                  current.volumeDepth,
                turbulenceStrength:
                  current.turbulenceStrength,
                cavityStrength:
                  current.cavityStrength,
                pillarStrength:
                  current.pillarStrength,
                dustLaneStrength:
                  current.dustLaneStrength,
                shellStrength:
                  current.shellStrength,
                asymmetryStrength:
                  current.asymmetryStrength,
                lobeStrength:
                  current.lobeStrength,
                filamentDirection:
                  current.filamentDirection,
                cavityRadius:
                  current.cavityRadius,
                edgeSharpness:
                  current.edgeSharpness,
                morphologyNoiseScale:
                  current.morphologyNoiseScale,
                ionizingSources:
                  current.ionizingSources,
              }),
          );

        expect(
          new Set(
            structuralFingerprints,
          ).size,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should reveal monotonically more spatial detail and chroma',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              HiiRegionIntenseRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                  ),
                ),
          );

        expect(
          models.map(
            current =>
              current.detailFactor,
          ),
        ).toEqual([
          0.28,
          0.60,
          0.90,
          1,
        ]);

        expect(
          models.map(
            current =>
              current.chromaGain,
          ),
        ).toEqual([
          0.18,
          0.52,
          0.96,
          1.08,
        ]);

        expect(
          models[
            3
          ].microDetailGain,
        ).toBeGreaterThan(
          models[
            2
          ].microDetailGain,
        );
      },
    );

    it(
      'should keep INTENSE activity visually contained to eight to twelve dominant ionizing sources',
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
            HiiRegionIntenseRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  `HII-INTENSE-SOURCE-RANGE-${index}`,
                  'INTENSE',
                ),
              );

          expect(
            current.dominantIonizingSourceCount,
          ).toBeGreaterThanOrEqual(
            8,
          );

          expect(
            current.dominantIonizingSourceCount,
          ).toBeLessThanOrEqual(
            12,
          );

          expect(
            current.ionizingSources,
          ).toHaveLength(
            current.dominantIonizingSourceCount,
          );
        }
      },
    );

    it(
      'should distribute multiple morphology and palette families across deterministic seeds',
      () => {
        const models =
          Array.from(
            {
              length:
                128,
            },
            (
              _,
              index,
            ) =>
              HiiRegionIntenseRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel
                      .CONFIRMED,
                    `HII-INTENSE-DIVERSITY-${index}`,
                    'INTENSE',
                  ),
                ),
          );

        expect(
          new Set(
            models.map(
              current =>
                current.morphologyFamily,
            ),
          ).size,
        ).toBeGreaterThanOrEqual(
          6,
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
                  current.structureAspect.toFixed(
                    3,
                  ),
                  current.apparentExtent.toFixed(
                    3,
                  ),
                  current.cavityRadius.toFixed(
                    3,
                  ),
                ].join(
                  '/',
                ),
            ),
          ).size,
        ).toBeGreaterThan(
          48,
        );
      },
    );

    it(
      'should keep all structural and palette parameters inside frozen safe ranges',
      () => {
        const current =
          HiiRegionIntenseRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'HII-INTENSE-RANGES',
                'INTENSE',
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
          1.42,
        );

        expect(
          current.apparentExtent,
        ).toBeGreaterThanOrEqual(
          0.86,
        );

        expect(
          current.apparentExtent,
        ).toBeLessThanOrEqual(
          1.44,
        );

        expect(
          current.volumeDepth,
        ).toBeGreaterThanOrEqual(
          1.04,
        );

        expect(
          current.volumeDepth,
        ).toBeLessThanOrEqual(
          1.78,
        );

        expect(
          current.cavityRadius,
        ).toBeGreaterThanOrEqual(
          0.30,
        );

        expect(
          current.cavityRadius,
        ).toBeLessThanOrEqual(
          0.88,
        );

        expect(
          current.paletteAccent,
        ).toBeGreaterThanOrEqual(
          0.42,
        );

        expect(
          current.paletteAccent,
        ).toBeLessThanOrEqual(
          1.00,
        );
      },
    );

    it(
      'should not use physical descriptor values to move the seed-fixed geometry or family choice',
      () => {
        const baseline =
          HiiRegionIntenseRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
                'HII-INTENSE-PHYSICAL-INDEPENDENCE',
              ),
            );

        const altered =
          HiiRegionIntenseRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CATALOGUED,
                  'HII-INTENSE-PHYSICAL-INDEPENDENCE',
                ),
                scale:
                  0.91,
                density:
                  0.08,
                energy:
                  0.96,
                concentration:
                  0.04,
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
          volumeDepth:
            altered.volumeDepth,
          cavityRadius:
            altered.cavityRadius,
          ionizingSources:
            altered.ionizingSources,
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
          volumeDepth:
            baseline.volumeDepth,
          cavityRadius:
            baseline.cavityRadius,
          ionizingSources:
            baseline.ionizingSources,
        });
      },
    );

    it(
      'should accept a confirmed INTENSE descriptor even when only its scientific variant remains',
      () => {
        const current =
          HiiRegionIntenseRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  'HII-INTENSE-CONFIRMED-VARIANT',
                  'INTENSE',
                ),
                renderProfile:
                  null,
              }),
            );

        expect(
          current.detailFactor,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should reject H II activity variants that are not INTENSE',
      () => {
        expect(
          () =>
            HiiRegionIntenseRenderModelBuilder
              .build(
                Object.freeze({
                  ...descriptor(
                    ArchiveGalacticObjectKnowledgeLevel
                      .CONFIRMED,
                    'HII-MODERATE-REJECT',
                    'MODERATE',
                  ),
                  renderProfile:
                    null,
                }),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should reject unrelated renderer kinds',
      () => {
        expect(
          () =>
            HiiRegionIntenseRenderModelBuilder
              .build(
                Object.freeze({
                  ...descriptor(
                    ArchiveGalacticObjectKnowledgeLevel
                      .CATALOGUED,
                  ),
                  kind:
                    ArchiveGalacticObjectRenderKind
                      .OPEN_CLUSTER,
                }),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
