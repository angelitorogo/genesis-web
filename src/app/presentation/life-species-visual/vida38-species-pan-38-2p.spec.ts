import { describe, expect, it } from 'vitest';
import { computeVida38SpeciesPanDelta38P } from './vida38-species-pan-38-2p';

const base = { viewportHeightPixels: 600, distance: 4, verticalFovDegrees: 34, yaw: 0, pitch: 0 };

describe('38.2p — desplazamiento libre del visor de especies', () => {
  it('arrastrar hacia abajo desplaza visualmente la especie hacia abajo', () => {
    const p = computeVida38SpeciesPanDelta38P({ ...base, deltaPixelsX: 0, deltaPixelsY: 100 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeGreaterThan(0);
    expect(p.z).toBeCloseTo(0);
  });
  it('arrastrar hacia la derecha acompaña el movimiento de la imagen', () => {
    const p = computeVida38SpeciesPanDelta38P({ ...base, deltaPixelsX: 100, deltaPixelsY: 0 });
    expect(p.x).toBeLessThan(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(0);
  });
  it('la traslación respeta la orientación de cámara y el zoom', () => {
    const close = computeVida38SpeciesPanDelta38P({ ...base, yaw: Math.PI / 2, pitch: 0.3, deltaPixelsX: 100, deltaPixelsY: 50, distance: 2 });
    const far = computeVida38SpeciesPanDelta38P({ ...base, yaw: Math.PI / 2, pitch: 0.3, deltaPixelsX: 100, deltaPixelsY: 50, distance: 4 });
    expect(close.z).toBeGreaterThan(0);
    expect(far.x).toBeCloseTo(close.x * 2);
    expect(far.y).toBeCloseTo(close.y * 2);
    expect(far.z).toBeCloseTo(close.z * 2);
  });
  it('un desplazamiento nulo nunca altera la cámara', () => {
    const p = computeVida38SpeciesPanDelta38P({ ...base, yaw: -0.4, pitch: 0.6, deltaPixelsX: 0, deltaPixelsY: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(0);
    expect(p.z).toBeCloseTo(0);
  });
});
