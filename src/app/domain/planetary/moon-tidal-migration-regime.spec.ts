import {
  MoonTidalMigrationRegime,
} from './moon-tidal-migration-regime';

import {
  moonTidalMigrationRegimeV1,
} from './moon-tidal-state';

describe(
  'MoonTidalMigrationRegime point 21.4',
  () => {
    it(
      'should classify prograde moons relative to the corotation radius',
      () => {
        expect(
          moonTidalMigrationRegimeV1(
            false,
            4,
            5,
          ),
        ).toBe(
          MoonTidalMigrationRegime.INWARD,
        );

        expect(
          moonTidalMigrationRegimeV1(
            false,
            5,
            5,
          ),
        ).toBe(
          MoonTidalMigrationRegime.NEAR_SYNCHRONOUS,
        );

        expect(
          moonTidalMigrationRegimeV1(
            false,
            6,
            5,
          ),
        ).toBe(
          MoonTidalMigrationRegime.OUTWARD,
        );
      },
    );

    it(
      'should keep point-21.3 prograde moons on the inward branch around a retrograde host spin',
      () => {
        expect(
          moonTidalMigrationRegimeV1(
            true,
            20,
            5,
          ),
        ).toBe(
          MoonTidalMigrationRegime.INWARD,
        );
      },
    );
  },
);
