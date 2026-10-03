import { describe, expect, it } from 'vitest';

import {
  EXTREME_LABORATORY_PRESET_LABELS,
  EXTREME_LABORATORY_RENDER_REGISTRY,
  ExtremeLaboratoryRenderSession,
  extremeLaboratoryCameraPreset,
  extremeLaboratoryPresetSelection,
  extremeLaboratoryRegistration,
  extremeLaboratoryRenderRequest,
} from './extreme-laboratory-render-infrastructure';

describe('28.2F.7 extreme laboratory render infrastructure', () => {
  it('exposes one canonical type registry with unique extreme types', () => {
    const types = EXTREME_LABORATORY_RENDER_REGISTRY.map(entry => entry.type);

    expect(new Set(types).size).toBe(types.length);
    expect(types).toContain('NEUTRON_STAR');
    expect(types).toContain('STELLAR_MASS_BLACK_HOLE');
    expect(types).toContain('X_RAY_BINARY_NS');
    expect(types).toContain('X_RAY_BINARY_BH');
    expect(types).toContain('MICROQUASAR');
    expect(types).toContain('ULX');
    expect(types).toContain('SUPERNOVA_REMNANT');
    expect(types).toContain('PULSAR_WIND_NEBULA');
  });

  it('uses the same A-H preset contract for every registered renderer', () => {
    for (const registration of EXTREME_LABORATORY_RENDER_REGISTRY) {
      expect(registration.presets).toEqual(EXTREME_LABORATORY_PRESET_LABELS);
    }

    expect(extremeLaboratoryPresetSelection('MICROQUASAR', 'H')).toEqual({
      type: 'MICROQUASAR',
      preset: 'H',
      presetIndex: 7,
      stableId: 'MICROQUASAR:H',
    });
  });

  it('keeps physical controls separate from visual-only inspection controls', () => {
    const xray = extremeLaboratoryRegistration('X_RAY_BINARY_BH');

    expect(xray.physicalControls.map(control => control.key)).toContain('transferRate');
    expect(xray.physicalControls.map(control => control.key)).toContain('compactMass');
    expect(xray.physicalControls.map(control => control.key)).not.toContain('bloom');

    expect(xray.visualControls.map(control => control.key)).toContain('bloom');
    expect(xray.visualControls.map(control => control.key)).toContain('apparentScale');
    expect(xray.visualControls.map(control => control.key)).not.toContain('compactMass');
  });

  it('preserves the approved X-ray-binary camera while moving it behind the shared contract', () => {
    expect(extremeLaboratoryCameraPreset('X_RAY_BINARY_NS')).toEqual({
      fovDegrees: 34,
      near: 0.1,
      far: 120,
      position: { x: 0, y: 0.1, z: 14.6 },
      target: { x: 0, y: 0, z: 0 },
    });
    expect(extremeLaboratoryCameraPreset('MICROQUASAR')).toEqual(
      extremeLaboratoryCameraPreset('X_RAY_BINARY_NS'),
    );
  });

  it('reserves animation for confirmed representation while retaining the same request contract for game use', () => {
    const catalogued = extremeLaboratoryRenderRequest({
      type: 'ULX',
      preset: 'C',
      surface: 'LABORATORY',
      detailStage: 'CATALOGUED',
      animationEnabled: true,
    });
    const confirmedGame = extremeLaboratoryRenderRequest({
      type: 'ULX',
      preset: 'C',
      surface: 'GAME',
      detailStage: 'CONFIRMED',
      animationEnabled: true,
    });

    expect(catalogued.animationEnabled).toBe(false);
    expect(confirmedGame.animationEnabled).toBe(true);
    expect(confirmedGame.rendererKey).toBe('xray-binary');
    expect(confirmedGame.rendererFamily).toBe('XRAY_BINARY');
  });

  it('provides one reusable selector/session without coupling it to Angular components', () => {
    const session = new ExtremeLaboratoryRenderSession({
      type: 'NEUTRON_STAR',
      preset: 'A',
    });

    expect(session.selectType('MICROQUASAR').type).toBe('MICROQUASAR');
    expect(session.selectPreset('F').preset.preset).toBe('F');
    expect(session.setSurface('GAME').surface).toBe('GAME');
    expect(session.setDetailStage('DISCOVERED').animationEnabled).toBe(false);
  });

  it('rejects unknown types instead of silently falling back to another renderer', () => {
    expect(() => extremeLaboratoryRegistration('NOT_A_REAL_EXTREME')).toThrowError(
      /Unsupported extreme laboratory type/,
    );
  });
});
