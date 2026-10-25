import { GeneratorVersion } from '../../domain/generation/generator-version';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import type { SystemLocator } from '../../domain/generation/procedural-locator';
import { StellarEvolutionInput } from '../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { StellarEvolutionEngine } from './stellar-evolution-engine';
import { StellarMultihostFormation, type GeneratedMultipleHost } from './stellar-multihost-formation';
import {
  MULTIHOST_COEVAL_REVISION_PRE3303A2B2,
  MULTIHOST_FROZEN_SOURCE_PRE3303A2B2,
  type MultihostCoEvalPhysicalRevisionPRE3303A2B2,
  type MultihostRevisedComponentPRE3303A2B2,
  type MultihostRevisionStatusPRE3303A2B2,
} from '../../domain/stellar/stellar-multihost-coeval-revision-pre33-03a2b2';

const AGE_LIMIT_GYR = 13.8;
const validAge = (v: number): boolean => Number.isFinite(v) && v >= 0 && v <= AGE_LIMIT_GYR;
const systemKey = (loc: SystemLocator): string =>
  `G${loc.galaxyIndex}/S${loc.sectorKey}/O${loc.galacticObjectIndex}`;

/**
 * A genuinely separate versioned PHYSICAL CHRONOLOGY source. The frozen
 * StellarMultihostFormation.generateOrNull V1/V2 implementation is NOT patched.
 *
 * Reuse frozen initial masses, metallicities, source seeds and orbit/planet
 * identities as inputs only. In this opt-in revision *all* stellar lifetimes
 * are created from a single formation clock (primary A). B/C's independent
 * age draws are NOT inputs of their revised phase-14 physical assessments.
 *
 * No revised Star, planetary system, moon, atmosphere or Phase-32 history is
 * returned. Those must be regenerated atomically by an explicitly versioned
 * PUBLIC gameplay release; substituting revised lifetimes in old entities is
 * physically unsafe. This source is usable now for controlled scientific
 * modeling, and is NOT a migration or a release of GeneratorVersion.V3.
 */
export class StellarMultihostCoEvalRevisionPRE3303A2B2 {
  private constructor() {}

  static generateForScientificRevisionOrNull(
    key: UniverseGenerationKey,
    locator: SystemLocator,
    requestedVersion: typeof MULTIHOST_COEVAL_REVISION_PRE3303A2B2,
  ): MultihostCoEvalPhysicalRevisionPRE3303A2B2 | null {
    if (key.generatorVersion !== GeneratorVersion.V2 ||
        requestedVersion !== MULTIHOST_COEVAL_REVISION_PRE3303A2B2) {
      throw new RangeError('PRE33A2B2_EXPLICIT_V2_SCIENTIFIC_REVISION_REQUIRED');
    }
    const oldSource = StellarMultihostFormation.generateOrNull(key, locator);
    return oldSource === null ? null : this.fromFrozenSource(oldSource, requestedVersion);
  }

  /** Fast read-only adapter for an already evaluated old V2 multiple system. */
  static fromFrozenSource(
    oldSource: GeneratedMultipleHost,
    requestedVersion: typeof MULTIHOST_COEVAL_REVISION_PRE3303A2B2,
  ): MultihostCoEvalPhysicalRevisionPRE3303A2B2 {
    if (oldSource.parentGenerationKey.generatorVersion !== GeneratorVersion.V2 ||
        requestedVersion !== MULTIHOST_COEVAL_REVISION_PRE3303A2B2 ||
        ![2, 3].includes(oldSource.components.length) ||
        oldSource.components.map(c => c.label).join('') !==
        (oldSource.components.length === 2 ? 'AB' : 'ABC')) {
      throw new RangeError('PRE33A2B2_FOREIGN_OR_NONVERSIONED_MULTIPLE_SOURCE');
    }
    const age = oldSource.components[0]!.lifetime.ageBillionYears;
    const records: MultihostRevisedComponentPRE3303A2B2[] = [];
    let status: MultihostRevisionStatusPRE3303A2B2 = 'COEVAL_PHYSICAL_SOURCE_READY';
    let reason = 'Formation coevality is a revised scientific model; existing V2 snapshots remain unaltered.';
    if (!validAge(age)) {
      status = 'INVALID_PRIMARY_CHRONOLOGY';
      reason = 'Primary A has no usable frozen formation epoch.';
    }
    if (status === 'COEVAL_PHYSICAL_SOURCE_READY') {
      for (const component of oldSource.components) {
        const oldAssessment = component.lifetime.evolutionAssessment;
        const mass = component.physical.initialMassSolar;
        const metallicity = oldAssessment.input.metallicitySolarRatio;
        if (!Number.isFinite(mass) || mass <= 0 || !Number.isFinite(metallicity) || metallicity < 0 ||
          oldAssessment.input.initialMassSolar !== mass || !validAge(component.lifetime.ageBillionYears)) {
          status = 'INVALID_COMPONENT_PHYSICS';
          reason = `Invalid initial mass, metallicity or frozen stellar physics for ${component.label}.`;
          break;
        }
        // The FROZEN PRIVATE key remains V1, as required by phase-14.8.
        // No new stochastic draw, no retroactive phase match requirement.
        const input = new StellarEvolutionInput(mass, metallicity, age);
        const revised = StellarEvolutionEngine.evaluate(component.internalGenerationKey, input);
        const main = revised.mainSequenceLifetimeBillionYears;
        const post = revised.postMainSequenceDurationBillionYears;
        const terminal = main === null || post === null ? null : main + post;
        const lifetime = new StellarLifetimeProfile(age, terminal,
          terminal === null ? null : Math.max(0, terminal - age), revised);
        records.push(Object.freeze({
          label: component.label,
          physicalScopeSeed: component.internalGenerationKey.universeSeed.normalizedValue,
          frozenAgeBillionYears: component.lifetime.ageBillionYears,
          revisedAgeBillionYears: age,
          initialMassSolar: mass,
          metallicitySolarRatio: metallicity,
          referenceLuminositySolar: component.physical.luminositySolar,
          frozenEvolutionState: oldAssessment.evolutionState.name,
          revisedEvolutionState: revised.evolutionState.name,
          revisedLifetime: lifetime,
          phaseChanged: revised.evolutionState.name !== oldAssessment.evolutionState.name,
        }));
      }
    }
    return Object.freeze({
      contractVersion: MULTIHOST_COEVAL_REVISION_PRE3303A2B2,
      parentSourceVersion: MULTIHOST_FROZEN_SOURCE_PRE3303A2B2,
      parentGenerationVersion: 'V2' as const,
      systemKey: systemKey(oldSource.parentLocator),
      sharedFormationAgeBillionYears: age,
      components: Object.freeze(records),
      status, statusExplanation: reason,
      coevalPhysicsRecomputed: status === 'COEVAL_PHYSICAL_SOURCE_READY' &&
        records.length === oldSource.components.length,
      legacyUniverseUnmodified: true as const,
      phase32Unmodified: true as const,
      gameCutoverActivated: false as const,
      migrationRequiresAtomicRegeneration: true as const,
      ct0WaterCertified: false as const,
      planetRecordsCompatibleWithoutMigration: false as const,
    });
  }
}
