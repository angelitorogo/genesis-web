import {
  systemSceneBlackHoleMarkerPresentation,
  systemSceneHabitableFramingEdges,
  systemSceneStellarPresentation,
} from './system-scene-remnant-presentation';

describe('SystemScene 29.1E-d remnant presentation', () => {
  it('keeps REFERENCE_ONLY HZ geometry out of the initial framing scale', () => {
    expect(systemSceneHabitableFramingEdges({
      stellarEvolutionRegime: 'REFERENCE_ONLY',
      radiativeInnerEdgeAu: 532,
      radiativeOuterEdgeAu: 937,
    })).toEqual({ innerAu: null, outerAu: null });

    expect(systemSceneHabitableFramingEdges({
      stellarEvolutionRegime: 'MAIN_SEQUENCE_INNER_PAIR',
      radiativeInnerEdgeAu: 0.9,
      radiativeOuterEdgeAu: 1.6,
    })).toEqual({ innerAu: 0.9, outerAu: 1.6 });
  });

  it('projects stellar black holes as compact non-emissive remnants rather than progenitor photospheres', () => {
    const blackHole = systemSceneStellarPresentation('STELLAR_BLACK_HOLE', 0.46);
    expect(blackHole.kind).toBe('STELLAR_BLACK_HOLE');
    expect(blackHole.radiusScene).toBeLessThan(0.2);
    expect(blackHole.sourceEmissionAllowed).toBe(false);

    const ordinary = systemSceneStellarPresentation('MAIN_SEQUENCE', 0.31);
    expect(ordinary).toEqual({
      kind: 'PHOTOSPHERE',
      radiusScene: 0.31,
      sourceEmissionAllowed: true,
    });
  });

  it('keeps a quiescent black hole identifiable without giving it stellar emission', () => {
    const marker = systemSceneBlackHoleMarkerPresentation(0.055);

    expect(marker.ringDiameterScene).toBeGreaterThanOrEqual(0.54);
    expect(marker.haloDiameterScene).toBeGreaterThan(marker.ringDiameterScene);
    expect(marker.ringOpacity).toBeGreaterThan(marker.haloOpacity);
    expect(marker.ringOpacity).toBeLessThan(1);
  });

  it('renders brown dwarfs as small faint objects instead of ordinary flaring stars', () => {
    const brownDwarf = systemSceneStellarPresentation('BROWN_DWARF', 0.34);
    expect(brownDwarf.kind).toBe('BROWN_DWARF');
    expect(brownDwarf.radiusScene).toBeGreaterThanOrEqual(0.07);
    expect(brownDwarf.radiusScene).toBeLessThanOrEqual(0.11);
    expect(brownDwarf.sourceEmissionAllowed).toBe(true);
  });

});
