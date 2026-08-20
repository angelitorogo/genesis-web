import {
  TestBed,
} from '@angular/core/testing';

import {
  provideRouter,
} from '@angular/router';

import {
  GalacticObjectLaboratoryPage,
} from './galactic-object-laboratory';

describe(
  'GalacticObjectLaboratoryPage',
  () => {
    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              GalacticObjectLaboratoryPage,
            ],

            providers: [
              provideRouter(
                [],
              ),
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should render the complete current visual inventory laboratory',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-object-laboratory-page"]',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          '17 CASOS',
        );
      },
      30_000,
    );

    it(
      'should expose fourteen persistent-object selectors and three nucleus selectors',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-case-button"]',
          ),
        ).toHaveLength(
          14,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-nucleus-laboratory-case-button"]',
          ),
        ).toHaveLength(
          3,
        );
      },
      30_000,
    );

    it(
      'should start with the non-HII emission nebula and its four knowledge projections',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"]',
            )
            ?.getAttribute(
              'data-case',
            ),
        ).toBe(
          'NEBULA_EMISSION',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should expose all four nebula subtype selectors explicitly',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        for (
          const id
          of [
            'NEBULA_EMISSION',
            'NEBULA_REFLECTION',
            'NEBULA_DARK',
            'NEBULA_PLANETARY',
          ]
        ) {
          expect(
            element.querySelector(
              `[data-case="${id}"]`,
            ),
          ).toBeTruthy();
        }
      },
      30_000,
    );

    it(
      'should expose all four HII activity selectors and all three remnant morphology selectors',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        for (
          const id
          of [
            'HII_LOW',
            'HII_MODERATE',
            'HII_HIGH',
            'HII_INTENSE',
            'SNR_SHELL',
            'SNR_PLERION',
            'SNR_COMPOSITE',
          ]
        ) {
          expect(
            element.querySelector(
              `[data-case="${id}"]`,
            ),
          ).toBeTruthy();
        }
      },
      30_000,
    );

    it(
      'should switch to planetary-nebula progression without changing the route',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_PLANETARY"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"]',
            )
            ?.textContent,
        ).toContain(
          'Nebulosa planetaria',
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should preserve the reserved extreme-object case as unresolved even at CONFIRMED',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="RESERVED_EXTREME"]',
          )
          ?.click();

        fixture.detectChanges();

        const confirmed =
          element.querySelector(
            '[data-state="CONFIRMED"]',
          );

        expect(
          confirmed?.textContent,
        ).toContain(
          'sin clasificación física V1',
        );

        expect(
          confirmed?.querySelector(
            '[data-testid="galactic-object-laboratory-facts"]',
          ),
        ).toBeNull();
      },
      30_000,
    );
    it(
      'should show eight emission-nebula diversity controls only for the emission-nebula case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="emission-nebula-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_REFLECTION"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real emission-nebula sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="emission-nebula-diversity-button"][data-sample="D"]',
          )
          ?.click();

        fixture.detectChanges();

        const activeButton =
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="emission-nebula-diversity-button"][data-sample="D"]',
            );

        expect(
          activeButton
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should show eight reflection-nebula diversity controls only for the reflection case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_REFLECTION"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="reflection-nebula-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="reflection-nebula-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real reflection-nebula sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_REFLECTION"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="reflection-nebula-diversity-button"][data-sample="E"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="reflection-nebula-diversity-button"][data-sample="E"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should show eight dark-nebula diversity controls only for the dark-nebula case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_DARK"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="dark-nebula-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="dark-nebula-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-diversity-selector"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="reflection-nebula-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real dark-nebula sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_DARK"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="dark-nebula-diversity-button"][data-sample="F"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="dark-nebula-diversity-button"][data-sample="F"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should show eight planetary-nebula diversity controls only for the planetary-nebula case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_PLANETARY"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="planetary-nebula-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="planetary-nebula-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="emission-nebula-diversity-selector"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="reflection-nebula-diversity-selector"]',
          ),
        ).toBeNull();

        expect(
          element.querySelector(
            '[data-testid="dark-nebula-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real planetary-nebula sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="NEBULA_PLANETARY"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="planetary-nebula-diversity-button"][data-sample="G"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="planetary-nebula-diversity-button"][data-sample="G"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should expose eight LOW H II diversity controls only for the LOW H II case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_LOW"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="hii-low-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="hii-low-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="planetary-nebula-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real LOW H II sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_LOW"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="hii-low-diversity-button"][data-sample="F"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="hii-low-diversity-button"][data-sample="F"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="hii-region-low-render"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should expose eight MODERATE H II diversity controls only for the MODERATE H II case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_MODERATE"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="hii-moderate-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="hii-moderate-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="hii-low-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real MODERATE H II sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_MODERATE"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="hii-moderate-diversity-button"][data-sample="F"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="hii-moderate-diversity-button"][data-sample="F"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="hii-region-moderate-render"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

    it(
      'should expose eight HIGH H II diversity controls only for the HIGH H II case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_HIGH"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="hii-high-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="hii-high-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="hii-low-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real HIGH H II sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_HIGH"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="hii-high-diversity-button"][data-sample="F"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="hii-high-diversity-button"][data-sample="F"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="hii-region-high-render"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );
    it(
      'should expose eight INTENSE H II diversity controls only for the INTENSE H II case',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_INTENSE"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element.querySelector(
            '[data-testid="hii-intense-diversity-selector"]',
          ),
        ).toBeTruthy();

        expect(
          element.querySelectorAll(
            '[data-testid="hii-intense-diversity-button"]',
          ),
        ).toHaveLength(
          8,
        );

        expect(
          element.querySelector(
            '[data-testid="hii-low-diversity-selector"]',
          ),
        ).toBeNull();
      },
      30_000,
    );

    it(
      'should switch all four knowledge projections to the selected real INTENSE H II sample',
      () => {
        const fixture =
          TestBed
            .createComponent(
              GalacticObjectLaboratoryPage,
            );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        element
          .querySelector<HTMLButtonElement>(
            '[data-case="HII_INTENSE"]',
          )
          ?.click();

        fixture.detectChanges();

        const initialLocator =
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent;

        element
          .querySelector<HTMLButtonElement>(
            '[data-testid="hii-intense-diversity-button"][data-sample="F"]',
          )
          ?.click();

        fixture.detectChanges();

        expect(
          element
            .querySelector<HTMLButtonElement>(
              '[data-testid="hii-intense-diversity-button"][data-sample="F"]',
            )
            ?.getAttribute(
              'aria-pressed',
            ),
        ).toBe(
          'true',
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-object-laboratory-active-case"] dd',
            )
            ?.textContent,
        ).not.toBe(
          initialLocator,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="galactic-object-laboratory-state"]',
          ),
        ).toHaveLength(
          4,
        );

        expect(
          element.querySelectorAll(
            '[data-testid="hii-region-intense-render"]',
          ),
        ).toHaveLength(
          4,
        );
      },
      30_000,
    );

  },
);
