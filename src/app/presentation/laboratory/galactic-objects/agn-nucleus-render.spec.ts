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
  createAgnNucleusRenderModel,
} from './agn-nucleus-render-model';

import {
  AgnNucleusRender,
} from './agn-nucleus-render';

const GENERATION_KEY =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V1,
  );

describe(
  'AgnNucleusRender',
  () => {
    let fixture:
      ComponentFixture<AgnNucleusRender>;

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              AgnNucleusRender,
            ],
          })
          .compileComponents();

        fixture =
          TestBed.createComponent(
            AgnNucleusRender,
          );

        fixture.componentRef.setInput(
          'model',
          createAgnNucleusRenderModel(
            GalaxyGenerator.generate(
              GENERATION_KEY,
              20n,
            ),
          ),
        );

        fixture.detectChanges();
      },
    );

    it(
      'should expose a dedicated procedural AGN canvas',
      () => {
        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="agn-nucleus-render"] canvas',
          ),
        ).toBeTruthy();

        expect(
          element.textContent,
        ).toContain(
          'DISCO DE ACRECIÓN',
        );

        expect(
          element.textContent,
        ).toContain(
          'SOMBRA DEL SMBH',
        );
      },
    );
  },
);
