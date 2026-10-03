import { describe, expect, it } from 'vitest';

import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import {
  XRAY_BINARY_LABORATORY_TYPES,
  xrayBinaryLaboratoryModel,
  xrayBinaryLaboratorySamples,
} from './xray-binary-laboratory-render-model';

describe('28.2F.5 — XrayBinaryLaboratoryRenderModel', () => {
  it('exposes NS, BH, MICROQUASAR and ULX as the four implemented compact-system laboratory families', () => {
    expect(XRAY_BINARY_LABORATORY_TYPES).toEqual([
      ExtremeType.X_RAY_BINARY_NS,
      ExtremeType.X_RAY_BINARY_BH,
      ExtremeType.MICROQUASAR,
      ExtremeType.ULX,
    ]);
  });

  it('keeps eight deterministic A-H samples for each implemented family', () => {
    for (const type of XRAY_BINARY_LABORATORY_TYPES) {
      const samples = xrayBinaryLaboratorySamples(type);
      expect(samples).toHaveLength(8);
      expect(samples.map(sample => sample.sampleLabel)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
    }
  });

  it('adds family-specific jet and supercritical-wind illustrative physics only where appropriate', () => {
    const ns = xrayBinaryLaboratoryModel(ExtremeType.X_RAY_BINARY_NS, 0);
    const bh = xrayBinaryLaboratoryModel(ExtremeType.X_RAY_BINARY_BH, 0);
    const microquasar = xrayBinaryLaboratoryModel(ExtremeType.MICROQUASAR, 0);
    const ulx = xrayBinaryLaboratoryModel(ExtremeType.ULX, 0);

    expect(ns.jetPowerErgS).toBeNull();
    expect(bh.jetPowerErgS).toBeNull();
    expect(microquasar.jetPowerErgS).not.toBeNull();
    expect(microquasar.jetPowerErgS).toBeGreaterThan(0);
    expect(microquasar.jetOpeningDegrees).not.toBeNull();
    expect(microquasar.label).toBe('Microquásar');

    expect(ulx.jetPowerErgS).toBeNull();
    expect(ulx.superEddingtonFactor).not.toBeNull();
    expect(ulx.superEddingtonFactor).toBeGreaterThan(1);
    expect(ulx.windVelocityFractionC).not.toBeNull();
    expect(ulx.windVelocityFractionC).toBeGreaterThan(0);
    expect(ulx.label).toBe('Fuente ultraluminosa de rayos X (ULX)');
  });
});
