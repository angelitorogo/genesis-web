import {
  systemSceneMultihostProjectedRadiusV22,
} from './system-scene-multihost-radial-projection';

const projection = Object.freeze({
  firstPeriapsisAu: 0.02,
  firstPeriapsisScene: 0.23,
  lastApoapsisAu: 5,
  lastApoapsisScene: 1.6,
});

describe('V2.2 S-type disk-wide radial presentation', () => {
  it('keeps the innermost orbit outside the star and the outer disk inside budget', () => {
    expect(systemSceneMultihostProjectedRadiusV22(0, projection)).toBe(0);
    expect(systemSceneMultihostProjectedRadiusV22(0.02, projection))
      .toBeCloseTo(0.23, 12);
    expect(systemSceneMultihostProjectedRadiusV22(5, projection))
      .toBeCloseTo(1.6, 12);
  });
  it('preserves ALL radial ordering with one shared transform for guides and motion', () => {
    const values = [0.001, 0.01, 0.02, 0.03, 0.1, 0.5, 1, 3, 5];
    const mapped = values.map(au => systemSceneMultihostProjectedRadiusV22(au, projection));
    for (let index = 1; index < mapped.length; index++) {
      expect(mapped[index]).toBeGreaterThan(mapped[index - 1]!);
    }
    expect(mapped.every(Number.isFinite)).toBe(true);
  });
  it('rejects nonmonotonic and nonphysical configurations', () => {
    expect(() => systemSceneMultihostProjectedRadiusV22(-1, projection))
      .toThrow(RangeError);
    expect(() => systemSceneMultihostProjectedRadiusV22(1, {
      ...projection, lastApoapsisScene: projection.firstPeriapsisScene,
    })).toThrow(RangeError);
  });
});
