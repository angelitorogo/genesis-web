import {
  ComponentFixture,
  TestBed,
} from '@angular/core/testing';

import {
  GeneratorVersion,
} from '../../../domain/generation/generator-version';

import {
  UniverseGenerationKey,
} from '../../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../../domain/universe/universe-seed';

import {
  GalaxyGenerator,
} from '../../../simulation/universe/galaxy-generator';

import {
  createQuasarNucleusRenderModel,
} from './quasar-nucleus-render-model';

import {
  QuasarNucleusRender,
} from './quasar-nucleus-render';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'QuasarNucleusRender',
  () => {
    let fixture:
      ComponentFixture<QuasarNucleusRender>;

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              QuasarNucleusRender,
            ],
          })
          .compileComponents();

        fixture =
          TestBed.createComponent(
            QuasarNucleusRender,
          );

        fixture.componentRef.setInput(
          'model',
          createQuasarNucleusRenderModel(
            GalaxyGenerator.generate(
              GENERATION_KEY,
              331n,
            ),
          ),
        );

        fixture.detectChanges();
      },
    );

    it(
      'should expose a dedicated procedural QUASAR canvas',
      () => {
        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="quasar-nucleus-render"] canvas',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'DISCO HIPERLUMINOSO',
        );

        expect(
          element.textContent,
        ).toContain(
          'VIENTO POLAR',
        );

        expect(
          element.textContent,
        ).toContain(
          'JET SEGÚN FAMILIA',
        );
      },
    );
  },
);
