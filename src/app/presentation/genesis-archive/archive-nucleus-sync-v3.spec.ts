import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GalacticObjectScientificActionType } from '../../domain/galactic-object/galactic-object-scientific-action';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationProgressMilestone } from '../../domain/observation/observation-instrument-progression';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME } from '../runtime/galactic-object-scientific-action.runtime';
import { RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME } from '../runtime/relativistic-jet-analysis-observation.runtime';
import { GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME } from '../runtime/gravitational-lensing-reconstruction-observation.runtime';
import { EXTREME_SCIENTIFIC_COMPLETION_RUNTIME } from '../runtime/extreme-scientific-completion.runtime';
import { ArchiveDiscoveryDetailFacade, ArchiveDiscoveryLocatorKind } from './archive-discovery-detail.facade';

/**
 * GENESIS NUCLEUS-SYNC.1 — a real V3 galactic-centre route (not a generic
 * extreme-object fixture). Auxiliary science must never hold the confirmation
 * card hostage, and an already committed reward must never be re-run by UI.
 */
describe('NUCLEUS-SYNC.1 · active galactic nuclei in V3', () => {
  const key = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
    GeneratorVersion.V3,
  );
  // Real V3 central QUASAR used for the visual regression report.
  const route = {
    locatorKind: ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
    galaxyIndex: '7931794046369509303',
    sectorKey: '0',
    galacticObjectIndex: '0',
    universeSeed: key.universeSeed.serialize(),
    generatorVersionCode: '3',
  } as const;

  function configure(
    postConfirmation: 'pending' | 'failure',
    initialState: DiscoveryStateValue = DiscoveryState.CATALOGUED,
  ) {
    let state: DiscoveryStateValue = initialState;
    let releaseStudies: (() => void) | null = null;
    const blockedStudy = new Promise<void>((resolve) => {
      releaseStudies = resolve;
    });
    const commitAction = vi.fn(async () => {
      state = state.code < DiscoveryState.DISCOVERED.code
        ? DiscoveryState.DISCOVERED
        : state.code < DiscoveryState.CATALOGUED.code
          ? DiscoveryState.CATALOGUED : DiscoveryState.CONFIRMED;
      return {
        actionResult: {
          awardedDiscoveryPoints: 192,
          newDiscoveryState: state,
        },
      };
    });
    const auxiliaryCall = vi.fn(async () => {
      if (postConfirmation === 'pending') await blockedStudy;
      if (postConfirmation === 'failure') throw new Error('instrumento auxiliar temporalmente inaccesible');
      return null;
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          universeRepository: { getAll: async () => [key] },
          discoveryRepository: {
            getState: async () => state,
            getObservationProgressMilestones: async () => Object.values(ObservationProgressMilestone),
            getKnownDiscoveries: async () => { throw new Error('No reconstruir catálogo global.'); },
          },
          pointsRepository: { getGlobalDiscoveryPoints: async () => 100_000n },
        } },
        { provide: GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME, useValue: { commitAction } },
        { provide: RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME, useValue: { inspect: auxiliaryCall } },
        { provide: GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME, useValue: { inspect: auxiliaryCall } },
        { provide: EXTREME_SCIENTIFIC_COMPLETION_RUNTIME, useValue: {
          settle: auxiliaryCall,
          recordEventHorizonSimulationCompletion: async () => undefined,
        } },
      ],
    });
    return {
      facade: TestBed.inject(ArchiveDiscoveryDetailFacade),
      commitAction,
      auxiliaryCall,
      releaseStudies: () => releaseStudies?.(),
    };
  }

  it('publishes CONFIRMED immediately with the same QUASAR 3D while the three studies are unresolved', async () => {
    const { facade, commitAction, auxiliaryCall, releaseStudies } = configure('pending');
    await facade.load(route);
    const render = facade.model()?.galacticObjectCard?.render;
    expect(render?.kind).toMatch(/AGN_NUCLEUS|QUASAR_NUCLEUS/);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
    );

    await facade.performScientificAction();
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CONFIRMED.code);
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(render?.kind);
    expect(facade.model()?.scientificAction).toBeNull();
    expect(facade.refreshRequired()).toBe(false);
    expect(commitAction).toHaveBeenCalledTimes(1);
    expect(auxiliaryCall).toHaveBeenCalledTimes(3);

    releaseStudies();
    await vi.waitFor(() => expect(facade.nucleusSupplementaryWarning()).toBeNull());
    expect(commitAction).toHaveBeenCalledTimes(1);
  });

  it('preserves the same V3 nuclear render across detection, recognition, characterization and confirmation', async () => {
    const { facade, commitAction, releaseStudies } = configure('pending', DiscoveryState.DETECTED);
    await facade.load(route);
    const renderKind = facade.model()?.galacticObjectCard?.render.kind;
    expect(renderKind).toMatch(/AGN_NUCLEUS|QUASAR_NUCLEUS/);
    for (const expected of [
      DiscoveryState.DISCOVERED, DiscoveryState.CATALOGUED, DiscoveryState.CONFIRMED,
    ]) {
      await facade.performScientificAction();
      expect(facade.model()?.discoveryState.code).toBe(expected.code);
      expect(facade.model()?.galacticObjectCard?.render.kind).toBe(renderKind);
      expect(facade.state().kind).toBe('content');
      expect(facade.refreshRequired()).toBe(false);
    }
    expect(commitAction).toHaveBeenCalledTimes(3);
    expect(facade.model()?.scientificAction).toBeNull();
    releaseStudies();
  });

  it('keeps the confirmed scientific state when jets, lensing and completion each reject', async () => {
    const { facade, commitAction } = configure('failure');
    await facade.load(route);
    await facade.performScientificAction();
    await vi.waitFor(() => expect(facade.nucleusSupplementaryWarning()).toContain('jets relativistas'));
    expect(facade.nucleusSupplementaryWarning()).toContain('lente gravitacional');
    expect(facade.nucleusSupplementaryWarning()).toContain('expediente científico');
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CONFIRMED.code);
    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.scientificAction).toBeNull();
    expect(facade.refreshRequired()).toBe(false);
    expect(commitAction).toHaveBeenCalledTimes(1);
  });
});
