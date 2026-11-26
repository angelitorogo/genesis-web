import { TestBed } from '@angular/core/testing';
import { vi, describe, it, expect } from 'vitest';

import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { GalacticObjectScientificActionType } from '../../domain/galactic-object/galactic-object-scientific-action';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { ObservationProgressMilestone } from '../../domain/observation/observation-instrument-progression';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME } from '../runtime/galactic-object-scientific-action.runtime';
import { EXTREME_SCIENTIFIC_COMPLETION_RUNTIME } from '../runtime/extreme-scientific-completion.runtime';
import { RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME } from '../runtime/relativistic-jet-analysis-observation.runtime';
import { GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME } from '../runtime/gravitational-lensing-reconstruction-observation.runtime';
import { DEFAULT_UNIVERSE_SEED } from '../universe/universe-seed.facade';
import { ArchiveDiscoveryDetailFacade, ArchiveDiscoveryLocatorKind } from './archive-discovery-detail.facade';

/**
 * LIVE-SCI.1: actual V2 active galactic nucleus / QUASAR stage sequence.
 * A successful commit must replace the action on the same mounted Archive
 * detail, without F5 and without a second scientific transaction.
 */
describe('GENESIS LIVE-SCI.1 · scientific stage synchronization', () => {
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse(DEFAULT_UNIVERSE_SEED), GeneratorVersion.V2,
  );
  const route = {
    locatorKind: ArchiveDiscoveryLocatorKind.GALACTIC_OBJECT,
    galaxyIndex: '0', sectorKey: '0', galacticObjectIndex: '0',
    universeSeed: generationKey.universeSeed.serialize(),
    generatorVersionCode: '2',
  } as const;

  function setup(
    mode: 'stale' | 'failed-read' | 'transient' | 'commit-race',
    initial: DiscoveryStateValue = DiscoveryState.DISCOVERED,
  ) {
    let persisted: DiscoveryStateValue = initial;
    let previous: DiscoveryStateValue = persisted;
    let refreshReadOutstanding = 0;
    const commitAction = vi.fn(async () => {
      // Simulate a concurrent tab or a previously committed observation:
      // the transaction detects a newer persisted stage than the Archive card.
      if (mode === 'commit-race') {
        persisted = DiscoveryState.CATALOGUED;
        throw new RangeError(
          'ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION is not available for the current point-12.7 scientific context. matchesScientificTarget=true. isObservationActionAvailable=true. isInstrumentAllowed=true. meetsMinimumInstrumentLevel=true. isStateEligible=false.',
        );
      }
      previous = persisted;
      persisted = persisted.code < DiscoveryState.DISCOVERED.code
        ? DiscoveryState.DISCOVERED
        : persisted.code < DiscoveryState.CATALOGUED.code
          ? DiscoveryState.CATALOGUED : DiscoveryState.CONFIRMED;
      refreshReadOutstanding = mode === 'failed-read' ? 2 : 1;
      return {
        actionResult: { awardedDiscoveryPoints: 96, newDiscoveryState: persisted },
        globalDiscoveryPointsBefore: 100_000n,
        globalDiscoveryPointsAfter: 100_096n,
      };
    });

    TestBed.configureTestingModule({
      providers: [
        { provide: GENESIS_LOCAL_REPOSITORIES, useValue: {
          universeRepository: { getAll: async () => [generationKey] },
          discoveryRepository: {
            getState: async () => {
              if (refreshReadOutstanding > 0) {
                refreshReadOutstanding -= 1;
                if (mode !== 'stale') throw new Error('IndexedDB: lectura temporalmente no disponible');
                return previous;
              }
              return persisted;
            },
            getObservationProgressMilestones: async () => Object.values(ObservationProgressMilestone),
            getKnownDiscoveries: async () => { throw new Error('No se debe leer todo el catálogo.'); },
          },
          pointsRepository: { getGlobalDiscoveryPoints: async () => 100_000n },
        } },
        { provide: GALACTIC_OBJECT_SCIENTIFIC_ACTION_RUNTIME, useValue: { commitAction } },
        { provide: EXTREME_SCIENTIFIC_COMPLETION_RUNTIME, useValue: {
          settle: async () => null,
          recordEventHorizonSimulationCompletion: async () => undefined,
        } },
        { provide: RELATIVISTIC_JET_ANALYSIS_OBSERVATION_RUNTIME, useValue: {
          inspect: async () => null,
        } },
        { provide: GRAVITATIONAL_LENSING_RECONSTRUCTION_OBSERVATION_RUNTIME, useValue: {
          inspect: async () => null,
        } },
      ],
    });
    return {
      facade: TestBed.inject(ArchiveDiscoveryDetailFacade),
      commitAction,
      advancePersisted: () => { persisted = DiscoveryState.CATALOGUED; },
    };
  }

  it('advances from characterization to independent confirmation and to CONFIRMED without F5, even if a readback is stale', async () => {
    const { facade, commitAction } = setup('stale');
    await facade.load(route);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION,
    );
    expect(facade.model()?.scientificAction?.canExecute).toBe(true);
    const originalRenderKind = facade.model()?.galacticObjectCard?.render.kind;
    expect(originalRenderKind).toMatch(/AGN_NUCLEUS|QUASAR_NUCLEUS/);

    await facade.performScientificAction();
    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CATALOGUED.code);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
    );
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(originalRenderKind);
    expect(facade.refreshRequired()).toBe(false);
    expect(facade.actionPending()).toBe(false);
    expect(commitAction).toHaveBeenCalledTimes(1);

    await facade.performScientificAction();
    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CONFIRMED.code);
    expect(facade.model()?.scientificAction).toBeNull();
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(originalRenderKind);
    expect(facade.refreshRequired()).toBe(false);
    expect(commitAction).toHaveBeenCalledTimes(2);
  });

  it('keeps the previous 3D card mounted after a committed action if presentation reload fails, then retries without awarding PD again', async () => {
    const { facade, commitAction } = setup('failed-read');
    await facade.load(route);
    const oldCard = facade.model()?.galacticObjectCard;
    await facade.performScientificAction();

    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.galacticObjectCard).toBe(oldCard);
    expect(facade.refreshRequired()).toBe(true);
    expect(facade.actionError()).toContain('lectura temporalmente no disponible');
    expect(facade.actionPending()).toBe(false);
    await facade.performScientificAction(); // fail-closed: do not reuse the stale action
    expect(commitAction).toHaveBeenCalledTimes(1);

    await facade.retryScientificCardRefresh();
    expect(facade.refreshRequired()).toBe(false);
    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CATALOGUED.code);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
    );
    expect(commitAction).toHaveBeenCalledTimes(1);
  });
  it('keeps a newly DETECTED extreme object visible while recognition enables its next scientific action', async () => {
    const { facade, commitAction } = setup('stale', DiscoveryState.DETECTED);
    await facade.load(route);
    const initialRenderKind = facade.model()?.galacticObjectCard?.render.kind;
    expect(initialRenderKind).toMatch(/AGN_NUCLEUS|QUASAR_NUCLEUS/);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.EXTREME_OBJECT_SURVEY,
    );

    await facade.performScientificAction();

    expect(commitAction).toHaveBeenCalledTimes(1);
    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(initialRenderKind);
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.DISCOVERED.code);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION,
    );
    expect(facade.refreshRequired()).toBe(false);
  });

  it('advances a VISITED/Identidad científica quasar directly to CATALOGUED without a page reload', async () => {
    const { facade, commitAction } = setup('stale', DiscoveryState.VISITED);
    await facade.load(route);
    const sceneKind = facade.model()?.galacticObjectCard?.render.kind;
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.VISITED.code);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_MULTIBAND_CHARACTERIZATION,
    );

    await facade.performScientificAction();

    expect(commitAction).toHaveBeenCalledTimes(1);
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CATALOGUED.code);
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(sceneKind);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
    );
    expect(facade.actionError()).toBeNull();
  });

  it('reconciles a previously advanced scientific stage before submitting a stale action', async () => {
    const { facade, commitAction, advancePersisted } = setup('stale');
    await facade.load(route);
    const originalRenderKind = facade.model()?.galacticObjectCard?.render.kind;
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.DISCOVERED.code);
    advancePersisted(); // a different view completed the characterization

    await facade.performScientificAction();

    expect(commitAction).not.toHaveBeenCalled(); // no second reward
    expect(facade.state().kind).toBe('content');
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(originalRenderKind);
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CATALOGUED.code);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
    );
    expect(facade.actionError()).toBeNull();
    expect(facade.refreshRequired()).toBe(false);
  });

  it('recovers when the transactional recheck detects a concurrent stage advance', async () => {
    const { facade, commitAction } = setup('commit-race');
    await facade.load(route);
    const originalRenderKind = facade.model()?.galacticObjectCard?.render.kind;

    await facade.performScientificAction();

    expect(commitAction).toHaveBeenCalledTimes(1);
    expect(facade.model()?.galacticObjectCard?.render.kind).toBe(originalRenderKind);
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CATALOGUED.code);
    expect(facade.model()?.scientificAction?.actionType).toBe(
      GalacticObjectScientificActionType.ACTIVE_NUCLEUS_INDEPENDENT_CONFIRMATION,
    );
    expect(facade.actionError()).toBeNull();
    expect(facade.refreshRequired()).toBe(false);
    expect(facade.actionFeedback()).toContain('sincronizada');
  });

  it('automatically retries one transient presentation read after the scientific transaction has succeeded', async () => {
    const { facade, commitAction } = setup('transient');
    await facade.load(route);
    await facade.performScientificAction();
    expect(facade.state().kind).toBe('content');
    expect(facade.refreshRequired()).toBe(false);
    expect(facade.model()?.discoveryState.code).toBe(DiscoveryState.CATALOGUED.code);
    expect(facade.actionError()).toBeNull();
    expect(commitAction).toHaveBeenCalledTimes(1);
  });

});
