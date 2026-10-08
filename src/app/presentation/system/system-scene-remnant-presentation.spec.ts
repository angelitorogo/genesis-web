import {
  systemSceneHabitableFramingEdges,
  systemSceneStellarPresentation,
} from './system-scene-remnant-presentation';

describe('SystemScene compact-remnant presentation', () => {
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

  it('projects neutron stars and stellar black holes as compact non-photospheric hosts', () => {
    const neutronStar = systemSceneStellarPresentation('NEUTRON_STAR', 0.46);
    expect(neutronStar.kind).toBe('NEUTRON_STAR');
    expect(neutronStar.radiusScene).toBeLessThan(0.05);
    expect(neutronStar.sourceEmissionAllowed).toBe(false);
    expect(neutronStar.rendererLuminositySolar).toBeNull();

    const blackHole = systemSceneStellarPresentation('STELLAR_BLACK_HOLE', 0.46);
    expect(blackHole.kind).toBe('STELLAR_BLACK_HOLE');
    expect(blackHole.radiusScene).toBeLessThan(0.2);
    expect(blackHole.sourceEmissionAllowed).toBe(false);
    expect(blackHole.rendererLuminositySolar).toBeCloseTo(0.65, 5);

    const ordinary = systemSceneStellarPresentation('MAIN_SEQUENCE', 0.31);
    expect(ordinary).toEqual({
      kind: 'PHOTOSPHERE',
      radiusScene: 0.31,
      sourceEmissionAllowed: true,
      rendererLuminositySolar: null,
    });
  });
});
