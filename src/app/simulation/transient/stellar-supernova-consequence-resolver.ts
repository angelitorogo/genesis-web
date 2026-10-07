import {
  type SystemLocator,
} from '../../domain/generation/procedural-locator';
import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';
import {
  type SupernovaCanonicalEventRepository,
} from '../../domain/repository/supernova-canonical-event-repository';
import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';
import {
  SupernovaCanonicalEventTemporalStatus,
  type SupernovaCanonicalEvent,
} from '../../domain/transient/supernova-canonical-event';
import {
  SupernovaCompactRemnantKind,
} from '../../domain/transient/supernova-event-profile';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
} from '../../domain/transient/supernova-progenitor';
import {
  SupernovaStellarLineageStage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaStellarConsequence,
  SupernovaStellarConsequenceStatus,
  SupernovaStellarDisposition,
} from '../../domain/transient/supernova-stellar-consequence';
import {
  SupernovaType,
} from '../../domain/transient/supernova-type';

/**
 * 29.1D — projects the stellar/remnant consequence of canonical 29.1C events.
 *
 * No PRNG, clock, persistence write or StellarSystem mutation occurs here.
 * The event profile already carries the remnant decision frozen by 29.1A/29.1B;
 * this resolver turns that decision into an explicit stellar consequence.
 */
export class StellarSupernovaConsequenceResolver {
  private constructor() {}

  static resolveEvent(
    event: SupernovaCanonicalEvent,
  ): SupernovaStellarConsequence {
    if (event.profile.type === SupernovaType.TYPE_IA) {
      return thermonuclearConsequence(event);
    }

    return coreCollapseConsequence(event);
  }

  static resolveEvents(
    events: readonly SupernovaCanonicalEvent[],
  ): readonly SupernovaStellarConsequence[] {
    const seen = new Set<number>();

    const consequences = events.map((event) => {
      if (seen.has(event.componentLabel.code)) {
        throw new RangeError(
          `Duplicate canonical supernova event for component ${event.componentLabel.name}.`,
        );
      }

      seen.add(event.componentLabel.code);
      return this.resolveEvent(event);
    });

    return Object.freeze(consequences);
  }

  /**
   * Convenience read boundary for later scientific fiches/catalogue work.
   * 29.1D derives consequences from persisted 29.1C Ground Truth but does not
   * create a second persisted copy of information already present in the event.
   */
  static async loadPersistedSystem(
    repository: SupernovaCanonicalEventRepository,
    generationKey: UniverseGenerationKey,
    locator: SystemLocator,
  ): Promise<readonly SupernovaStellarConsequence[]> {
    const events = await repository.loadForSystem(generationKey, locator);
    return this.resolveEvents(events);
  }
}

function thermonuclearConsequence(
  event: SupernovaCanonicalEvent,
): SupernovaStellarConsequence {
  const profile = event.profile;

  if (
    profile.progenitor.channel !==
      SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF ||
    profile.compactRemnantKind !== SupernovaCompactRemnantKind.NONE ||
    profile.compactRemnantMassSolar !== null ||
    event.sourceLineageStage !==
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL ||
    event.temporalStatus !==
      SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY ||
    !event.requiresBinaryInteraction
  ) {
    throw new RangeError(
      'TYPE_IA canonical events must describe complete white-dwarf disruption with unresolved binary delay in 29.1D.',
    );
  }

  return new SupernovaStellarConsequence(
    event.componentLabel,
    event.stellarDesignation,
    event.eventKey,
    SupernovaStellarConsequenceStatus.UNRESOLVED_BINARY_DELAY,
    profile.type,
    SupernovaStellarDisposition.DESTROYED,
    null,
    profile.compactRemnantKind,
    0,
    profile.ejectaMassSolar,
    event.eventStellarAgeBillionYears,
  );
}

function coreCollapseConsequence(
  event: SupernovaCanonicalEvent,
): SupernovaStellarConsequence {
  const profile = event.profile;

  if (
    profile.progenitor.channel !== SupernovaProgenitorChannel.CORE_COLLAPSE ||
    event.requiresBinaryInteraction ||
    profile.compactRemnantMassSolar === null ||
    profile.compactRemnantMassSolar <= 0
  ) {
    throw new RangeError(
      'Core-collapse canonical events require one positive compact remnant and no Ia binary flag.',
    );
  }

  assertGroundTruthRemnantHint(
    profile.progenitor.compactRemnantHint,
    profile.compactRemnantKind,
  );

  const postEventEvolutionState =
    remnantEvolutionState(profile.compactRemnantKind);

  const status = consequenceStatus(event);

  return new SupernovaStellarConsequence(
    event.componentLabel,
    event.stellarDesignation,
    event.eventKey,
    status,
    profile.type,
    SupernovaStellarDisposition.COMPACT_REMNANT,
    postEventEvolutionState,
    profile.compactRemnantKind,
    profile.compactRemnantMassSolar,
    profile.ejectaMassSolar,
    event.eventStellarAgeBillionYears,
  );
}

function consequenceStatus(
  event: SupernovaCanonicalEvent,
): SupernovaStellarConsequenceStatus {
  if (
    event.sourceLineageStage ===
      SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT &&
    event.temporalStatus ===
      SupernovaCanonicalEventTemporalStatus.HISTORICAL
  ) {
    return SupernovaStellarConsequenceStatus.REALIZED_HISTORICAL;
  }

  if (
    (event.sourceLineageStage ===
      SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE ||
      event.sourceLineageStage ===
        SupernovaStellarLineageStage.PRE_SUPERNOVA_CORE_COLLAPSE) &&
    event.temporalStatus ===
      SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED
  ) {
    return SupernovaStellarConsequenceStatus.PREDICTED_FUTURE;
  }

  throw new RangeError(
    'Core-collapse event lineage and temporal status are inconsistent with a stellar consequence.',
  );
}


function assertGroundTruthRemnantHint(
  hint: typeof SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR |
    typeof SupernovaProgenitorCompactRemnantHint.STELLAR_BLACK_HOLE |
    null,
  remnantKind: SupernovaCompactRemnantKind,
): void {
  if (hint === null) {
    throw new RangeError(
      'Canonical real-system core collapse requires the compact-remnant hint supplied by stellar Ground Truth.',
    );
  }

  const expectedKind =
    hint === SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR
      ? SupernovaCompactRemnantKind.NEUTRON_STAR
      : SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE;

  if (remnantKind !== expectedKind) {
    throw new RangeError(
      'Canonical supernova compact remnant disagrees with stellar Ground Truth.',
    );
  }
}

function remnantEvolutionState(
  remnantKind: SupernovaCompactRemnantKind,
): StellarEvolutionState {
  if (remnantKind === SupernovaCompactRemnantKind.NEUTRON_STAR) {
    return StellarEvolutionState.NEUTRON_STAR;
  }

  if (remnantKind === SupernovaCompactRemnantKind.STELLAR_BLACK_HOLE) {
    return StellarEvolutionState.STELLAR_BLACK_HOLE;
  }

  throw new RangeError(
    'Core-collapse supernova consequence cannot use compact-remnant kind NONE.',
  );
}
