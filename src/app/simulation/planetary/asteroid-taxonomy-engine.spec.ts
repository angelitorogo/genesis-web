import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  AsteroidBeltRegion,
} from '../../domain/planetary/asteroid-belt-region';

import {
  AsteroidCompositionRegime,
} from '../../domain/planetary/asteroid-composition-regime';

import {
  AsteroidIdentity,
} from '../../domain/planetary/asteroid-identity';

import {
  AsteroidMultiplicityRegime,
} from '../../domain/planetary/asteroid-multiplicity-regime';

import {
  AsteroidOrbitalElements,
} from '../../domain/planetary/asteroid-orbital-elements';

import {
  AsteroidStructureRegime,
} from '../../domain/planetary/asteroid-structure-regime';

import {
  SystemSeed,
} from '../../domain/seed/hierarchical-seeds';

import {
  AsteroidTaxonomyEngine,
} from './asteroid-taxonomy-engine';

describe(
  'AsteroidTaxonomyEngine point 22.4 V1',
  () => {
    const locator =
      new SystemLocator(
        6n,
        113n,
        9n,
      );

    const seed =
      new SystemSeed(
        '22222222222222222222222222222222',
      );

    it(
      'should classify the frozen first INNER and OUTER point-22.3 identities deterministically',
      () => {
        const innerIdentity =
          new AsteroidIdentity(
            locator,
            seed,
            AsteroidBeltRegion.INNER,
            1,
            '01D8D9F53AECCDC4F46A562B58365B91',
          );

        const innerOrbit =
          new AsteroidOrbitalElements(
            AsteroidBeltRegion.INNER,
            1,
            0.177,
            0.984,
            0.3585318762245575,
            0.6398471330138847,
            0.2055505421385169,
            4,
            10,
            20,
            30,
          );

        const inner =
          AsteroidTaxonomyEngine
            .classify(
              innerIdentity,
              615.9146924894908,
              innerOrbit,
            );

        expect(
          inner.compositionRegime,
        ).toBe(
          AsteroidCompositionRegime.METALLIC,
        );

        expect(
          inner.structureRegime,
        ).toBe(
          AsteroidStructureRegime.FRACTURED,
        );

        expect(
          inner.multiplicityRegime,
        ).toBe(
          AsteroidMultiplicityRegime.SINGLE,
        );

        const outerIdentity =
          new AsteroidIdentity(
            locator,
            seed,
            AsteroidBeltRegion.OUTER,
            1,
            'D60EB9501E11A1DC0C3DE5F565D89F32',
          );

        const outerOrbit =
          new AsteroidOrbitalElements(
            AsteroidBeltRegion.OUTER,
            1,
            6.71,
            46,
            20.55572634155551,
            24.883149101453533,
            0.05,
            4,
            10,
            20,
            30,
          );

        const outer =
          AsteroidTaxonomyEngine
            .classify(
              outerIdentity,
              649.8832372274101,
              outerOrbit,
            );

        expect(
          outer.compositionRegime,
        ).toBe(
          AsteroidCompositionRegime.CARBONACEOUS,
        );

        expect(
          outer.iceFraction01,
        ).toBeGreaterThan(
          inner.iceFraction01,
        );
      },
    );

    it(
      'should remain exactly deterministic and reject mismatched point-22.3 identity/orbit input',
      () => {
        const identity =
          new AsteroidIdentity(
            locator,
            seed,
            AsteroidBeltRegion.INNER,
            1,
            '01D8D9F53AECCDC4F46A562B58365B91',
          );

        const orbit =
          new AsteroidOrbitalElements(
            AsteroidBeltRegion.INNER,
            1,
            0.177,
            0.984,
            0.3585318762245575,
            0.6398471330138847,
            0.1,
            4,
            10,
            20,
            30,
          );

        expect(
          AsteroidTaxonomyEngine
            .classify(
              identity,
              300,
              orbit,
            ),
        ).toEqual(
          AsteroidTaxonomyEngine
            .classify(
              identity,
              300,
              orbit,
            ),
        );

        const outerOrbit =
          new AsteroidOrbitalElements(
            AsteroidBeltRegion.OUTER,
            1,
            6,
            8,
            7,
            7,
            0.05,
            4,
            10,
            20,
            30,
          );

        expect(
          () =>
            AsteroidTaxonomyEngine
              .classify(
                identity,
                300,
                outerOrbit,
              ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
