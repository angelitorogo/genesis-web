import {
  formatScientificInsolationEarth,
  magneticFieldContextNote,
  retainedVolatileInventoryNote,
} from './planet-scientific-sections';

describe(
  'PlanetScientificSections presentation semantics',
  () => {
    it(
      'should preserve ordinary insolation formatting and expose tiny positive values',
      () => {
        expect(
          formatScientificInsolationEarth(1.234),
        ).toBe('1,234 S⊕');

        const tiny =
          formatScientificInsolationEarth(0.00034);

        expect(tiny).not.toBe('0 S⊕');
        expect(tiny.toUpperCase()).toContain('E');
      },
    );

    it(
      'should describe retained inventory as volatile material conserved after escape rather than present-day gas',
      () => {
        const note =
          retainedVolatileInventoryNote(0.885);

        expect(note).toContain(
          'Inventario volátil conservado tras escape 88,5 %',
        );
        expect(note).toContain(
          'condensan',
        );
      },
    );

    it(
      'should disambiguate a moderate field without sustained dynamo or global magnetosphere',
      () => {
        expect(
          magneticFieldContextNote(
            'MODERATE',
            false,
            'NONE',
          ),
        ).toContain(
          'residual',
        );

        expect(
          magneticFieldContextNote(
            'MODERATE',
            true,
            'GLOBAL',
          ),
        ).toBe(
          'Dínamo sostenida',
        );

        expect(
          magneticFieldContextNote(
            'MODERATE',
            false,
            'INDUCED',
          ),
        ).toContain(
          'inducida',
        );
      },
    );
  },
);
