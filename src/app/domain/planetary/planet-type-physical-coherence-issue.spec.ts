import {
  PlanetTypePhysicalCoherenceIssue,
} from './planet-type-physical-coherence-issue';

describe(
  'PlanetTypePhysicalCoherenceIssue',
  () => {
    it(
      'should expose the frozen point-19.7 diagnostic families',
      () => {
        expect(
          Object.values(
            PlanetTypePhysicalCoherenceIssue,
          ),
        ).toEqual([
          'BULK_MASS_RADIUS_DENSITY_MISMATCH',
          'ENVELOPE_MASS_FRACTION_MISMATCH',
          'ICE_BEARING_COMPOSITION_MISMATCH',
          'TYPE_RULE_MISMATCH',
        ]);
      },
    );
  },
);
