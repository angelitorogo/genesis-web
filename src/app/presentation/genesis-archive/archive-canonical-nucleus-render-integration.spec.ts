import {
  TestBed,
} from '@angular/core/testing';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

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
  EventHorizonExternalApproachSimulationEngine,
} from '../../simulation/observation/event-horizon-external-approach-simulation-engine';

import {
  ArchiveGalacticObjectCardAssembler,
} from './archive-galactic-object-card';

import {
  EventHorizonExternalRender,
} from './event-horizon-external-render';

import {
  GalacticObjectProceduralRender,
} from './galactic-object-procedural-render';

describe(
  '28.2G.1 — canonical galactic nucleus in Archive and horizon approach',
  () => {
    const generationKey =
      new UniverseGenerationKey(
        UniverseSeed.parse(
          '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
        ),
        GeneratorVersion.V1,
      );

    beforeEach(
      async () => {
        await TestBed
          .configureTestingModule({
            imports: [
              GalacticObjectProceduralRender,
              EventHorizonExternalRender,
            ],
          })
          .compileComponents();
      },
    );

    it(
      'reuses the canonical SMBH in the confirmed AGN scientific fiche and in its exterior-horizon scene',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                20n,
                0n,
                0n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CONFIRMED,
            );

        expect(
          card.render.blackHoleCoreModel ?? null,
        ).not.toBeNull();

        const scientificFixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        scientificFixture.componentRef.setInput(
          'descriptor',
          card.render,
        );
        scientificFixture.detectChanges();

        const scientificElement =
          scientificFixture.nativeElement as HTMLElement;

        expect(
          scientificElement.querySelector(
            '[data-testid="agn-nucleus-render-canonical-smbh-core"]',
          ),
        ).toBeTruthy();

        const horizonFixture =
          TestBed.createComponent(
            EventHorizonExternalRender,
          );

        horizonFixture.componentRef.setInput(
          'simulation',
          EventHorizonExternalApproachSimulationEngine
            .start(
              EventHorizonExternalApproachSimulationEngine
                .createFromSchwarzschildRadius(
                  100,
                ),
            ),
        );
        horizonFixture.componentRef.setInput(
          'descriptor',
          card.render,
        );
        horizonFixture.componentRef.setInput(
          'hasAccretionDisk',
          true,
        );
        horizonFixture.detectChanges();

        const horizonElement =
          horizonFixture.nativeElement as HTMLElement;

        expect(
          horizonElement.querySelector(
            '[data-testid="agn-nucleus-render-canonical-smbh-core"]',
          ),
        ).toBeTruthy();
      },
    );

    it(
      'reuses the canonical SMBH and QUASAR activity layers in both Archive representations',
      () => {
        const card =
          ArchiveGalacticObjectCardAssembler
            .build(
              generationKey,
              new GalacticObjectLocator(
                331n,
                0n,
                0n,
              ),
              ExplorationResultKind.EXTREME_OBJECT,
              DiscoveryState.CONFIRMED,
            );

        expect(
          card.render.blackHoleCoreModel ?? null,
        ).not.toBeNull();

        const scientificFixture =
          TestBed.createComponent(
            GalacticObjectProceduralRender,
          );

        scientificFixture.componentRef.setInput(
          'descriptor',
          card.render,
        );
        scientificFixture.detectChanges();

        const scientificElement =
          scientificFixture.nativeElement as HTMLElement;

        expect(
          scientificElement.querySelector(
            '[data-testid="quasar-nucleus-render-canonical-smbh-core"]',
          ),
        ).toBeTruthy();

        const horizonFixture =
          TestBed.createComponent(
            EventHorizonExternalRender,
          );

        horizonFixture.componentRef.setInput(
          'simulation',
          EventHorizonExternalApproachSimulationEngine
            .start(
              EventHorizonExternalApproachSimulationEngine
                .createFromSchwarzschildRadius(
                  100,
                ),
            ),
        );
        horizonFixture.componentRef.setInput(
          'descriptor',
          card.render,
        );
        horizonFixture.componentRef.setInput(
          'hasAccretionDisk',
          true,
        );
        horizonFixture.detectChanges();

        const horizonElement =
          horizonFixture.nativeElement as HTMLElement;

        expect(
          horizonElement.querySelector(
            '[data-testid="quasar-nucleus-render-canonical-smbh-core"]',
          ),
        ).toBeTruthy();

        expect(
          horizonElement.querySelector(
            '[data-testid="quasar-nucleus-render-jet-north"]',
          ),
        ).toBeTruthy();

        expect(
          horizonElement.querySelector(
            '[data-testid="quasar-nucleus-render-jet-south"]',
          ),
        ).toBeTruthy();
      },
    );
  },
);
