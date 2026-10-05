import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  DiscoveredToVisitedEntryKind,
} from '../../domain/discovery/discovered-to-visited-entry';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  SystemLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  StellarSystemScientificObservationRuleCode,
} from '../../simulation/observation/stellar-system-scientific-observation-catalog';

import {
  type StellarSystemScientificProgressionSnapshot,
} from '../runtime/stellar-system-scientific-progression.runtime';

import {
  ArchiveDiscoveryDetailFacade,
  ArchiveDiscoveryLocatorKind,
  type ArchiveDiscoveryDetailRequest,
} from './archive-discovery-detail.facade';

describe(
  'ArchiveDiscoveryDetailFacade stage-entry regression',
  () => {
    it(
      'should commit the detailed-card DISCOVERED -> VISITED entry after the fast DETECTED -> DISCOVERED stage',
      async () => {
        const generationKey =
          new UniverseGenerationKey(
            UniverseSeed.parse(
              '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
            ),
            GeneratorVersion.V2,
          );

        const locator =
          new SystemLocator(
            0n,
            0n,
            7n,
          );

        const request:
          ArchiveDiscoveryDetailRequest =
          Object.freeze({
            locatorKind:
              ArchiveDiscoveryLocatorKind.SYSTEM,
            galaxyIndex:
              '0',
            sectorKey:
              '0',
            galacticObjectIndex:
              '7',
            generatorVersionCode:
              '2',
            stellarSystemEntryKind:
              DiscoveredToVisitedEntryKind.DETAILED_CARD,
            includeStellarSystemScientificProgression:
              true,
          });

        const discoveredSnapshot =
          Object.freeze({
            discoveryState:
              DiscoveryState.DISCOVERED,
          }) as unknown as StellarSystemScientificProgressionSnapshot;

        const visitedSnapshot =
          Object.freeze({
            discoveryState:
              DiscoveryState.VISITED,
          }) as unknown as StellarSystemScientificProgressionSnapshot;

        const performObservations =
          vi.fn()
            .mockResolvedValue({
              snapshot:
                discoveredSnapshot,
              stateBefore:
                DiscoveryState.DETECTED,
              stateAfter:
                DiscoveryState.DISCOVERED,
              awardedDiscoveryPoints:
                24,
              persistedEvidence:
                null,
            });

        const recordEntry =
          vi.fn()
            .mockResolvedValue({
              snapshot:
                visitedSnapshot,
              stateBefore:
                DiscoveryState.DISCOVERED,
              stateAfter:
                DiscoveryState.VISITED,
              awardedDiscoveryPoints:
                0,
              persistedEvidence:
                null,
            });

        const resolveDetails =
          vi.fn()
            .mockResolvedValue(
              undefined,
            );

        const noOpSignal = {
          set:
            vi.fn(),
        };

        const harness = {
          currentRequest:
            request,
          currentGenerationKey:
            generationKey,
          currentLocator:
            locator,
          model: () => ({
            discoveryState:
              DiscoveryState.VISITED,
            stellarSystemScientificCampaign: {
              discoveryState:
                DiscoveryState.DETECTED,
              actions: [
                {
                  ruleCode:
                    StellarSystemScientificObservationRuleCode.RESOLVE_NATURE_OPTICAL,
                  isCompleted:
                    false,
                  isAvailable:
                    true,
                },
              ],
            },
          }),
          actionPending: () =>
            false,
          actionPendingSignal:
            noOpSignal,
          actionErrorSignal:
            noOpSignal,
          actionFeedbackSignal:
            noOpSignal,
          stellarSystemScientificProgressionRuntime: {
            performObservations,
            recordEntry,
          },
          resolveDetails,
        };

        await ArchiveDiscoveryDetailFacade
          .prototype
          .performStellarSystemStageObservation
          .call(
            harness as unknown as ArchiveDiscoveryDetailFacade,
          );

        expect(
          performObservations,
        ).toHaveBeenCalledTimes(
          1,
        );

        expect(
          recordEntry,
        ).toHaveBeenCalledWith(
          generationKey,
          locator,
          DiscoveredToVisitedEntryKind.DETAILED_CARD,
        );

        expect(
          resolveDetails,
        ).toHaveBeenCalledWith(
          request,
          visitedSnapshot,
        );
      },
    );
  },
);
