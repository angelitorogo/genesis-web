import {
  buildSystemSceneHabitableZonePresentationV2,
} from './system-scene-habitable-zone-presentation';

describe('SystemScene habitable-zone presentation point 24.7 V2', () => {
  it('should keep a readable clearance outside the exaggerated stellar host', () => {
    const layout = buildSystemSceneHabitableZonePresentationV2({
      radiativeInnerAu: 0.72,
      radiativeOuterAu: 1.31,
      dynamicallyHabitableInnerAu: 0.80,
      dynamicallyHabitableOuterAu: 1.20,
      rawRadiativeInnerScene: 0.34,
      rawRadiativeOuterScene: 0.49,
      hostVisualExtentScene: 0.40,
    });

    expect(layout.radiativeInnerScene).toBeGreaterThanOrEqual(0.62);
    expect(layout.radiativeOuterScene - layout.radiativeInnerScene).toBeGreaterThanOrEqual(0.42);
  });

  it('should preserve dynamic-HZ ordering as a subset of the visible radiative band', () => {
    const layout = buildSystemSceneHabitableZonePresentationV2({
      radiativeInnerAu: 1,
      radiativeOuterAu: 2,
      dynamicallyHabitableInnerAu: 1.25,
      dynamicallyHabitableOuterAu: 1.75,
      rawRadiativeInnerScene: 1.2,
      rawRadiativeOuterScene: 2.2,
      hostVisualExtentScene: 0.3,
    });

    expect(layout.dynamicallyHabitableInnerScene).toBeGreaterThan(layout.radiativeInnerScene);
    expect(layout.dynamicallyHabitableOuterScene).toBeLessThan(layout.radiativeOuterScene);
    expect(layout.dynamicallyHabitableOuterScene).toBeGreaterThan(layout.dynamicallyHabitableInnerScene!);
  });
});
