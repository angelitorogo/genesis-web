import { CompactMergerCounterpartKind, CompactMergerEventProfile, CompactMergerMassBudgetResolution, CompactMergerRemnantKind } from '../../domain/transient/compact-merger-event-profile';
import { type CompactMergerProgenitorProfile } from '../../domain/transient/compact-merger-progenitor';
import { CompactMergerType } from '../../domain/transient/compact-merger-type';
import { KilonovaRemnantKind } from '../../domain/transient/kilonova-event-profile';
import { KilonovaProgenitorProfile } from '../../domain/transient/kilonova-progenitor';
import { KilonovaType } from '../../domain/transient/kilonova-type';
import { KilonovaEventEngine } from './kilonova-event-engine';

/**
 * 29.4 canonical compact-merger physics.
 *
 * NS-NS deliberately reuses the already-validated 29.3 mass budget so the same
 * physical pair cannot acquire two incompatible remnants. NS-BH/BH-BH mergers
 * are canonical even without Kerr spin, but final mass/ejecta/radiated mass stay
 * unresolved until spin/orientation physics exists. No waveform belongs here.
 */
export class CompactMergerEventEngine {
  private constructor() {}

  static deriveProfile(progenitor: CompactMergerProgenitorProfile): CompactMergerEventProfile {
    if (progenitor.type === CompactMergerType.NEUTRON_STAR_NEUTRON_STAR) {
      const kilonova = KilonovaEventEngine.deriveProfile(new KilonovaProgenitorProfile(
        KilonovaType.BINARY_NEUTRON_STAR,
        progenitor.primaryMassSolar,
        progenitor.secondaryMassSolar,
        progenitor.neutronStarReferenceRadiusKm!,
        progenitor.orbitalSemiMajorAxisAu,
        progenitor.orbitalEccentricity,
        progenitor.referenceInspiralYears,
        null,
        null,
      ));
      const radiated = progenitor.totalMassSolar - kilonova.remnantMassSolar - kilonova.totalEjectaMassSolar;
      return new CompactMergerEventProfile(
        progenitor.type,
        progenitor,
        progenitor.totalMassSolar,
        progenitor.chirpMassSolar,
        progenitor.massRatio,
        progenitor.symmetricMassRatio,
        CompactMergerCounterpartKind.KILONOVA_EXPECTED,
        CompactMergerMassBudgetResolution.NS_NS_KILONOVA_CONSTRAINED,
        mapKilonovaRemnant(kilonova.remnantKind),
        kilonova.remnantMassSolar,
        kilonova.totalEjectaMassSolar,
        radiated,
      );
    }

    const counterpart = progenitor.type === CompactMergerType.NEUTRON_STAR_BLACK_HOLE
      ? CompactMergerCounterpartKind.KILONOVA_TIDAL_DISRUPTION_UNRESOLVED
      : CompactMergerCounterpartKind.NO_PROMPT_ELECTROMAGNETIC_COUNTERPART_EXPECTED;

    return new CompactMergerEventProfile(
      progenitor.type,
      progenitor,
      progenitor.totalMassSolar,
      progenitor.chirpMassSolar,
      progenitor.massRatio,
      progenitor.symmetricMassRatio,
      counterpart,
      CompactMergerMassBudgetResolution.BH_SPIN_UNRESOLVED,
      CompactMergerRemnantKind.STELLAR_BLACK_HOLE,
      null,
      null,
      null,
    );
  }
}

function mapKilonovaRemnant(kind: typeof KilonovaRemnantKind[keyof typeof KilonovaRemnantKind]): typeof CompactMergerRemnantKind[keyof typeof CompactMergerRemnantKind] {
  if (kind === KilonovaRemnantKind.MASSIVE_NEUTRON_STAR) return CompactMergerRemnantKind.MASSIVE_NEUTRON_STAR;
  if (kind === KilonovaRemnantKind.HYPERMASSIVE_NEUTRON_STAR) return CompactMergerRemnantKind.HYPERMASSIVE_NEUTRON_STAR;
  return CompactMergerRemnantKind.STELLAR_BLACK_HOLE;
}
