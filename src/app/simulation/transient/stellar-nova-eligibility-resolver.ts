import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarEvolutionState } from '../../domain/stellar/stellar-evolution-state';
import { type StellarLifetimeProfile } from '../../domain/stellar/stellar-lifetime-profile';
import { type StellarPhysicalProperties } from '../../domain/stellar/stellar-physical-properties';
import { StellarWhiteDwarfComposition } from '../../domain/stellar/stellar-white-dwarf-composition';
import { type StellarSystemComponentLabel } from '../../domain/stellar/stellar-system-component-label';
import {
  NovaProgenitorProfile,
  NovaWhiteDwarfComposition,
} from '../../domain/transient/nova-progenitor';
import { NovaStellarLineage, NovaStellarLineageStage } from '../../domain/transient/nova-stellar-lineage';
import { NovaType } from '../../domain/transient/nova-type';
import { stellarWhiteDwarfCurrentMassSolar } from '../stellar/stellar-white-dwarf-current-mass';
import { NovaEventEngine } from './nova-event-engine';

export interface StellarNovaGroundTruthComponent {
  readonly componentLabel: StellarSystemComponentLabel;
  readonly designation: string;
  readonly physicalProperties: StellarPhysicalProperties;
  readonly lifetimeProfile: StellarLifetimeProfile;
}

export interface StellarNovaInteractionContext {
  readonly generationKey: UniverseGenerationKey;
  readonly innerPeriastronAu: number | null;
  readonly outerPeriastronAu: number | null;
}

export type StellarNovaMassTransferMode = 'ROCHE_LOBE_OVERFLOW' | 'CAPTURED_STELLAR_WIND';

export interface StellarNovaMassTransferAssessment {
  readonly mode: StellarNovaMassTransferMode;
  readonly effectiveAccretionRateSolarPerYear: number;
  readonly donorRocheLobeRadiusAu: number;
  readonly donorRocheFillFactor: number;
}

const NOVA_MAX_INTERACTION_PERIASTRON_AU = 2.5;
const MIN_DONOR_MASS_SOLAR = 0.08;
const SOLAR_RADIUS_AU = 0.004650467260962157;
const RLOF_MIN_FILL_FACTOR = 0.90;
const MIN_WIND_CAPTURE_RATE_SOLAR_PER_YEAR = 1e-11;
const G_SI = 6.67430e-11;
const SOLAR_MASS_KG = 1.98847e30;
const AU_M = 149_597_870_700;

/**
 * 29.2 real-progenitor resolver. A WD + ordinary companion is not enough:
 * the donor must actually be capable of supplying matter either by a nearly
 * filled Roche lobe or by a sufficiently strong, capturable stellar wind.
 */
export class StellarNovaEligibilityResolver {
  private constructor() {}

  static resolveGroundTruthSystem(
    context: StellarNovaInteractionContext,
    components: readonly StellarNovaGroundTruthComponent[],
  ): readonly NovaStellarLineage[] {
    return Object.freeze(components.map(component => resolveComponent(context, component, components)));
  }
}

