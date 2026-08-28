import {
  StellarSystemMultiplicity,
} from '../../domain/stellar/stellar-system-multiplicity';

import {
  ArchiveStellarSystemKnowledgeLevel,
  type ArchiveStellarSystemRenderDescriptor,
} from './archive-stellar-system-card';

import {
  StellarSystemProceduralRenderModelBuilder,
} from './stellar-system-procedural-render-model';

describe(
  'StellarSystemProceduralRenderModelBuilder point 16.7',
  () => {
    it(
      'should render DETECTED as one unresolved signal with no architecture leak',
      () => {
        const model =
          StellarSystemProceduralRenderModelBuilder
            .build({
              accessibleLabel:
                'Unresolved',
              knowledgeLevel:
                ArchiveStellarSystemKnowledgeLevel.DETECTED,
              multiplicity:
                null,
              components: [
                {
                  label:
                    'A',
                  colorHex:
                    '#68808D',
                  radiusScale:
                    1,
                  massSolar:
                    null,
                },
              ],
              innerOrbitEccentricity:
                null,
              outerOrbitEccentricity:
                null,
              stableHabitableZoneFraction:
                null,
              hasStableHabitableZone:
                false,
            });

        expect(model.unresolved).toBe(true);
        expect(model.components).toHaveLength(1);
        expect(model.orbits).toEqual([]);
        expect(model.habitableBand).toBeNull();
      },
    );

    it(
      'should derive external glow and diffraction for a resolved SINGLE without changing its one-component architecture',
      () => {
        const coolModel =
          StellarSystemProceduralRenderModelBuilder
            .build(
              singleDescriptor(
                '#FF8A32',
              ),
            );

        const hotModel =
          StellarSystemProceduralRenderModelBuilder
            .build(
              singleDescriptor(
                '#AFCBFF',
              ),
            );

        const cool =
          coolModel.components[0]!;

        const hot =
          hotModel.components[0]!;

        expect(coolModel.unresolved).toBe(false);
        expect(coolModel.components).toHaveLength(1);
        expect(coolModel.orbits).toEqual([]);
        expect(cool.x).toBe(50);
        expect(cool.y).toBe(50);

        expect(
          cool.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          cool.lightProfile.bloomRadius,
        );

        expect(
          cool.lightProfile.bloomRadius,
        ).toBeGreaterThan(
          cool.lightProfile.aureoleRadius,
        );

        expect(
          cool.lightProfile.aureoleRadius,
        ).toBeGreaterThan(
          cool.radius,
        );

        expect(
          cool.lightProfile.diffractionSoftLength,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionPrimaryLength,
        );

        expect(
          cool.lightProfile.diffractionPrimaryLength,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionSecondaryLength,
        );

        expect(
          cool.lightProfile.diffractionSecondaryLength,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionMicroLength,
        );

        expect(
          cool.lightProfile.diffractionMicroLength,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionShoulderLength,
        );

        expect(
          cool.lightProfile.diffractionPrimaryOpacity,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionSecondaryOpacity,
        );

        expect(
          cool.lightProfile.diffractionSecondaryOpacity,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionMicroOpacity,
        );

        expect(
          hot.lightProfile.diffractionPrimaryOpacity,
        ).toBeGreaterThan(
          cool.lightProfile.diffractionPrimaryOpacity,
        );

        expect(
          hot.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          cool.lightProfile.coronaRadius,
        );

        expect(
          cool.lightProfile.hasMicroDiffraction,
        ).toBe(false);

        expect(
          hot.lightProfile.hasMicroDiffraction,
        ).toBe(true);
      },
    );

    it(
      'should place the more massive binary primary closer to the barycentre and draw the frozen inner eccentricity',
      () => {
        const model =
          StellarSystemProceduralRenderModelBuilder
            .build(
              binaryDescriptor(),
            );

        const primary =
          model.components[0]!;
        const secondary =
          model.components[1]!;

        expect(model.unresolved).toBe(false);
        expect(model.orbits).toHaveLength(1);
        expect(model.orbits[0]?.kind).toBe('inner');

        expect(
          Math.abs(
            primary.x -
            model.barycentreX,
          ),
        ).toBeLessThan(
          Math.abs(
            secondary.x -
            model.barycentreX,
          ),
        );

        expect(model.habitableBand).not.toBeNull();

        expect(
          primary.radius,
        ).toBeGreaterThan(
          secondary.radius,
        );

        expect(
          primary.radius /
            secondary.radius,
        ).toBeGreaterThan(
          1.08,
        );

        expect(
          primary.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          primary.radius,
        );

        expect(
          secondary.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          secondary.radius,
        );

        expect(
          primary.lightProfile.diffractionPrimaryOpacity,
        ).toBeGreaterThan(
          primary.lightProfile.diffractionSecondaryOpacity,
        );

        expect(
          secondary.lightProfile.diffractionPrimaryOpacity,
        ).toBeGreaterThan(
          secondary.lightProfile.diffractionSecondaryOpacity,
        );

        const equivalentSingle =
          StellarSystemProceduralRenderModelBuilder
            .build({
              ...singleDescriptor(
                primary.colorHex,
              ),
              components: [
                binaryDescriptor().components[0]!,
              ],
            });

        expect(
          primary.lightProfile.coronaRadius,
        ).toBeLessThan(
          equivalentSingle.components[0]!.lightProfile.coronaRadius,
        );
      },
    );

    it(
      'should visibly preserve large A-B radius differences inside one binary without drawing them to literal scale',
      () => {
        const descriptor =
          binaryDescriptor();

        const model =
          StellarSystemProceduralRenderModelBuilder
            .build({
              ...descriptor,
              components: [
                {
                  ...descriptor.components[0]!,
                  radiusScale:
                    1.23,
                },
                {
                  ...descriptor.components[1]!,
                  radiusScale:
                    0.72,
                },
              ],
            });

        const primary =
          model.components[0]!;
        const secondary =
          model.components[1]!;

        expect(primary.radius).toBeGreaterThan(
          secondary.radius,
        );

        expect(
          primary.radius /
            secondary.radius,
        ).toBeGreaterThan(
          1.4,
        );

        expect(
          primary.radius /
            secondary.radius,
        ).toBeLessThan(
          1.7,
        );
      },
    );

    it(
      'should preserve the A-B inner pair in a TRIPLE and add C plus the separate outer orbit',
      () => {
        const descriptor:
          ArchiveStellarSystemRenderDescriptor = {
            ...binaryDescriptor(),
            multiplicity:
              StellarSystemMultiplicity.TRIPLE,
            components: [
              {
                label:
                  'A',
                colorHex:
                  '#FFF2CF',
                radiusScale:
                  1.1,
                massSolar:
                  1.2,
              },
              {
                label:
                  'B',
                colorHex:
                  '#FFD2A1',
                radiusScale:
                  0.95,
                massSolar:
                  0.7,
              },
              {
                label:
                  'C',
                colorHex:
                  '#FFAA75',
                radiusScale:
                  0.8,
                massSolar:
                  0.3,
              },
            ],
            outerOrbitEccentricity:
              0.55,
          };

        const model =
          StellarSystemProceduralRenderModelBuilder
            .build(
              descriptor,
            );

        expect(model.components.map(
          component => component.label,
        )).toEqual([
          'A',
          'B',
          'C',
        ]);

        expect(model.orbits.map(
          orbit => orbit.kind,
        )).toEqual([
          'outer',
          'inner',
        ]);

        expect(model.components[2]!.x).toBeGreaterThan(
          model.barycentreX,
        );

        const [
          primary,
          secondary,
          tertiary,
        ] =
          model.components;

        expect(
          primary!.radius,
        ).toBeGreaterThan(
          secondary!.radius,
        );

        expect(
          secondary!.radius,
        ).toBeGreaterThan(
          tertiary!.radius,
        );

        expect(
          primary!.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          primary!.radius,
        );

        expect(
          secondary!.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          secondary!.radius,
        );

        expect(
          tertiary!.lightProfile.coronaRadius,
        ).toBeGreaterThan(
          tertiary!.radius,
        );

        expect(
          primary!.lightProfile.diffractionPrimaryOpacity,
        ).toBeGreaterThan(
          primary!.lightProfile.diffractionSecondaryOpacity,
        );

        expect(
          tertiary!.lightProfile.diffractionPrimaryOpacity,
        ).toBeGreaterThan(
          tertiary!.lightProfile.diffractionSecondaryOpacity,
        );

        const binary =
          StellarSystemProceduralRenderModelBuilder
            .build(
              binaryDescriptor(),
            );

        expect(
          primary!.lightProfile.coronaRadius,
        ).toBeLessThan(
          binary.components[0]!.lightProfile.coronaRadius,
        );

        expect(
          secondary!.lightProfile.coronaRadius,
        ).toBeLessThan(
          binary.components[1]!.lightProfile.coronaRadius,
        );
      },
    );
  },
);

