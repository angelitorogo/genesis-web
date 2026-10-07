import {
  CircumbinaryStellarEvolutionRegime,
} from '../../domain/habitability/circumbinary-habitability-assessment';

import {
  systemSceneCircumbinaryFramingOuterRadius,
} from './system-scene-multihost-circumbinary-projection';

describe('SystemScene 29.1E-f.1 HZ-independent V2 HOME framing', () => {
  it('does not let a REFERENCE_ONLY HZ enlarge the aggregate camera envelope', () => {
    expect(
      systemSceneCircumbinaryFramingOuterRadius(
        24,
        1_630,
        CircumbinaryStellarEvolutionRegime.REFERENCE_ONLY,
      ),
    ).toBe(24);
  });

  it('does not let a physically valid MAIN_SEQUENCE_PAIR HZ enlarge HOME framing', () => {
    expect(
      systemSceneCircumbinaryFramingOuterRadius(
        24,
        31,
        CircumbinaryStellarEvolutionRegime.MAIN_SEQUENCE_PAIR,
      ),
    ).toBe(24);
  });
});
