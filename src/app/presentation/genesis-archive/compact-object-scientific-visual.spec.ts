import { compactObjectScientificVisual } from './compact-object-scientific-visual';

describe('27.10 — scientific compact-object iconography contract', () => {
  it('does not invent an accretion disk or jets for a bare black hole', () => {
    const visual = compactObjectScientificVisual('BLACK_HOLE');
    expect(visual.hasAccretionDisk).toBe(false);
    expect(visual.hasRelativisticJets).toBe(false);
    expect(visual.isIllustration).toBe(true);
    expect(Object.isFrozen(visual)).toBe(true);
  });

  it('draws jets only when supplied with a real disk-and-jet model', () => {
    expect(() => compactObjectScientificVisual('BLACK_HOLE', false, true)).toThrow(RangeError);
    expect(() => compactObjectScientificVisual('MAGNETAR', true)).toThrow(RangeError);
    expect(compactObjectScientificVisual('BLACK_HOLE', true, true).hasRelativisticJets).toBe(true);
  });

  it('keeps pulsars, millisecond pulsars and magnetars distinguishable without asserting observations', () => {
    for (const kind of ['NEUTRON_STAR', 'PULSAR', 'MILLISECOND_PULSAR', 'MAGNETAR'] as const) {
      const visual = compactObjectScientificVisual(kind);
      expect(visual.kind).toBe(kind);
      expect(visual.isIllustration).toBe(true);
      expect(visual.hasAccretionDisk).toBe(false);
    }
  });
});
