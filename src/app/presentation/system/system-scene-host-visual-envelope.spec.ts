import {
  buildSystemSceneHostVisualEnvelopeV3,
} from './system-scene-host-visual-envelope';

describe('SystemScene host visual envelope V3', () => {
  it('should cap an oversized SINGLE photosphere while also reducing its optical radius', () => {
    const envelope = buildSystemSceneHostVisualEnvelopeV3(
      [
        {
          id: 'A',
          baseRadiusScene: 0.40,
          maxCenterExcursionScene: 0,
          participatesInHabitableZoneHost: true,
        },
      ],
      1.0,
    );

    expect(envelope.stars[0]!.radiusScene).toBeCloseTo(0.30, 12);
    expect(envelope.stars[0]!.opticalRadiusScene).toBeGreaterThan(envelope.stars[0]!.radiusScene);
    expect(envelope.stars[0]!.opticalRadiusScene).toBeLessThan(0.40);
    expect(envelope.limited).toBe(true);
    expect(envelope.hostVisualEnvelopeRadiusScene).toBeLessThan(
      envelope.habitableZoneInnerRadiusScene!,
    );
  });

  it('should constrain the complete BINARY host envelope instead of each center independently', () => {
    const envelope = buildSystemSceneHostVisualEnvelopeV3(
      [
        {
          id: 'A',
          baseRadiusScene: 0.28,
          maxCenterExcursionScene: 0.56,
          participatesInHabitableZoneHost: true,
        },
        {
          id: 'B',
          baseRadiusScene: 0.24,
          maxCenterExcursionScene: 0.48,
          participatesInHabitableZoneHost: true,
        },
      ],
      1.0,
    );

    expect(envelope.hostVisualEnvelopeRadiusScene).toBeLessThanOrEqual(
      envelope.maxAllowedEnvelopeRadiusScene! + 1e-9,
    );
    expect(envelope.stars[0]!.radiusScene).toBeLessThan(0.28);
  });

  it('should not shrink a TRIPLE tertiary that is outside the circumbinary HZ host', () => {
    const envelope = buildSystemSceneHostVisualEnvelopeV3(
      [
        {
          id: 'A',
          baseRadiusScene: 0.34,
          maxCenterExcursionScene: 0.44,
          participatesInHabitableZoneHost: true,
        },
        {
          id: 'B',
          baseRadiusScene: 0.30,
          maxCenterExcursionScene: 0.40,
          participatesInHabitableZoneHost: true,
        },
        {
          id: 'C',
          baseRadiusScene: 0.38,
          maxCenterExcursionScene: 3.1,
          participatesInHabitableZoneHost: false,
        },
      ],
      1.05,
    );

    const tertiary = envelope.stars.find(star => star.id === 'C')!;
    expect(tertiary.radiusScene).toBe(0.38);
    expect(tertiary.opticalRadiusScene).toBe(0.38);
  });
});

it('should shrink the visible stellar photosphere against the nearest planetary periapsis even when the HZ is farther out', () => {
  const envelope = buildSystemSceneHostVisualEnvelopeV3(
    [
      {
        id: 'A',
        baseRadiusScene: 0.42,
        maxCenterExcursionScene: 0,
        participatesInHabitableZoneHost: true,
      },
    ],
    2.0,
    0.8,
  );

  expect(envelope.nearestPlanetPeriapsisRadiusScene).toBe(0.8);
  expect(envelope.stars[0]!.radiusScene).toBeLessThanOrEqual(0.8 * 0.22 + 1e-12);
  expect(envelope.stars[0]!.opticalRadiusScene).toBeGreaterThan(envelope.stars[0]!.radiusScene);
  expect(envelope.stars[0]!.opticalRadiusScene).toBeLessThan(0.42);
  expect(envelope.hostVisualEnvelopeRadiusScene).toBeLessThan(0.8);
});
