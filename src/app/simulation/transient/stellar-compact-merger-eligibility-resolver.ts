import { type CompactBinarySystem } from '../../domain/stellar/compact-binary-system';
import { StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import { CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerStellarLineage, CompactMergerStellarLineageStage } from '../../domain/transient/compact-merger-stellar-lineage';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { CompactMergerEventEngine } from './compact-merger-event-engine';
import { eccentricInspiralReferenceYears } from './stellar-kilonova-eligibility-resolver';

const MAX_MERGER_DELAY_YEARS = 13.8e9;

export interface StellarCompactMergerDesignations { readonly A: string; readonly B: string; }

/** 29.4 projects only the EXISTING compact inner A-B pair. */
export class StellarCompactMergerEligibilityResolver {
  private constructor() {}

  static resolve(binary: CompactBinarySystem | null, designations: StellarCompactMergerDesignations): CompactMergerStellarLineage | null {
    if (binary === null || !['NS_NS', 'NS_BH', 'BH_BH'].includes(binary.kind)) return null;
    const inspiralYears = eccentricInspiralReferenceYears(
      binary.referenceCircularInspiralYears,
      binary.originalInnerOrbit.eccentricity,
    );
    if (!Number.isFinite(inspiralYears) || inspiralYears <= 0 || inspiralYears > MAX_MERGER_DELAY_YEARS) return null;

    const type = binary.kind === 'NS_NS'
      ? CompactMergerType.NEUTRON_STAR_NEUTRON_STAR
      : binary.kind === 'NS_BH'
        ? CompactMergerType.NEUTRON_STAR_BLACK_HOLE
        : CompactMergerType.BLACK_HOLE_BLACK_HOLE;
    const stage = binary.kind === 'NS_NS'
      ? CompactMergerStellarLineageStage.FUTURE_NS_NS_MERGER
      : binary.kind === 'NS_BH'
        ? CompactMergerStellarLineageStage.FUTURE_NS_BH_MERGER
        : CompactMergerStellarLineageStage.FUTURE_BH_BH_MERGER;
    const nsMembers = [binary.primary, binary.secondary].filter(member => member.remnantKind === 'NEUTRON_STAR');
    const nsRadius = nsMembers.length === 0
      ? null
      : nsMembers.reduce((sum, member) => sum + member.referenceRadiusKm, 0) / nsMembers.length;
    const progenitor = new CompactMergerProgenitorProfile(
      type,
      binary.primary.massSolar,
      binary.secondary.massSolar,
      nsRadius,
      binary.originalInnerOrbit.semiMajorAxisAu,
      binary.originalInnerOrbit.eccentricity,
      inspiralYears,
    );
    const currentAge = Math.max(binary.primary.currentAgeBillionYears, binary.secondary.currentAgeBillionYears);
    return new CompactMergerStellarLineage(
      stage,
      StellarSystemComponentLabel.A,
      StellarSystemComponentLabel.B,
      designations.A,
      designations.B,
      currentAge,
      progenitor,
      CompactMergerEventEngine.deriveProfile(progenitor),
    );
  }
}
