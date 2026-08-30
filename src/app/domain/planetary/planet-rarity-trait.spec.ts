import {
  PlanetRarityTrait,
} from './planet-rarity-trait';

describe(
  'PlanetRarityTrait point 19.8',
  () => {
    it(
      'should freeze the exact V1 basic rarity vocabulary',
      () => {
        expect(
          Object.values(
            PlanetRarityTrait,
          ),
        ).toEqual([
          'PUFFY_LOW_DENSITY',
          'ULTRA_DENSE',
          'EXTREME_SURFACE_GRAVITY',
          'RAPID_ROTATOR',
          'EXTREME_OBLIQUITY',
          'STRONGLY_RETROGRADE_ROTATION',
          'HIGH_ORBITAL_ECCENTRICITY',
          'EXTREME_IRRADIATION',
          'EXTREME_TIDAL_HEATING',
          'MASSIVE_SOLID_WORLD',
          'METAL_RICH_INTERIOR',
          'VOLATILE_RICH_INTERIOR',
          'EXTREME_BASE_ALBEDO',
        ]);
      },
    );
  },
);
