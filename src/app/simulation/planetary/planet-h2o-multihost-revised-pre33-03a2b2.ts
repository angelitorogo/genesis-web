import type { PlanetH2OFormationContractPRE3303A } from '../../domain/planetary/planet-h2o-formation-contract-pre33-03a';
import type { PlanetaryVolatilesHistoryResult32_3 } from '../../domain/planetary-history/planetary-volatiles-history-32-3';
import type { GeneratedMultipleHost, GeneratedPublicPlanet } from '../stellar/stellar-multihost-formation';
import { StellarMultihostCoEvalRevisionPRE3303A2B2 } from '../stellar/stellar-multihost-coeval-revision-pre33-03a2b2';
import { MULTIHOST_COEVAL_REVISION_PRE3303A2B2 } from '../../domain/stellar/stellar-multihost-coeval-revision-pre33-03a2b2';
import { PlanetH2OMultihostForcingPRE3303A2B } from './planet-h2o-multihost-forcing-pre33-03a2b';
import {
  H2O_MULTIPLE_REVISED_PRE3303A2B2,
  type H2OMultipleRevisedPRE3303A2B2,
  type H2OMultipleRevisedStatusPRE3303A2B2,
} from '../../domain/planetary/planet-h2o-multihost-revised-pre33-03a2b2';
import type { MultipleStellarGeometryPRE3303A2B, MultipleH2OResultPRE3303A2B } from '../../domain/planetary/planet-h2o-multihost-forcing-pre33-03a2b';

/** Read-only scientific connection, NOT the atomic V2 physics migration.
 * Historical H2O requires a new stellar revision *and* a self-consistent
 * planet/atmosphere history. Until new planet snapshots exist, the old planet
 * may be used as a CONDITIONAL forcing reference only if none of its stellar
 * hosts changes its current evolutionary family in the coeval revision.
 */
export class PlanetH2OMultihostRevisedPRE3303A2B2 {
  private constructor() {}
  static project(
    mult: GeneratedMultipleHost,
    entry: GeneratedPublicPlanet,
    formation: PlanetH2OFormationContractPRE3303A,
    phase32?: PlanetaryVolatilesHistoryResult32_3,
  ): H2OMultipleRevisedPRE3303A2B2 {
    if (!mult.publicPlanets.includes(entry) || entry.atmosphere.hostPlanet !== entry.planet ||
      entry.host === 'C' && mult.components.length !== 3) {
      throw new RangeError('PRE33A2B2_FOREIGN_PUBLIC_PLANET');
    }
    const scientificSource = StellarMultihostCoEvalRevisionPRE3303A2B2.fromFrozenSource(
      mult, MULTIHOST_COEVAL_REVISION_PRE3303A2B2,
    );
    const build = (
      status: H2OMultipleRevisedStatusPRE3303A2B2,
      conditionalH2O: MultipleH2OResultPRE3303A2B | null = null,
    ): H2OMultipleRevisedPRE3303A2B2 => Object.freeze({
      contractVersion: H2O_MULTIPLE_REVISED_PRE3303A2B2,
      status, scientificSource, conditionalH2O,
      historicalForcingIsHypothetical: true as const,
      copiedFrozenPlanetSnapshot: true as const,
      noAutomaticSavedUniverseMigration: true as const,
      oceanCT0Certified: false as const,
    });
    if (!scientificSource.coevalPhysicsRecomputed) return build('REVISED_CHRONOLOGY_UNRESOLVED');
    if (scientificSource.components.some(c => c.phaseChanged))
      return build('REQUIRES_ATOMIC_PLANET_REGENERATION');
    const hosts = scientificSource.components.map((component, i) => {
      const frozen = mult.components[i]!;
      const assessment = component.revisedLifetime.evolutionAssessment;
      return Object.freeze({
        label: component.label,
        source: Object.freeze({
          ageBillionYears: component.revisedAgeBillionYears,
          massSolar: frozen.physical.currentMassSolar,
          initialMassSolar: component.initialMassSolar,
          luminositySolar: component.referenceLuminositySolar,
          mainSequenceLifetimeBillionYears: assessment.mainSequenceLifetimeBillionYears,
          postMainSequenceDurationBillionYears: assessment.postMainSequenceDurationBillionYears,
          evolutionState: assessment.evolutionState.name === 'MAIN_SEQUENCE' ? 'MAIN_SEQUENCE' as const : 'OTHER' as const,
          stellarState: assessment.evolutionState.name,
          sourceRecordKey: `COEVAL_VERSIONED_03A2B2/${scientificSource.systemKey}/${component.label}`,
          orbitalFluxGeometry: 'UNRESOLVED_MULTIPLE_FLUX' as const,
          luminosityBasis: 'FROZEN_15_1_REFERENCE_NOT_HISTORICAL_TRACK' as const,
        }),
      });
    });
    const geometry: MultipleStellarGeometryPRE3303A2B = {
      systemSourceKey: scientificSource.systemKey,
      multiplicity: scientificSource.components.length === 3 ? 'TRIPLE' : 'BINARY',
      hosts, innerOrbit: mult.innerOrbit, outerOrbit: mult.outerOrbit,
      planetHost: entry.host, planetOrbit: entry.planet.orbit,
      orbitalModel: 'FROZEN_16_KEPLERIAN_REFERENCE_NO_PHASE',
      scientificChronologyRevision: scientificSource.contractVersion,
    };
    const h2o = PlanetH2OMultihostForcingPRE3303A2B.project(
      entry.planet, entry.atmosphere, formation, geometry, phase32,
    );
    return build(h2o.status.startsWith('MODELED_DATED_CONDITIONAL_MULTIPLE_') ?
      'VERSIONED_COEVAL_HISTORY_CONDITIONAL' : 'NO_RESOLVED_FORCING_OR_SURFACE', h2o);
  }
}
