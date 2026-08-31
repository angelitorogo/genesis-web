import {
  SystemLocator,
} from '../generation/procedural-locator';

import {
  SystemSeed,
} from '../seed/hierarchical-seeds';

import {
  AsteroidBeltPopulationProfile,
} from './asteroid-belt-population-profile';

import {
  AsteroidBeltRegion,
} from './asteroid-belt-region';

import {
  AsteroidCompositionRegime,
} from './asteroid-composition-regime';

import {
  AsteroidIdentity,
} from './asteroid-identity';

import {
  AsteroidMultiplicityRegime,
} from './asteroid-multiplicity-regime';

import {
  AsteroidOrbitalElements,
} from './asteroid-orbital-elements';

import {
  AsteroidStructureRegime,
} from './asteroid-structure-regime';

import {
  AsteroidTaxonomy,
} from './asteroid-taxonomy';

import {
  RelevantAsteroid,
} from './relevant-asteroid';

describe(
  'RelevantAsteroid point 22.3',
  () => {
    const profile =
      new AsteroidBeltPopulationProfile(
        AsteroidBeltRegion.INNER,
        5,
        true,
        2,
        4,
        3,
        2,
        0.05,
        0.8,
      );

    const identity =
      new AsteroidIdentity(
        new SystemLocator(
          0n,
          0n,
          0n,
        ),
        new SystemSeed(
          '11111111111111111111111111111111',
        ),
        AsteroidBeltRegion.INNER,
        1,
        '0123456789ABCDEFFEDCBA9876543210',
      );

    const orbit =
      new AsteroidOrbitalElements(
        AsteroidBeltRegion.INNER,
        1,
        2,
        4,
        3,
        3,
        0.1,
        4,
        10,
        20,
        30,
      );

    const taxonomy =
      new AsteroidTaxonomy(
        AsteroidCompositionRegime.CARBONACEOUS,
        AsteroidStructureRegime.RUBBLE_PILE,
        AsteroidMultiplicityRegime.CONTACT_BINARY,
        0.55,
        0.25,
        0.05,
        0.15,
        0.45,
        1.25,
        0.06,
        null,
        null,
      );

    it(
      'should mark an existing relevant object as discovery-eligible while exposing point-22.4 taxonomy without discovery state',
      () => {
        const asteroid =
          new RelevantAsteroid(
            identity,
            profile,
            320,
            orbit,
            taxonomy,
          );

        expect(
          asteroid.isDiscoverable,
        ).toBe(true);

        expect(
          asteroid.localDesignation,
        ).toBe(
          'AST-IN-001',
        );

        expect(
          'discoveryState' in asteroid,
        ).toBe(false);

        expect(
          asteroid.compositionRegime,
        ).toBe(
          AsteroidCompositionRegime.CARBONACEOUS,
        );

        expect(
          asteroid.structureRegime,
        ).toBe(
          AsteroidStructureRegime.RUBBLE_PILE,
        );

        expect(
          asteroid.multiplicityRegime,
        ).toBe(
          AsteroidMultiplicityRegime.CONTACT_BINARY,
        );
      },
    );

    it(
      'should reject an identity/orbit from a different belt or invalid size',
      () => {
        const mismatchedIdentity =
          new AsteroidIdentity(
            identity.systemLocator,
            identity.systemSeed,
            AsteroidBeltRegion.OUTER,
            1,
            'FEDCBA98765432100123456789ABCDEF',
          );

        expect(
          () =>
            new RelevantAsteroid(
              mismatchedIdentity,
              profile,
              100,
              orbit,
              taxonomy,
            ),
        ).toThrow(
          RangeError,
        );

        expect(
          () =>
            new RelevantAsteroid(
              identity,
              profile,
              0,
              orbit,
              taxonomy,
            ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