function resolveComponent(
  context: StellarNovaInteractionContext,
  component: StellarNovaGroundTruthComponent,
  components: readonly StellarNovaGroundTruthComponent[],
): NovaStellarLineage {
  const assessment = component.lifetimeProfile.evolutionAssessment;
  if (assessment.evolutionState.name !== StellarEvolutionState.WHITE_DWARF.name) {
    return ineligible(component);
  }

  const composition = assessment.whiteDwarfComposition;
  if (
    composition?.name !== StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE.name &&
    composition?.name !== StellarWhiteDwarfComposition.OXYGEN_NEON_CORE.name
  ) {
    return ineligible(component);
  }

  const whiteDwarfMassSolar = stellarWhiteDwarfCurrentMassSolar(
    component.physicalProperties,
    component.lifetimeProfile,
  );
  if (whiteDwarfMassSolar === null) return ineligible(component);

  const donor = components
    .filter(candidate => candidate.componentLabel.code !== component.componentLabel.code)
    .map(candidate => {
      const periastronAu = orbitPeriastronBetween(
        context,
        component.componentLabel,
        candidate.componentLabel,
      );
      if (
        periastronAu === null ||
        periastronAu > NOVA_MAX_INTERACTION_PERIASTRON_AU ||
        !isHydrogenRichDonor(candidate)
      ) {
        return null;
      }
      const transfer = assessMassTransfer(
        whiteDwarfMassSolar,
        candidate,
        periastronAu,
      );
      return transfer === null ? null : { candidate, periastronAu, transfer };
    })
    .filter((entry): entry is {
      candidate: StellarNovaGroundTruthComponent;
      periastronAu: number;
      transfer: StellarNovaMassTransferAssessment;
    } => entry !== null)
    .sort((a, b) =>
      b.transfer.effectiveAccretionRateSolarPerYear - a.transfer.effectiveAccretionRateSolarPerYear ||
      a.periastronAu - b.periastronAu,
    )[0];

  if (donor === undefined) return ineligible(component);

  const effectiveAccretionRateSolarPerYear = donor.transfer.effectiveAccretionRateSolarPerYear;
  const ignitionEnvelopeMassSolar = ignitionEnvelopeMass(
    whiteDwarfMassSolar,
    effectiveAccretionRateSolarPerYear,
  );
  const progenitor = new NovaProgenitorProfile(
    whiteDwarfMassSolar,
    donor.candidate.physicalProperties.currentMassSolar,
    assessment.input.metallicitySolarRatio,
    donor.periastronAu,
    effectiveAccretionRateSolarPerYear,
    ignitionEnvelopeMassSolar,
    composition.name === StellarWhiteDwarfComposition.OXYGEN_NEON_CORE.name
      ? NovaWhiteDwarfComposition.OXYGEN_NEON
      : NovaWhiteDwarfComposition.CARBON_OXYGEN,
  );
  const eventProfile = NovaEventEngine.deriveProfile(progenitor);
  const stage = eventProfile.type === NovaType.RECURRENT
    ? NovaStellarLineageStage.RECURRENT_NOVA_CHANNEL
    : NovaStellarLineageStage.CLASSICAL_NOVA_CHANNEL;

  return new NovaStellarLineage(
    component.componentLabel,
    component.designation,
    stage,
    component.lifetimeProfile.ageBillionYears,
    progenitor,
    eventProfile,
    donor.candidate.componentLabel,
  );
}

function ineligible(component: StellarNovaGroundTruthComponent): NovaStellarLineage {
  return new NovaStellarLineage(
    component.componentLabel,
    component.designation,
    NovaStellarLineageStage.INELIGIBLE,
    component.lifetimeProfile.ageBillionYears,
    null,
    null,
    null,
  );
}

function isHydrogenRichDonor(component: StellarNovaGroundTruthComponent): boolean {
  const state = component.lifetimeProfile.evolutionAssessment.evolutionState.name;
  if (
    state === StellarEvolutionState.WHITE_DWARF.name ||
    state === StellarEvolutionState.NEUTRON_STAR.name ||
    state === StellarEvolutionState.STELLAR_BLACK_HOLE.name
  ) return false;
  return component.physicalProperties.currentMassSolar >= MIN_DONOR_MASS_SOLAR;
}

export function assessStellarNovaMassTransfer(
  whiteDwarfMassSolar: number,
  donor: StellarNovaGroundTruthComponent,
  periastronAu: number,
): StellarNovaMassTransferAssessment | null {
  return assessMassTransfer(whiteDwarfMassSolar, donor, periastronAu);
}

