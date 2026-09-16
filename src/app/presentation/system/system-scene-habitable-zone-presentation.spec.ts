import {
  buildMultipleAdaptiveSystemScaleV3,
  buildSingleAdaptiveSystemScaleV3,
  SystemSceneProjectionSpace,
  systemSceneProjectedOverlayRadiusAuInSpace,
} from './system-scene-scale-projection';

import {
  buildSystemSceneHabitableZonePresentationV3,
} from './system-scene-habitable-zone-presentation';

describe('SystemScene habitable-zone presentation visual-consistency hotfix', () => {
  it('should preserve the exact shared projection instead of imposing an independent minimum width or stellar clearance', () => {
    const layout = buildSystemSceneHabitableZonePresentationV3({
      radiativeInnerAu: 0.72,
      radiativeOuterAu: 1.31,
      dynamicallyHabitableInnerAu: 0.80,
      dynamicallyHabitableOuterAu: 1.20,
      projectedRadiativeInnerScene: 0.34,
      projectedRadiativeOuterScene: 0.49,
      projectedDynamicallyHabitableInnerScene: 0.365,
      projectedDynamicallyHabitableOuterScene: 0.465,
    });

    expect(layout.radiativeInnerScene).toBe(0.34);
    expect(layout.radiativeOuterScene).toBe(0.49);
    expect(layout.radiativeOuterScene - layout.radiativeInnerScene).toBeCloseTo(0.15, 12);
    expect(layout.dynamicallyHabitableInnerScene).toBe(0.365);
    expect(layout.dynamicallyHabitableOuterScene).toBe(0.465);
  });

  it('should keep the reported SINGLE-system exterior planet completely outside the rendered HZ', () => {
    const scale = buildSingleAdaptiveSystemScaleV3({
      outerRadiusAu: 8,
      targetOuterRadiusScene: 4.8,
      innerPeriapsisAu: 0.35,
      starRadiusScene: 0.28,
      maxPlanetRadiusScene: 0.06,
      habitableZoneInnerAu: 1.18,
      habitableZoneOuterAu: 2.08,
    });

    const project = (radiusAu: number): number =>
      systemSceneProjectedOverlayRadiusAuInSpace(
        radiusAu,
        scale,
        SystemSceneProjectionSpace.GLOBAL,
      );

    const layout = buildSystemSceneHabitableZonePresentationV3({
      radiativeInnerAu: 1.18,
      radiativeOuterAu: 2.08,
      dynamicallyHabitableInnerAu: 1.18,
      dynamicallyHabitableOuterAu: 2.08,
      projectedRadiativeInnerScene: project(1.18),
      projectedRadiativeOuterScene: project(2.08),
      projectedDynamicallyHabitableInnerScene: project(1.18),
      projectedDynamicallyHabitableOuterScene: project(2.08),
    });

    const projectedPeriapsis = project(2.506);
    const projectedSemiMajor = project(2.601);
    const projectedApoapsis = project(2.696);

    expect(layout.radiativeOuterScene).toBeLessThan(projectedPeriapsis);
    expect(projectedPeriapsis).toBeLessThan(projectedSemiMajor);
    expect(projectedSemiMajor).toBeLessThan(projectedApoapsis);
  });

  it('should preserve the same radial ordering for a BINARY system', () => {
    const scale = buildMultipleAdaptiveSystemScaleV3({
      architecture: 'BINARY',
      outerRadiusAu: 7,
      targetOuterRadiusScene: 4.8,
      innerBinaryPeriapsisAu: 0.08,
      primaryStarRadiusScene: 0.28,
      secondaryStarRadiusScene: 0.24,
      habitableZoneInnerAu: 0.31,
      habitableZoneOuterAu: 0.54,
    });

    const project = (radiusAu: number): number =>
      systemSceneProjectedOverlayRadiusAuInSpace(
        radiusAu,
        scale,
        SystemSceneProjectionSpace.GLOBAL,
      );

    const layout = buildSystemSceneHabitableZonePresentationV3({
      radiativeInnerAu: 0.31,
      radiativeOuterAu: 0.54,
      dynamicallyHabitableInnerAu: 0.32,
      dynamicallyHabitableOuterAu: 0.54,
      projectedRadiativeInnerScene: project(0.31),
      projectedRadiativeOuterScene: project(0.54),
      projectedDynamicallyHabitableInnerScene: project(0.32),
      projectedDynamicallyHabitableOuterScene: project(0.54),
    });

    expect(layout.radiativeOuterScene).toBeLessThan(project(1.819));
    expect(project(1.819)).toBeLessThan(project(1.827));
    expect(project(1.827)).toBeLessThan(project(1.836));
  });
});
