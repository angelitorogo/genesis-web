import {
  buildSystemSceneMultistellarPresentationV4,
  SystemSceneHabitableZoneVisualRegimeV4,
  systemSceneHabitableZoneVisualRegimeV4,
} from './system-scene-multistellar-presentation';

describe(
  'SystemScene multistellar presentation V4',
  () => {

    it(
      'should shrink only BINARY photospheres enough to guarantee a visible periapsis gap while also shrinking optical radii gently',
      () => {

        const presentation =
          buildSystemSceneMultistellarPresentationV4(
            'BINARY',
            [
              {
                id: 'star-a',
                label: 'A',
                baseRadiusScene: 0.42,
                opticalRadiusScene: 0.42,
              },
              {
                id: 'star-b',
                label: 'B',
                baseRadiusScene: 0.38,
                opticalRadiusScene: 0.38,
              },
            ],
            0.62,
            null,
          );

        const a =
          presentation.stars.find(
            star => star.label === 'A',
          )!;
        const b =
          presentation.stars.find(
            star => star.label === 'B',
          )!;

        expect(
          a.radiusScene +
          b.radiusScene,
        ).toBeLessThanOrEqual(
          0.62 *
          0.58 +
          1e-12,
        );

        expect(
          presentation.innerPairMinimumPhotosphereGapScene,
        ).toBeGreaterThan(0);

        expect(
          a.opticalRadiusScene,
        ).toBeGreaterThan(
          a.radiusScene,
        );
        expect(
          b.opticalRadiusScene,
        ).toBeGreaterThan(
          b.radiusScene,
        );
        expect(
          a.opticalRadiusScene,
        ).toBeLessThan(0.42);
        expect(
          b.opticalRadiusScene,
        ).toBeLessThan(0.38);
        expect(
          presentation.limited,
        ).toBe(true);
      },
    );

    it(
      'should leave an already-separated BINARY pair unchanged',
      () => {

        const presentation =
          buildSystemSceneMultistellarPresentationV4(
            'BINARY',
            [
              {
                id: 'star-a',
                label: 'A',
                baseRadiusScene: 0.10,
                opticalRadiusScene: 0.26,
              },
              {
                id: 'star-b',
                label: 'B',
                baseRadiusScene: 0.08,
                opticalRadiusScene: 0.22,
              },
            ],
            0.80,
            null,
          );

        expect(
          presentation.stars.map(
            star => star.radiusScene,
          ),
        ).toEqual([
          0.10,
          0.08,
        ]);

        expect(
          presentation.limited,
        ).toBe(false);
      },
    );

    it(
      'should also guarantee tertiary clearance in a hierarchical TRIPLE while softly reducing optical glow',
      () => {

        const presentation =
          buildSystemSceneMultistellarPresentationV4(
            'TRIPLE',
            [
              {
                id: 'star-a',
                label: 'A',
                baseRadiusScene: 0.26,
                opticalRadiusScene: 0.34,
              },
              {
                id: 'star-b',
                label: 'B',
                baseRadiusScene: 0.24,
                opticalRadiusScene: 0.32,
              },
              {
                id: 'star-c',
                label: 'C',
                baseRadiusScene: 0.34,
                opticalRadiusScene: 0.48,
              },
            ],
            0.70,
            0.62,
          );

        const c =
          presentation.stars.find(
            star => star.label === 'C',
          )!;

        expect(
          presentation.tertiaryMinimumPhotosphereGapScene,
        ).not.toBeNull();
        expect(
          presentation.tertiaryMinimumPhotosphereGapScene!,
        ).toBeGreaterThan(0);
        expect(
          c.opticalRadiusScene,
        ).toBeGreaterThan(
          c.radiusScene,
        );
        expect(
          c.opticalRadiusScene,
        ).toBeLessThan(0.48);
      },
    );

    it(
      'should distinguish radiative-only, partial and fully stable circumbinary HZ presentation states',
      () => {

        expect(
          systemSceneHabitableZoneVisualRegimeV4(
            'CIRCUMBINARY',
            null,
            null,
            0,
          ),
        ).toBe(
          SystemSceneHabitableZoneVisualRegimeV4
            .CIRCUMBINARY_RADIATIVE_ONLY,
        );

        expect(
          systemSceneHabitableZoneVisualRegimeV4(
            'CIRCUMBINARY',
            1.4,
            1.8,
            0.43,
          ),
        ).toBe(
          SystemSceneHabitableZoneVisualRegimeV4
            .CIRCUMBINARY_PARTIALLY_STABLE,
        );

        expect(
          systemSceneHabitableZoneVisualRegimeV4(
            'CIRCUMBINARY',
            1.0,
            2.0,
            1,
          ),
        ).toBe(
          SystemSceneHabitableZoneVisualRegimeV4
            .CIRCUMBINARY_FULLY_STABLE,
        );

        expect(
          systemSceneHabitableZoneVisualRegimeV4(
            'CIRCUMSTELLAR',
            1.0,
            2.0,
            1,
          ),
        ).toBe(
          SystemSceneHabitableZoneVisualRegimeV4
            .CIRCUMSTELLAR,
        );


        expect(
          systemSceneHabitableZoneVisualRegimeV4(
            'CIRCUMBINARY',
            null,
            null,
            0,
            false,
          ),
        ).toBe(
          SystemSceneHabitableZoneVisualRegimeV4
            .CIRCUMBINARY_RADIATIVE_NOT_APPLICABLE,
        );
      },
    );
  },
);
