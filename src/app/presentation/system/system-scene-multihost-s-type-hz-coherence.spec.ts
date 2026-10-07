import {
  systemSceneClipMultihostSTypeHabitableZone,
  systemSceneMultihostSTypeStableOuterAu,
} from './system-scene-multihost-s-type-hz-coherence';

import {
  type SystemSceneHabitableZoneSnapshot,
} from './system-scene-snapshot';

function zone(
  radiativeInnerEdgeAu:
    number,

  radiativeOuterEdgeAu:
    number,
): SystemSceneHabitableZoneSnapshot {

  return Object.freeze({
    topology:
      'CIRCUMSTELLAR',
    radiativeReferenceApplicable:
      true,
    radiativeReferenceRegime:
      'V1_HOST_ONLY_REFERENCE',
    radiativeInnerEdgeAu,
    radiativeOuterEdgeAu,
    dynamicallyHabitableInnerEdgeAu:
      radiativeInnerEdgeAu,
    dynamicallyHabitableOuterEdgeAu:
      radiativeOuterEdgeAu,
    radiativeInnerRadiusScene:
      1,
    radiativeOuterRadiusScene:
      2,
    dynamicallyHabitableInnerRadiusScene:
      1,
    dynamicallyHabitableOuterRadiusScene:
      2,
    presentationAdjusted:
      false,
    dynamicalOverlapFraction01:
      1,
    anchorMotionContributions:
      Object.freeze([]),
  });
}

describe(
  '29.1E-f.2 multihost S-type HZ coherence',
  () => {
    it(
      'removes the false Jiovara A/B S-type dynamic HZ while preserving the huge radiative references',
      () => {
        const hierarchy = {
          massA:
            0.6276,
          massB:
            91.8632,
          massC:
            null,
          innerBinaryAxisAu:
            3.9235,
          innerBinaryEccentricity:
            0.12,
          outerBinaryAxisAu:
            null,
          outerBinaryEccentricity:
            null,
        } as const;

        const stableA =
          systemSceneMultihostSTypeStableOuterAu({
            ...hierarchy,
            hostId:
              'A',
          });

        const stableB =
          systemSceneMultihostSTypeStableOuterAu({
            ...hierarchy,
            hostId:
              'B',
          });

        expect(stableA).toBeCloseTo(0.29830, 4);
        expect(stableB).toBeCloseTo(1.44739, 4);

        const a =
          systemSceneClipMultihostSTypeHabitableZone(
            zone(0.37, 0.65),
            stableA,
          );

        const b =
          systemSceneClipMultihostSTypeHabitableZone(
            zone(531.5, 937.3),
            stableB,
          );

        expect(a.dynamicallyHabitableInnerEdgeAu).toBeNull();
        expect(a.dynamicallyHabitableOuterEdgeAu).toBeNull();
        expect(a.dynamicalOverlapFraction01).toBe(0);
        expect(b.dynamicallyHabitableInnerEdgeAu).toBeNull();
        expect(b.dynamicallyHabitableOuterEdgeAu).toBeNull();
        expect(b.dynamicalOverlapFraction01).toBe(0);
      },
    );

    it(
      'clips a partial overlap instead of altering the radiative reference',
      () => {
        const source =
          zone(
            0.8,
            1.6,
          );

        const clipped =
          systemSceneClipMultihostSTypeHabitableZone(
            source,
            1.2,
          );

        expect(source.radiativeInnerEdgeAu).toBe(0.8);
        expect(source.radiativeOuterEdgeAu).toBe(1.6);
        expect(clipped.dynamicallyHabitableInnerEdgeAu).toBe(0.8);
        expect(clipped.dynamicallyHabitableOuterEdgeAu).toBe(1.2);
        expect(clipped.dynamicalOverlapFraction01).toBeCloseTo(0.5, 12);
      },
    );

    it(
      'keeps a source that was already radiative-only from gaining fabricated dynamical stability',
      () => {
        const source = Object.freeze({
          ...zone(0.8, 1.6),
          dynamicallyHabitableInnerEdgeAu:
            null,
          dynamicallyHabitableOuterEdgeAu:
            null,
          dynamicallyHabitableInnerRadiusScene:
            null,
          dynamicallyHabitableOuterRadiusScene:
            null,
          dynamicalOverlapFraction01:
            0,
        });

        expect(
          systemSceneClipMultihostSTypeHabitableZone(
            source,
            10,
          ),
        ).toEqual({
          dynamicallyHabitableInnerEdgeAu:
            null,
          dynamicallyHabitableOuterEdgeAu:
            null,
          dynamicalOverlapFraction01:
            0,
        });
      },
    );

    it(
      'also constrains triple A/B by C and C by the A+B barycentre',
      () => {
        const hierarchy = {
          massA:
            1,
          massB:
            0.8,
          massC:
            0.6,
          innerBinaryAxisAu:
            4,
          innerBinaryEccentricity:
            0.12,
          outerBinaryAxisAu:
            40,
          outerBinaryEccentricity:
            0.18,
        } as const;

        const a =
          systemSceneMultihostSTypeStableOuterAu({
            ...hierarchy,
            hostId:
              'A',
          });
        const b =
          systemSceneMultihostSTypeStableOuterAu({
            ...hierarchy,
            hostId:
              'B',
          });
        const c =
          systemSceneMultihostSTypeStableOuterAu({
            ...hierarchy,
            hostId:
              'C',
          });

        expect(a).toBeGreaterThan(0);
        expect(b).toBeGreaterThan(0);
        expect(c).toBeGreaterThan(0);
        expect(a).toBeLessThan(hierarchy.innerBinaryAxisAu);
        expect(b).toBeLessThan(hierarchy.innerBinaryAxisAu);
        expect(c).toBeLessThan(hierarchy.outerBinaryAxisAu);
      },
    );
  },
);
