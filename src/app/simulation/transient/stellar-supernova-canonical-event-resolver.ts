import {
  type GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';
import {
  type StellarPopulationProfile,
} from '../../domain/stellar/stellar-population-profile';
import {
  type StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';
import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';
import {
  StellarSystemComponentLabel,
} from '../../domain/stellar/stellar-system-component-label';
import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';
import {
  SupernovaCanonicalEvent,
  SupernovaCanonicalEventTemporalStatus,
} from '../../domain/transient/supernova-canonical-event';
import {
  SupernovaStellarLineageStage,
  type SupernovaStellarLineage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  StellarGenerator,
} from '../stellar/stellar-generator';
import {
  StellarSupernovaEligibilityResolver,
  type StellarSupernovaGroundTruthComponent,
  type StellarSupernovaInteractionContext,
} from './stellar-supernova-eligibility-resolver';

/**
 * 29.1C — materializes the unique canonical supernova event set for a real
 * generated SINGLE/BINARY/TRIPLE system.
 *
 * No PRNG is consumed here and no persistence is performed here. This resolver
 * is pure; DexieSupernovaCanonicalEventRepository owns storage.
 */
export class StellarSupernovaCanonicalEventResolver {
  private constructor() {}

  static resolveGeneratedSystem(
    system: StellarSystem,
    sectorStellarPopulation: GalaxySectorStellarPopulationProperties,
    stellarPopulationProfile: StellarPopulationProfile,
  ): readonly SupernovaCanonicalEvent[] {
    const primaryPhysicalProperties =
      StellarGenerator.generatePhysicalProperties(
        system.generationKey,
        system.locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    const primaryLifetimeProfile =
      StellarGenerator.generateLifetimeProfile(
        system.generationKey,
        system.locator,
        primaryPhysicalProperties,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    return this.resolveSystem(
      system,
      primaryPhysicalProperties,
      primaryLifetimeProfile,
    );
  }

  /**
   * 29.1E adapter for real V2 multihost Ground Truth. This keeps event
   * materialization in the canonical 29.1C resolver instead of duplicating
   * event/status rules in the presentation layer.
   */
  static resolveGroundTruthSystem(
    context: StellarSupernovaInteractionContext,
    components: readonly StellarSupernovaGroundTruthComponent[],
  ): readonly SupernovaCanonicalEvent[] {
    const lineages =
      StellarSupernovaEligibilityResolver.resolveGroundTruthSystem(
        context,
        components,
      );

    return canonicalEventsFromLineages(lineages, components);
  }

  static resolveSystem(
    system: StellarSystem,
    primaryPhysicalProperties: StellarPhysicalProperties,
    primaryLifetimeProfile: StellarLifetimeProfile,
  ): readonly SupernovaCanonicalEvent[] {
    const lineages =
      StellarSupernovaEligibilityResolver.resolveSystem(
        system,
        primaryPhysicalProperties,
        primaryLifetimeProfile,
      );

    const components: readonly StellarSupernovaGroundTruthComponent[] =
      Object.freeze([
        Object.freeze({
          componentLabel: StellarSystemComponentLabel.A,
          designation: system.primaryComponentDesignation.name,
          physicalProperties: primaryPhysicalProperties,
          lifetimeProfile: primaryLifetimeProfile,
        }),
        ...(system.secondaryCompanion === null
          ? []
          : [Object.freeze({
              componentLabel: system.secondaryCompanion.componentLabel,
              designation: system.secondaryCompanion.designation.name,
              physicalProperties: system.secondaryCompanion.physicalProperties,
              lifetimeProfile: system.secondaryCompanion.lifetimeProfile,
            })]),
        ...(system.tertiaryCompanion === null
          ? []
          : [Object.freeze({
              componentLabel: system.tertiaryCompanion.componentLabel,
              designation: system.tertiaryCompanion.designation.name,
              physicalProperties: system.tertiaryCompanion.physicalProperties,
              lifetimeProfile: system.tertiaryCompanion.lifetimeProfile,
            })]),
      ]);

    return canonicalEventsFromLineages(lineages, components);
  }
}

function canonicalEvent(
  lineage: SupernovaStellarLineage,
  lifetime: StellarLifetimeProfile,
): SupernovaCanonicalEvent {
  if (lineage.eventProfile === null) {
    throw new RangeError(
      'Cannot materialize a canonical supernova event without an event profile.',
    );
  }

  if (
    lineage.stage ===
    SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL
  ) {
    return new SupernovaCanonicalEvent(
      lineage.componentLabel,
      lineage.stellarDesignation,
      lineage.stage,
      SupernovaCanonicalEventTemporalStatus.UNRESOLVED_BINARY_DELAY,
      lifetime.ageBillionYears,
      null,
      lineage.requiresBinaryInteraction,
      lineage.eventProfile,
    );
  }

  const eventAge = lifetime.terminalAgeBillionYears;

  if (eventAge === null) {
    throw new RangeError(
      'Core-collapse canonical events require the stellar terminal age from Ground Truth.',
    );
  }

  const temporalStatus =
    lineage.stage ===
      SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT
      ? SupernovaCanonicalEventTemporalStatus.HISTORICAL
      : SupernovaCanonicalEventTemporalStatus.FUTURE_SCHEDULED;

  return new SupernovaCanonicalEvent(
    lineage.componentLabel,
    lineage.stellarDesignation,
    lineage.stage,
    temporalStatus,
    lifetime.ageBillionYears,
    eventAge,
    lineage.requiresBinaryInteraction,
    lineage.eventProfile,
  );
}

function canonicalEventsFromLineages(
  lineages: readonly SupernovaStellarLineage[],
  components: readonly StellarSupernovaGroundTruthComponent[],
): readonly SupernovaCanonicalEvent[] {
  const lifetimeByComponent = new Map<number, StellarLifetimeProfile>(
    components.map((component) => [
      component.componentLabel.code,
      component.lifetimeProfile,
    ]),
  );

  const events = lineages
    .filter((lineage) => lineage.eventProfile !== null)
    .map((lineage) => {
      const lifetime = lifetimeByComponent.get(lineage.componentLabel.code);
      if (lifetime === undefined) {
        throw new RangeError(
          `Missing lifetime Ground Truth for component ${lineage.componentLabel.name}.`,
        );
      }
      return canonicalEvent(lineage, lifetime);
    });

  return Object.freeze(events);
}
