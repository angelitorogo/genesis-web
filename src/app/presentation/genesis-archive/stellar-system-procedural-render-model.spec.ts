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
      },
    );
  },
);

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