function assessMassTransfer(
  whiteDwarfMassSolar: number,
  donor: StellarNovaGroundTruthComponent,
  periastronAu: number,
): StellarNovaMassTransferAssessment | null {
  const donorMassSolar = donor.physicalProperties.currentMassSolar;
  const donorRadiusAu = donor.physicalProperties.radiusSolar * SOLAR_RADIUS_AU;
  const rocheRadiusAu = donorRocheLobeRadiusAu(donorMassSolar, whiteDwarfMassSolar, periastronAu);
  const fillFactor = donorRadiusAu / rocheRadiusAu;

  if (fillFactor >= RLOF_MIN_FILL_FACTOR) {
    const normalizedOverfill = clamp((fillFactor - RLOF_MIN_FILL_FACTOR) / 0.25, 0, 1);
    const donorFactor = clamp(Math.sqrt(donorMassSolar), 0.25, 4);
    const logRate = -9.55 + normalizedOverfill * 3.0 + Math.log10(donorFactor);
    return Object.freeze({
      mode: 'ROCHE_LOBE_OVERFLOW' as const,
      effectiveAccretionRateSolarPerYear: clamp(10 ** logRate, 1e-12, 2.5e-7),
      donorRocheLobeRadiusAu: rocheRadiusAu,
      donorRocheFillFactor: fillFactor,
    });
  }

  const windRate = capturedWindAccretionRateSolarPerYear(
    whiteDwarfMassSolar,
    donor,
    periastronAu,
  );
  if (windRate < MIN_WIND_CAPTURE_RATE_SOLAR_PER_YEAR) return null;

  return Object.freeze({
    mode: 'CAPTURED_STELLAR_WIND' as const,
    effectiveAccretionRateSolarPerYear: windRate,
    donorRocheLobeRadiusAu: rocheRadiusAu,
    donorRocheFillFactor: fillFactor,
  });
}

/** Eggleton Roche-lobe radius evaluated at the closest generated separation. */
export function donorRocheLobeRadiusAu(
  donorMassSolar: number,
  accretorMassSolar: number,
  separationAu: number,
): number {
  if (
    !Number.isFinite(donorMassSolar) || donorMassSolar <= 0 ||
    !Number.isFinite(accretorMassSolar) || accretorMassSolar <= 0 ||
    !Number.isFinite(separationAu) || separationAu <= 0
  ) {
    throw new RangeError('Roche geometry requires positive finite masses and separation.');
  }
  const q = donorMassSolar / accretorMassSolar;
  const q13 = Math.cbrt(q);
  const q23 = q13 * q13;
  const fraction = 0.49 * q23 / (0.6 * q23 + Math.log(1 + q13));
  return separationAu * fraction;
}

function capturedWindAccretionRateSolarPerYear(
  whiteDwarfMassSolar: number,
  donor: StellarNovaGroundTruthComponent,
  periastronAu: number,
): number {
  const state = donor.lifetimeProfile.evolutionAssessment.evolutionState.name;
  const physical = donor.physicalProperties;
  const evolvedWind = state === StellarEvolutionState.GIANT.name || state === StellarEvolutionState.SUPERGIANT.name;
  const hotLuminousWind = physical.luminositySolar >= 1_000 && physical.effectiveTemperatureKelvin >= 10_000;
  if (!evolvedWind && !hotLuminousWind) return 0;

  const donorMass = Math.max(0.08, physical.currentMassSolar);
  const baseWindRate = evolvedWind
    ? 4e-13 * (state === StellarEvolutionState.SUPERGIANT.name ? 1.0 : 0.5) *
      physical.luminositySolar * physical.radiusSolar / donorMass
    : 1e-10 * (physical.luminositySolar / 1_000) ** 1.35;

  const windSpeedKmS = state === StellarEvolutionState.GIANT.name
    ? 25
    : state === StellarEvolutionState.SUPERGIANT.name
      ? 40
      : 900;
  const windSpeedMS = windSpeedKmS * 1_000;
  const accretionRadiusAu = 2 * G_SI * whiteDwarfMassSolar * SOLAR_MASS_KG /
    (windSpeedMS ** 2) / AU_M;
  const captureFraction = clamp((accretionRadiusAu / (2 * periastronAu)) ** 2, 0, 0.25);
  return clamp(baseWindRate * captureFraction, 0, 5e-7);
}

function ignitionEnvelopeMass(wdMass: number, accretionRate: number): number {
  const massTerm = (1 / wdMass) ** 3.2;
  const rateTerm = (1e-9 / accretionRate) ** 0.18;
  return clamp(4.5e-5 * massTerm * rateTerm, 1.5e-7, 8e-4);
}

function orbitPeriastronBetween(
  context: StellarNovaInteractionContext,
  left: StellarSystemComponentLabel,
  right: StellarSystemComponentLabel,
): number | null {
  const names = [left.name, right.name].sort().join('');
  if (names === 'AB') return context.innerPeriastronAu;
  if (left.name === 'C' || right.name === 'C') return context.outerPeriastronAu;
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