function singleDescriptor(
  colorHex:
    string,
): ArchiveStellarSystemRenderDescriptor {

  return {
    accessibleLabel:
      'Single',
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
    multiplicity:
      StellarSystemMultiplicity.SINGLE,
    components: [
      {
        label:
          'A',
        colorHex,
        radiusScale:
          1.08,
        massSolar:
          1.05,
      },
    ],
    innerOrbitEccentricity:
      null,
    outerOrbitEccentricity:
      null,
    stableHabitableZoneFraction:
      null,
    hasStableHabitableZone:
      false,
  };
}

function binaryDescriptor():
  ArchiveStellarSystemRenderDescriptor {

  return {
    accessibleLabel:
      'Binary',
    knowledgeLevel:
      ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
    multiplicity:
      StellarSystemMultiplicity.BINARY,
    components: [
      {
        label:
          'A',
        colorHex:
          '#FFF2CF',
        radiusScale:
          1.1,
        massSolar:
          1.2,
      },
      {
        label:
          'B',
        colorHex:
          '#FFD2A1',
        radiusScale:
          0.9,
        massSolar:
          0.6,
      },
    ],
    innerOrbitEccentricity:
      0.4,
    outerOrbitEccentricity:
      null,
    stableHabitableZoneFraction:
      0.65,
    hasStableHabitableZone:
      true,
  };
}
