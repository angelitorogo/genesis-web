import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GalacticObjectScientificSubject,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GalacticObjectScientificSubjectResolver,
} from './galactic-object-scientific-subject-resolver';

import {
  SupernovaRemnantGenerator,
} from './supernova-remnant-generator';

describe(
  'GalacticObjectScientificSubjectResolver',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    it(
      'should refuse to resolve hidden physical subject while the target is only DETECTED',
      () => {
        expect(
          () =>
            GalacticObjectScientificSubjectResolver
              .resolve(
                generationKey,
                new GalacticObjectLocator(
                  0n,
                  123456789n,
                  3n,
                ),
                DiscoveryState.DETECTED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      'should resolve a qualifying emission nebula as HII_REGION before generic NEBULA',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                3n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.HII_REGION,
        );
      },
    );

    it(
      'should resolve a non-HII physical nebula as NEBULA',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                123456789n,
                8n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.NEBULA,
        );
      },
    );

    it(
      'should preserve the frozen open versus globular STAR_CLUSTER partition',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                2n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.OPEN_CLUSTER,
        );

        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                7n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.GLOBULAR_CLUSTER,
        );
      },
    );

    it(
      'should resolve the frozen point-12.6 remnant vector as SUPERNOVA_REMNANT',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              findPersistentSupernovaRemnantLocator(
                generationKey,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBe(
          GalacticObjectScientificSubject.SUPERNOVA_REMNANT,
        );
      },
    );

    it(
      'should keep the reserved EXTREME_OBJECT complement scientifically unresolved',
      () => {
        expect(
          GalacticObjectScientificSubjectResolver
            .resolve(
              generationKey,
              new GalacticObjectLocator(
                0n,
                0n,
                18n,
              ),
              DiscoveryState.DISCOVERED,
            ),
        ).toBeNull();
      },
    );

    it(
      'should reject unsupported generator versions before resolving any physical subject',
      () => {
        const unsupported =
          new UniverseGenerationKey(
            generationKey.universeSeed,
            {
              code:
                999,
            } as unknown as GeneratorVersion,
          );

        expect(
          () =>
            GalacticObjectScientificSubjectResolver
              .resolve(
                unsupported,
                new GalacticObjectLocator(
                  0n,
                  0n,
                  0n,
                ),
                DiscoveryState.DISCOVERED,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);

function findPersistentSupernovaRemnantLocator(
  generationKey:
    UniverseGenerationKey,
): GalacticObjectLocator {

  for (
    let index =
      1n;
    index <
      2_048n;
    index +=
      1n
  ) {
    const candidate =
      new GalacticObjectLocator(
        0n,
        0n,
        index,
      );

    if (
      SupernovaRemnantGenerator
        .isSupernovaRemnantLocator(
          generationKey,
          candidate,
        )
    ) {
      return candidate;
    }
  }

  throw new RangeError(
    'Missing deterministic persistent supernova-remnant test locator outside the reserved galactic nucleus object.',
  );
}
