import { describe, expect, it } from 'vitest';
import {
  formatSystemSceneBinarySeparationAu,
  systemSceneBinarySeparationAu,
} from './system-scene-binary-separation';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

function binaryFixture(timeScale = 1, displayScale = 100): SystemSceneSnapshot {
  const contribution = (scale: number) => Object.freeze({
    motionId: 'relative-ab', scale,
    presentationTimeScale: timeScale,
    postProjectionScale: displayScale,
  });
  return Object.freeze({
    multiplicityName: 'BINARY',
    stars: Object.freeze([
      Object.freeze({label: 'A', motionContributions: Object.freeze([contribution(0.4)]),
        position: Object.freeze({x: -400, y: 0, z: 0})}),
      Object.freeze({label: 'B', motionContributions: Object.freeze([contribution(-0.6)]),
        position: Object.freeze({x: 600, y: 0, z: 0})}),
    ]),
    motions: Object.freeze([Object.freeze({
      id: 'relative-ab', semiMajorAxisAu: 10, eccentricity: 0.25,
      periodDays: 100, rotationDegrees: 0, inclinationDegrees: 0,
      epochMeanAnomalyDegrees: 0,
    })]),
  } as unknown as SystemSceneSnapshot);
}

describe('Binary separation: physical AU at the visual stellar phase', () => {
  it('uses the orbital model, not exaggerated scene positions or post-projection scale', () => {
    expect(systemSceneBinarySeparationAu(binaryFixture(), 0)).toBeCloseTo(7.5, 7);
    expect(systemSceneBinarySeparationAu(binaryFixture(1, 0.1), 0)).toBeCloseTo(7.5, 7);
    expect(systemSceneBinarySeparationAu(binaryFixture(1, 1000), 50)).toBeCloseTo(12.5, 7);
  });

  it('tracks the phase displayed by the opt-in laboratory cadence without changing AU', () => {
    expect(systemSceneBinarySeparationAu(binaryFixture(2), 25)).toBeCloseTo(12.5, 7);
    expect(systemSceneBinarySeparationAu(binaryFixture(1), 25)).toBeLessThan(12.5);
  });

  it('shows no invented measurement for other architectures or missing stellar motion', () => {
    const binary = binaryFixture();
    expect(systemSceneBinarySeparationAu({...binary, multiplicityName: 'TRIPLE'}, 0)).toBeNull();
    expect(systemSceneBinarySeparationAu({...binary, multiplicityName: 'SINGLE'}, 0)).toBeNull();
    expect(systemSceneBinarySeparationAu(binary, Number.NaN)).toBeNull();
    expect(systemSceneBinarySeparationAu({...binary, motions: []}, 0)).toBeNull();
  });

  it('formats the value without false zero for a very close physical pair', () => {
    expect(formatSystemSceneBinarySeparationAu(4.25)).toBe('4,25');
    expect(formatSystemSceneBinarySeparationAu(0.0042)).toBe('0,00420');
    expect(formatSystemSceneBinarySeparationAu(0.00000042)).toBe('4,20e-7');
    expect(formatSystemSceneBinarySeparationAu(null)).toBeNull();
  });
});
