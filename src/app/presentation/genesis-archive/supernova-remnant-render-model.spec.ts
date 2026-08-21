import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  SupernovaRemnantRenderModelBuilder,
} from './supernova-remnant-render-model';

describe(
  'SupernovaRemnantRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      seed =
        'GENESIS-SNR-RENDER-V1',

      variant:
        string | null =
        'SHELL',
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.SUPERNOVA_REMNANT,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Remanente de supernova procedural de prueba',
        variant,
        scale:
          0.56,
        density:
          0.46,
        energy:
          0.80,
        concentration:
          0.58,
      });
    }

    it(
      'should accept the opaque DETECTED SHELL profile without exposing a scientific variant',
      () => {
        const model =
          SupernovaRemnantRenderModelBuilder
            .build(
              Object.freeze({
                ...descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .SIGNAL,
                  'SNR-OPAQUE-SHELL-SIGNAL',
                  null,
                ),
                kind:
                  ArchiveGalacticObjectRenderKind
                    .EXTREME_OBJECT,
                renderProfile:
                  ArchiveGalacticObjectRenderProfile
                    .SUPERNOVA_REMNANT_SHELL,
              }),
            );

        expect(
          model.scientificMorphology,
        ).toBe(
          'SHELL',
        );

        expect(
          model.shellVisibility,
        ).toBe(
          0.30,
        );

        expect(
          model.detailFactor,
        ).toBe(
          0.18,
        );
      },
    );

    it(
      'should preserve one seed-fixed remnant identity through all four knowledge levels',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              SupernovaRemnantRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    'SNR-SAME-OBJECT',
                    'SHELL',
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
                scientificMorphology:
                  current.scientificMorphology,
                orientationRadians:
                  current.orientationRadians,
                structureAspect:
                  current.structureAspect,
                apparentExtent:
                  current.apparentExtent,
                shellRadius:
                  current.shellRadius,
                shellThickness:
                  current.shellThickness,
                shellSharpness:
                  current.shellSharpness,
                filamentStrength:
                  current.filamentStrength,
                clumpiness:
                  current.clumpiness,
                fragmentation:
                  current.fragmentation,
                interiorGlow:
                  current.interiorGlow,
                haloStrength:
                  current.haloStrength,
                bilobedStrength:
                  current.bilobedStrength,
                asymmetryStrength:
                  current.asymmetryStrength,
                jetStrength:
                  current.jetStrength,
                centralEngineStrength:
                  current.centralEngineStrength,
                ringBreakup:
                  current.ringBreakup,
                shockContrast:
                  current.shockContrast,
                coreOffsetX:
                  current.coreOffsetX,
                coreOffsetY:
                  current.coreOffsetY,
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
      'should monotonically reveal shell, filaments, interior and chroma as knowledge improves',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              SupernovaRemnantRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    'SNR-KNOWLEDGE-STEPS',
                    'SHELL',
                  ),
                ),
          );

        expect(
          models.map(
            current => current.shellVisibility,
          ),
        ).toEqual([
          0.30,
          0.56,
          0.84,
          1,
        ]);

        expect(
          models.map(
            current => current.filamentVisibility,
          ),
        ).toEqual([
          0.10,
          0.36,
          0.74,
          1,
        ]);

        expect(
          models.map(
            current => current.interiorVisibility,
          ),
        ).toEqual([
          0.14,
          0.38,
          0.72,
          1,
        ]);

        expect(
          models.map(
            current => current.chromaGain,
          ),
        ).toEqual([
          0.32,
          0.56,
          0.84,
          1,
        ]);
      },
    );

    it(
      'should distribute eight shell families and several colour palettes across deterministic seeds',
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
              SupernovaRemnantRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
                    `SNR-SHELL-DIVERSITY-${index}`,
                    'SHELL',
                  ),
                ),
          );

        expect(
          new Set(
            models.map(
              current => current.morphologyFamily,
            ),
          ),
        ).toEqual(
          new Set([
            'FRACTURED_SHELL',
            'FILAMENT_RING',
            'BILOBED_SHELL',
            'KNOTTY_SHELL',
            'WISPY_ARC',
            'BUBBLE_SHELL',
            'OFFSET_SHELL',
            'SHOCK_COMPLEX',
          ]),
        );

        expect(
          new Set(
            models.map(
              current => current.paletteFamily,
            ),
          ).size,
        ).toBeGreaterThanOrEqual(
          6,
        );
      },
    );

    it(
      'should default unknown variants to shell during the shell-first laboratory phase',
      () => {
        const model =
          SupernovaRemnantRenderModelBuilder.build(
            descriptor(
              ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
              'SNR-SHELL-FIRST-DEFAULT',
              null,
            ),
          );

        expect(
          model.scientificMorphology,
        ).toBe(
          'SHELL',
        );
      },
    );

    it(
      'should keep shell, plerion and composite physical visual signatures separated',
      () => {
        const shell =
          SupernovaRemnantRenderModelBuilder.build(
            descriptor(
              ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
              'SNR-MORPHOLOGY-CHECK-1',
              'SHELL',
            ),
          );

        const plerion =
          SupernovaRemnantRenderModelBuilder.build(
            descriptor(
              ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
              'SNR-MORPHOLOGY-CHECK-2',
              'PLERION',
            ),
          );

        const composite =
          SupernovaRemnantRenderModelBuilder.build(
            descriptor(
              ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
              'SNR-MORPHOLOGY-CHECK-3',
              'COMPOSITE',
            ),
          );

        expect(
          shell.scientificMorphology,
        ).toBe(
          'SHELL',
        );

        expect(
          plerion.scientificMorphology,
        ).toBe(
          'PLERION',
        );

        expect(
          composite.scientificMorphology,
        ).toBe(
          'COMPOSITE',
        );

        expect(
          shell.interiorGlow,
        ).toBeLessThan(
          plerion.interiorGlow,
        );

        expect(
          shell.centralEngineStrength,
        ).toBeLessThan(
          plerion.centralEngineStrength,
        );

        expect(
          composite.shellRadius,
        ).toBeGreaterThan(
          0.30,
        );

        expect(
          composite.interiorGlow,
        ).toBeGreaterThan(
          shell.interiorGlow,
        );
      },
    );
  },
);
