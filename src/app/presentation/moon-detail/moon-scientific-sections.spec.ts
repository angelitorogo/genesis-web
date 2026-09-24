import {
  formatScientificInsolationEarth,
} from './moon-scientific-sections';

describe(
  'MoonScientificSections presentation semantics',
  () => {
    it(
      'should keep ordinary insolations in the existing Spanish decimal format',
      () => {
        expect(
          formatScientificInsolationEarth(1.234),
        ).toBe('1,234 S⊕');
      },
    );

    it(
      'should never round a positive tiny insolation down to zero',
      () => {
        const rendered =
          formatScientificInsolationEarth(0.00034);

        expect(rendered).not.toBe('0 S⊕');
        expect(rendered).toContain('S⊕');
        expect(rendered.toUpperCase()).toContain('E');
      },
    );

    it(
      'should still render a physically exact zero as zero',
      () => {
        expect(
          formatScientificInsolationEarth(0),
        ).toBe('0 S⊕');
      },
    );
  },
);
