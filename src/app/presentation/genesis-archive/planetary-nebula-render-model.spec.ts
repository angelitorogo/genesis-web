import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  ArchiveGalacticObjectRenderProfile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';

import {
  EmissionNebulaRenderModelBuilder,
} from './emission-nebula-render-model';

import {
  PlanetaryNebulaRenderModelBuilder,
} from './planetary-nebula-render-model';

describe(
  'PlanetaryNebulaRenderModelBuilder',
  () => {
    function descriptor(
      knowledgeLevel:
        ArchiveGalacticObjectKnowledgeLevel,

      variant:
        string | null =
        'PLANETARY',

      seed =
        'GENESIS-PLANETARY-NEBULA-V1',

      renderProfile:
        ArchiveGalacticObjectRenderProfile | null =
        ArchiveGalacticObjectRenderProfile
          .PLANETARY_VOLUME,
    ): ArchiveGalacticObjectRenderDescriptor {

      return Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind
            .NEBULA,
        knowledgeLevel,
        seed,
        accessibleLabel:
          'Nebulosa planetaria de prueba',
        variant,
        renderProfile,
        scale:
          0.55,
        density:
          0.46,
        energy:
          0.78,
        concentration:
          0.69,
      });
    }

    it(
      'should preserve one macro and planetary morphology identity across all knowledge levels',
      () => {
        const models =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              PlanetaryNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL ||
                      knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
                      ? null
                      : 'PLANETARY',
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
                  shellRadius:
                    model.shellRadius,
                  shellThickness:
                    model.shellThickness,
                  ellipticity:
                    model.ellipticity,
                  bipolarity:
                    model.bipolarity,
                  lobeCount:
                    model.lobeCount,
                  lobeStrength:
                    model.lobeStrength,
                  shellPhase:
                    model.shellPhase,
                  inclinationRadians:
                    model.inclinationRadians,
                  depthStretch:
                    model.depthStretch,
                  expansionAsymmetry:
                    model.expansionAsymmetry,
                  turbulenceStrength:
                    model.turbulenceStrength,
                }),
            ),
          ).size,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should preserve the frozen generic-nebula outer footprint for the same seed',
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

        const planetary =
          PlanetaryNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
                'PLANETARY',
              ),
            );

        expect({
          structureSeedX:
            planetary.structureSeedX,
          structureSeedY:
            planetary.structureSeedY,
          orientationRadians:
            planetary.orientationRadians,
          structureAspect:
            planetary.structureAspect,
          macroScale:
            planetary.macroScale,
          apparentExtent:
            planetary.apparentExtent,
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
      'should reveal monotonically more detail without changing shell geometry',
      () => {
        const details =
          [
            ArchiveGalacticObjectKnowledgeLevel.SIGNAL,
            ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED,
            ArchiveGalacticObjectKnowledgeLevel.CATALOGUED,
            ArchiveGalacticObjectKnowledgeLevel.CONFIRMED,
          ].map(
            knowledgeLevel =>
              PlanetaryNebulaRenderModelBuilder
                .build(
                  descriptor(
                    knowledgeLevel,
                    knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.SIGNAL ||
                      knowledgeLevel ===
                        ArchiveGalacticObjectKnowledgeLevel.IDENTIFIED
                      ? null
                      : 'PLANETARY',
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
      'should keep the same planetary volume active while the subtype label remains restricted',
      () => {
        const early =
          PlanetaryNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .SIGNAL,
                null,
              ),
            );

        expect(
          early.planetaryReveal,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should not infer a planetary volume from variant null alone when no opaque render profile is present',
      () => {
        expect(
          PlanetaryNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .IDENTIFIED,
                null,
                'NO-PROFILE',
                null,
              ),
            )
            .planetaryReveal,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should activate the planetary shell appearance once PLANETARY is authorized',
      () => {
        expect(
          PlanetaryNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CATALOGUED,
                'PLANETARY',
              ),
            )
            .planetaryReveal,
        ).toBe(
          1,
        );
      },
    );

    it(
      'should constrain renderer-only morphology to safe ranges',
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
            PlanetaryNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  'PLANETARY',
                  `PLANETARY-RANGE-${index}`,
                ),
              );

          expect(
            current.shellRadius,
          ).toBeGreaterThanOrEqual(
            0.34,
          );

          expect(
            current.shellRadius,
          ).toBeLessThan(
            0.52,
          );

          expect(
            current.shellThickness,
          ).toBeGreaterThanOrEqual(
            0.05,
          );

          expect(
            current.shellThickness,
          ).toBeLessThan(
            0.11,
          );

          expect(
            current.ellipticity,
          ).toBeGreaterThanOrEqual(
            0.70,
          );

          expect(
            current.ellipticity,
          ).toBeLessThan(
            1.12,
          );

          expect(
            current.lobeCount,
          ).toBeGreaterThanOrEqual(
            2,
          );

          expect(
            current.lobeCount,
          ).toBeLessThanOrEqual(
            5,
          );

          expect(
            current.inclinationRadians,
          ).toBeGreaterThanOrEqual(
            -Math.PI *
              0.39,
          );

          expect(
            current.inclinationRadians,
          ).toBeLessThan(
            Math.PI *
              0.39,
          );

          expect(
            current.depthStretch,
          ).toBeGreaterThanOrEqual(
            0.68,
          );

          expect(
            current.depthStretch,
          ).toBeLessThan(
            1.40,
          );

          expect(
            current.expansionAsymmetry,
          ).toBeGreaterThanOrEqual(
            -0.23,
          );

          expect(
            current.expansionAsymmetry,
          ).toBeLessThan(
            0.23,
          );

          expect(
            current.turbulenceStrength,
          ).toBeGreaterThanOrEqual(
            0.72,
          );

          expect(
            current.turbulenceStrength,
          ).toBeLessThan(
            1.30,
          );
        }
      },
    );

    it(
      'should produce deterministic morphology and palette diversity across seeds',
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
              PlanetaryNebulaRenderModelBuilder
                .build(
                  descriptor(
                    ArchiveGalacticObjectKnowledgeLevel
                      .CONFIRMED,
                    'PLANETARY',
                    `PLANETARY-DIVERSITY-${index}`,
                  ),
                ),
          );

        expect(
          new Set(
            models.map(
              current =>
                [
                  current.shellRadius,
                  current.shellThickness,
                  current.ellipticity,
                  current.bipolarity,
                  current.lobeCount,
                  current.lobeStrength,
                  current.innerCoolShift,
                  current.middleMagentaShift,
                  current.outerWarmShift,
                  current.inclinationRadians,
                  current.depthStretch,
                  current.expansionAsymmetry,
                  current.turbulenceStrength,
                ]
                  .map(
                    value =>
                      Number(
                        value,
                      ).toFixed(
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
      'should keep morphology and chromatic identity stable when only knowledge changes',
      () => {
        const early =
          PlanetaryNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .SIGNAL,
                null,
              ),
            );

        const confirmed =
          PlanetaryNebulaRenderModelBuilder
            .build(
              descriptor(
                ArchiveGalacticObjectKnowledgeLevel
                  .CONFIRMED,
                'PLANETARY',
              ),
            );

        expect({
          shellRadius:
            confirmed.shellRadius,
          shellThickness:
            confirmed.shellThickness,
          ellipticity:
            confirmed.ellipticity,
          bipolarity:
            confirmed.bipolarity,
          lobeCount:
            confirmed.lobeCount,
          lobeStrength:
            confirmed.lobeStrength,
          shellPhase:
            confirmed.shellPhase,
          innerCoolShift:
            confirmed.innerCoolShift,
          middleMagentaShift:
            confirmed.middleMagentaShift,
          outerWarmShift:
            confirmed.outerWarmShift,
          centralStarHeat:
            confirmed.centralStarHeat,
          inclinationRadians:
            confirmed.inclinationRadians,
          depthStretch:
            confirmed.depthStretch,
          expansionAsymmetry:
            confirmed.expansionAsymmetry,
          turbulenceStrength:
            confirmed.turbulenceStrength,
        }).toEqual({
          shellRadius:
            early.shellRadius,
          shellThickness:
            early.shellThickness,
          ellipticity:
            early.ellipticity,
          bipolarity:
            early.bipolarity,
          lobeCount:
            early.lobeCount,
          lobeStrength:
            early.lobeStrength,
          shellPhase:
            early.shellPhase,
          innerCoolShift:
            early.innerCoolShift,
          middleMagentaShift:
            early.middleMagentaShift,
          outerWarmShift:
            early.outerWarmShift,
          centralStarHeat:
            early.centralStarHeat,
          inclinationRadians:
            early.inclinationRadians,
          depthStretch:
            early.depthStretch,
          expansionAsymmetry:
            early.expansionAsymmetry,
          turbulenceStrength:
            early.turbulenceStrength,
        });
      },
    );

    it(
      'should reject non-nebular and other specialized variants',
      () => {
        expect(
          () =>
            PlanetaryNebulaRenderModelBuilder
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
            PlanetaryNebulaRenderModelBuilder
              .build(
                descriptor(
                  ArchiveGalacticObjectKnowledgeLevel
                    .CONFIRMED,
                  'DARK',
                ),
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
