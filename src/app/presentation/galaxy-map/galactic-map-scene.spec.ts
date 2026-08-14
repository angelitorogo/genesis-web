import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

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
  ExternalGalaxyPreliminaryInformationGenerator,
} from '../../simulation/observation/galaxy/external-galaxy-preliminary-information-generator';

import {
  GalaxyGenerator,
} from '../../simulation/universe/galaxy-generator';

import {
  GalaxyVisualStructureGenerator,
} from '../../simulation/universe/galaxy-visual-structure-generator';

import {
  GalacticMapModel,
} from './galactic-map-model';

import {
  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,
  GalacticMapScene,
  staticPresentationScaleMultiplier,
  staticPresentationTiltRadians,
  type GalacticMapSceneRuntime,
} from './galactic-map-scene';

describe(
  'GalacticMapScene',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    function model(
      galaxyIndex =
        0n,
    ): GalacticMapModel {

      const galaxy =
        GalaxyGenerator.generate(
          generationKey,
          galaxyIndex,
        );

      return new GalacticMapModel(
        generationKey,
        galaxyIndex,
        ExternalGalaxyPreliminaryInformationGenerator
          .generate(
            generationKey,
            galaxyIndex,
            DiscoveryState.DISCOVERED,
          ),
        GalaxyVisualStructureGenerator
          .generate(
            galaxy,
          ),
        galaxy.type,
      );
    }

    let renderCalls:
      GalacticMapModel[];

    let resizeCalls:
      Array<readonly [
        number,
        number,
        number,
      ]>;

    let disposeCalls:
      number;

    beforeEach(
      async () => {
        renderCalls =
          [];

        resizeCalls =
          [];

        disposeCalls =
          0;

        const runtime:
          GalacticMapSceneRuntime =
          {
            resize(
              width,
              height,
              devicePixelRatio,
            ) {
              resizeCalls.push([
                width,
                height,
                devicePixelRatio,
              ]);
            },

            render(
              value,
            ) {
              renderCalls.push(
                value,
              );

              return {
                particleCount:
                  12_000,
              };
            },

            dispose() {
              disposeCalls +=
                1;
            },
          };

        await TestBed
          .configureTestingModule({
            imports: [
              GalacticMapScene,
            ],

            providers: [
              {
                provide:
                  GALACTIC_MAP_SCENE_RUNTIME_FACTORY,

                useValue: () =>
                  runtime,
              },
            ],
          })
          .compileComponents();
      },
    );

    it(
      'should initialize the renderer host and render the supplied map model without requiring WebGL in unit tests',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();

        const element =
          fixture.nativeElement as
            HTMLElement;

        expect(
          element.querySelector(
            '[data-testid="galactic-map-canvas"]',
          ),
        ).toBeTruthy();

        expect(
          renderCalls,
        ).toHaveLength(
          1,
        );

        expect(
          resizeCalls.length,
        ).toBeGreaterThanOrEqual(
          1,
        );

        expect(
          element
            .querySelector(
              '[data-testid="galactic-map-scene"]',
            )
            ?.getAttribute(
              'data-render-state',
            ),
        ).toBe(
          'ready',
        );
      },
    );

    it(
      'should rerender through the same runtime when the Angular input changes',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(
            0n,
          ),
        );

        fixture.detectChanges();

        fixture.componentRef.setInput(
          'model',
          model(
            1n,
          ),
        );

        fixture.detectChanges();

        expect(
          renderCalls,
        ).toHaveLength(
          2,
        );

        expect(
          renderCalls[
            1
          ]
            .galaxyIndex,
        ).toBe(
          1n,
        );
      },
    );

    it(
      'should dispose the renderer runtime when Angular destroys the scene',
      () => {
        const fixture =
          TestBed.createComponent(
            GalacticMapScene,
          );

        fixture.componentRef.setInput(
          'model',
          model(),
        );

        fixture.detectChanges();
        fixture.destroy();

        expect(
          disposeCalls,
        ).toBe(
          1,
        );
      },
    );


    it(
      'should apply the frozen 20-degree depth tilt to both spiral families only',
      () => {
        const spheroidal =
          model(
            0n,
          );

        const barred =
          model(
            1n,
          );

        const spiral =
          model(
            3n,
          );

        const expectedTilt =
          -20 *
          Math.PI /
          180;

        expect(
          staticPresentationTiltRadians(
            barred,
          ),
        ).toBeCloseTo(
          expectedTilt,
          12,
        );

        expect(
          staticPresentationTiltRadians(
            spiral,
          ),
        ).toBeCloseTo(
          expectedTilt,
          12,
        );

        expect(
          staticPresentationTiltRadians(
            spheroidal,
          ),
        ).toBe(
          0,
        );
      },
    );


    it(
      'should apply morphology-specific inspection framing without changing approved spiral or spheroidal framing',
      () => {
        const spheroidal =
          model(
            0n,
          );

        const barred =
          model(
            1n,
          );

        const spiral =
          model(
            3n,
          );

        const dwarf =
          model(
            4n,
          );

        const irregular =
          model(
            10n,
          );

        expect(
          staticPresentationScaleMultiplier(
            spheroidal,
          ),
        ).toBe(
          1,
        );

        expect(
          staticPresentationScaleMultiplier(
            barred,
          ),
        ).toBe(
          1,
        );

        expect(
          staticPresentationScaleMultiplier(
            spiral,
          ),
        ).toBe(
          1,
        );

        expect(
          staticPresentationScaleMultiplier(
            dwarf,
          ),
        ).toBe(
          1.34,
        );

        expect(
          staticPresentationScaleMultiplier(
            irregular,
          ),
        ).toBe(
          1.20,
        );
      },
    );
  },
);
