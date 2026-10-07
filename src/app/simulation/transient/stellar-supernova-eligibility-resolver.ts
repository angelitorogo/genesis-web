import {
  type GalaxySectorStellarPopulationProperties,
} from '../../domain/sector/galaxy-sector-stellar-population-properties';
import {
  type UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';
import {
  type StellarPopulationProfile,
} from '../../domain/stellar/stellar-population-profile';
import {
  type StellarCompanion,
} from '../../domain/stellar/stellar-companion';
import {
  type StellarEvolutionAssessment,
} from '../../domain/stellar/stellar-evolution-assessment';
import {
  StellarEvolutionInput,
} from '../../domain/stellar/stellar-evolution-input';
import {
  StellarEvolutionState,
} from '../../domain/stellar/stellar-evolution-state';
import {
  type StellarLifetimeProfile,
} from '../../domain/stellar/stellar-lifetime-profile';
import {
  type StellarPhysicalProperties,
} from '../../domain/stellar/stellar-physical-properties';
import {
  StellarSystemComponentLabel,
  type StellarSystemComponentLabel as StellarSystemComponentLabelValue,
} from '../../domain/stellar/stellar-system-component-label';
import {
  type StellarSystem,
} from '../../domain/stellar/stellar-system';
import {
  StellarWhiteDwarfComposition,
} from '../../domain/stellar/stellar-white-dwarf-composition';
import {
  StellarBlackHoleFormationChannel,
} from '../../domain/stellar/stellar-black-hole-formation-channel';
import {
  SupernovaStellarLineage,
  SupernovaStellarLineageStage,
} from '../../domain/transient/supernova-stellar-lineage';
import {
  SupernovaProgenitorChannel,
  SupernovaProgenitorCompactRemnantHint,
  SupernovaProgenitorProfile,
} from '../../domain/transient/supernova-progenitor';
import {
  StellarEvolutionEngine,
} from '../stellar/stellar-evolution-engine';
import {
  StellarGenerator,
} from '../stellar/stellar-generator';
import {
  SupernovaEventEngine,
} from './supernova-event-engine';

const TERMINAL_EPSILON_GYR = 1e-9;
const IA_TARGET_WHITE_DWARF_MASS_SOLAR = 1.38;
const IA_MIN_BASE_WHITE_DWARF_MASS_SOLAR = 0.50;
const IA_MAX_BASE_CO_WHITE_DWARF_MASS_SOLAR = 1.18;
const IA_NON_DEGENERATE_TRANSFER_FRACTION = 0.30;
const BINARY_STRIPPING_TIGHT_PERIASTRON_AU = 0.15;
const BINARY_STRIPPING_CLOSE_PERIASTRON_AU = 0.60;
const BINARY_STRIPPING_INTERACTION_PERIASTRON_AU = 2.50;

export interface StellarSupernovaGroundTruthComponent {
  readonly componentLabel: StellarSystemComponentLabelValue;
  readonly designation: string;
  readonly physicalProperties: StellarPhysicalProperties;
  readonly lifetimeProfile: StellarLifetimeProfile;
}

export interface StellarSupernovaInteractionContext {
  readonly generationKey: UniverseGenerationKey;
  readonly innerPeriastronAu: number | null;
  readonly outerPeriastronAu: number | null;
}

/**
 * 29.1B — translates the already-generated stellar Ground Truth into the
 * compact 29.1A supernova progenitor envelope.
 *
 * It deliberately does not roll PRNG, schedule dates, persist events or mutate
 * stars. Terminal fate is asked back to StellarEvolutionEngine so 29.1B cannot
 * drift away from the frozen stellar-evolution rules.
 */
export class StellarSupernovaEligibilityResolver {
  private constructor() {}

  /**
   * Preferred production entry point: rematerializes primary A through the
   * frozen StellarGenerator branch and then resolves A/B/C together.
   */
  static resolveGeneratedSystem(
    system: StellarSystem,
    sectorStellarPopulation: GalaxySectorStellarPopulationProperties,
    stellarPopulationProfile: StellarPopulationProfile,
  ): readonly SupernovaStellarLineage[] {
    const primaryPhysicalProperties =
      StellarGenerator.generatePhysicalProperties(
        system.generationKey,
        system.locator,
        sectorStellarPopulation,
        stellarPopulationProfile,
      );

    const primaryLifetimeProfile = StellarGenerator.generateLifetimeProfile(
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

  static resolveSystem(
    system: StellarSystem,
    primaryPhysicalProperties: StellarPhysicalProperties,
    primaryLifetimeProfile: StellarLifetimeProfile,
  ): readonly SupernovaStellarLineage[] {
    assertPrimaryConsistency(
      primaryPhysicalProperties,
      primaryLifetimeProfile,
    );

    const components: StellarSupernovaGroundTruthComponent[] = [
      {
        componentLabel: StellarSystemComponentLabel.A,
        designation: system.primaryComponentDesignation.name,
        physicalProperties: primaryPhysicalProperties,
        lifetimeProfile: primaryLifetimeProfile,
      },
    ];

    if (system.secondaryCompanion !== null) {
      components.push(componentFromCompanion(system.secondaryCompanion));
    }

    if (system.tertiaryCompanion !== null) {
      components.push(componentFromCompanion(system.tertiaryCompanion));
    }

    return this.resolveGroundTruthSystem(
      interactionContextFromSystem(system),
      components,
    );
  }

  /**
   * 29.1E integration boundary for V2 multihost systems whose A/B/C stars are
   * independent frozen physical hosts rather than V1 StellarCompanion objects.
   * The same 29.1B physics is reused; callers only supply the already-generated
   * component Ground Truth and the real A-B/(A+B)-C periastra.
   */
  static resolveGroundTruthSystem(
    context: StellarSupernovaInteractionContext,
    components: readonly StellarSupernovaGroundTruthComponent[],
  ): readonly SupernovaStellarLineage[] {
    assertGroundTruthComponents(components);

    return Object.freeze(
      components.map((component) =>
        resolveComponent(context, component, components),
      ),
    );
  }
}

function resolveComponent(
  context: StellarSupernovaInteractionContext,
  component: StellarSupernovaGroundTruthComponent,
  allComponents: readonly StellarSupernovaGroundTruthComponent[],
): SupernovaStellarLineage {
  const assessment = component.lifetimeProfile.evolutionAssessment;
  const terminalAssessment = resolveTerminalAssessment(
    context.generationKey,
    component.lifetimeProfile,
  );

  if (isDirectCollapse(terminalAssessment)) {
    return lineage(
      component,
      terminalAssessment,
      SupernovaStellarLineageStage.DIRECT_COLLAPSE_NO_SUPERNOVA,
      null,
      false,
    );
  }

  if (isCoreCollapseTerminalState(terminalAssessment?.evolutionState ?? null)) {
    const progenitor = coreCollapseProgenitor(
      context,
      component,
      terminalAssessment!,
      allComponents,
    );
    const currentState = assessment.evolutionState;

    const stage =
      sameState(currentState, StellarEvolutionState.NEUTRON_STAR) ||
      sameState(currentState, StellarEvolutionState.STELLAR_BLACK_HOLE)
        ? SupernovaStellarLineageStage.POST_CORE_COLLAPSE_REMNANT
        : sameState(currentState, StellarEvolutionState.SUPERGIANT)
          ? SupernovaStellarLineageStage.PRE_SUPERNOVA_CORE_COLLAPSE
          : SupernovaStellarLineageStage.FUTURE_CORE_COLLAPSE;

    return lineage(component, terminalAssessment, stage, progenitor, false);
  }

  if (
    sameState(assessment.evolutionState, StellarEvolutionState.WHITE_DWARF) &&
    assessment.whiteDwarfComposition?.name ===
      StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE.name &&
    hasCompatibleIaMassReservoir(context, component, allComponents)
  ) {
    const progenitor = new SupernovaProgenitorProfile(
      SupernovaProgenitorChannel.THERMONUCLEAR_WHITE_DWARF,
      assessment.input.initialMassSolar,
      IA_TARGET_WHITE_DWARF_MASS_SOLAR,
      assessment.input.metallicitySolarRatio,
      0,
      0,
      IA_TARGET_WHITE_DWARF_MASS_SOLAR,
    );

    return lineage(
      component,
      terminalAssessment,
      SupernovaStellarLineageStage.THERMONUCLEAR_BINARY_CHANNEL,
      progenitor,
      true,
    );
  }

  return lineage(
    component,
    terminalAssessment,
    SupernovaStellarLineageStage.INELIGIBLE,
    null,
    false,
  );
}

function lineage(
  component: StellarSupernovaGroundTruthComponent,
  terminalAssessment: StellarEvolutionAssessment | null,
  stage: SupernovaStellarLineageStage,
  progenitor: SupernovaProgenitorProfile | null,
  requiresBinaryInteraction: boolean,
): SupernovaStellarLineage {
  const assessment = component.lifetimeProfile.evolutionAssessment;
  const eventProfile =
    progenitor === null
      ? null
      : SupernovaEventEngine.deriveProfile(progenitor);

  return new SupernovaStellarLineage(
    component.componentLabel,
    component.designation,
    component.physicalProperties.initialMassSolar,
    component.physicalProperties.currentMassSolar,
    assessment.input.metallicitySolarRatio,
    component.lifetimeProfile.ageBillionYears,
    assessment.evolutionState,
    terminalAssessment?.evolutionState ?? null,
    stage,
    progenitor,
    eventProfile,
    requiresBinaryInteraction,
    component.lifetimeProfile.terminalAgeBillionYears,
  );
}

function resolveTerminalAssessment(
  generationKey: UniverseGenerationKey,
  lifetimeProfile: StellarLifetimeProfile,
): StellarEvolutionAssessment | null {
  const terminalAge = lifetimeProfile.terminalAgeBillionYears;

  if (terminalAge === null) {
    return null;
  }

  const source = lifetimeProfile.evolutionAssessment.input;
  const epsilon = Math.max(
    TERMINAL_EPSILON_GYR,
    terminalAge * 1e-9,
  );

  return StellarEvolutionEngine.evaluate(
    generationKey,
    new StellarEvolutionInput(
      source.initialMassSolar,
      source.metallicitySolarRatio,
      terminalAge + epsilon,
    ),
  );
}

function coreCollapseProgenitor(
  context: StellarSupernovaInteractionContext,
  component: StellarSupernovaGroundTruthComponent,
  terminalAssessment: StellarEvolutionAssessment,
  allComponents: readonly StellarSupernovaGroundTruthComponent[],
): SupernovaProgenitorProfile {
  const assessment = component.lifetimeProfile.evolutionAssessment;
  const initialMassSolar = assessment.input.initialMassSolar;
  const metallicitySolarRatio = assessment.input.metallicitySolarRatio;
  const currentMassSolar = component.physicalProperties.currentMassSolar;

  const effectiveMetallicity = clamp(metallicitySolarRatio, 0.03, 3.0);
  const windLossFraction = clamp(
    0.08 +
      Math.max(0, initialMassSolar - 8) *
        0.016 *
        Math.pow(effectiveMetallicity, 0.55),
    0.05,
    0.78,
  );
  const alreadyRealizedLossFraction = clamp(
    1 - currentMassSolar / initialMassSolar,
    0,
    0.90,
  );
  const massLossFraction = Math.max(
    windLossFraction,
    alreadyRealizedLossFraction,
  );

  const preExplosionMassSolar = clamp(
    initialMassSolar * (1 - massLossFraction),
    1.6,
    initialMassSolar,
  );

  const strippingScore = clamp01(
    (massLossFraction - 0.10) / 0.52 +
      Math.max(0, initialMassSolar - 24) / 50 +
      strongestBinaryStrippingBoost(context, component, allComponents),
  );
  const envelope = envelopeFractions(strippingScore);

  const remnantHint = sameState(
    terminalAssessment.evolutionState,
    StellarEvolutionState.NEUTRON_STAR,
  )
    ? SupernovaProgenitorCompactRemnantHint.NEUTRON_STAR
    : SupernovaProgenitorCompactRemnantHint.STELLAR_BLACK_HOLE;

  return new SupernovaProgenitorProfile(
    SupernovaProgenitorChannel.CORE_COLLAPSE,
    initialMassSolar,
    preExplosionMassSolar,
    metallicitySolarRatio,
    envelope.hydrogen,
    envelope.helium,
    null,
    remnantHint,
  );
}

function envelopeFractions(strippingScore: number): {
  readonly hydrogen: number;
  readonly helium: number;
} {
  if (strippingScore < 0.48) {
    const t = strippingScore / 0.48;
    return {
      hydrogen: lerp(0.50, 0.13, t),
      helium: lerp(0.24, 0.34, t),
    };
  }

  if (strippingScore < 0.80) {
    const t = (strippingScore - 0.48) / 0.32;
    return {
      hydrogen: lerp(0.075, 0.010, t),
      helium: lerp(0.34, 0.18, t),
    };
  }

  const t = (strippingScore - 0.80) / 0.20;
  return {
    hydrogen: lerp(0.010, 0.002, t),
    helium: lerp(0.080, 0.020, t),
  };
}

function hasCompatibleIaMassReservoir(
  context: StellarSupernovaInteractionContext,
  candidate: StellarSupernovaGroundTruthComponent,
  components: readonly StellarSupernovaGroundTruthComponent[],
): boolean {
  const candidateMass = estimatedWhiteDwarfMass(candidate);
  const requiredMass = IA_TARGET_WHITE_DWARF_MASS_SOLAR - candidateMass;

  if (requiredMass <= 0) {
    return true;
  }

  return components.some((other) => {
    if (sameComponent(other, candidate)) {
      return false;
    }

    if (!hasInteractionPotential(context, candidate, other)) {
      return false;
    }

    const assessment = other.lifetimeProfile.evolutionAssessment;

    if (sameState(assessment.evolutionState, StellarEvolutionState.WHITE_DWARF)) {
      if (
        assessment.whiteDwarfComposition?.name !==
        StellarWhiteDwarfComposition.CARBON_OXYGEN_CORE.name
      ) {
        return false;
      }

      return estimatedWhiteDwarfMass(other) >= requiredMass;
    }

    if (
      sameState(assessment.evolutionState, StellarEvolutionState.NEUTRON_STAR) ||
      sameState(
        assessment.evolutionState,
        StellarEvolutionState.STELLAR_BLACK_HOLE,
      )
    ) {
      return false;
    }

    return (
      other.physicalProperties.currentMassSolar *
        IA_NON_DEGENERATE_TRANSFER_FRACTION >=
      requiredMass
    );
  });
}

function strongestBinaryStrippingBoost(
  context: StellarSupernovaInteractionContext,
  candidate: StellarSupernovaGroundTruthComponent,
  components: readonly StellarSupernovaGroundTruthComponent[],
): number {
  let strongest = 0;

  for (const other of components) {
    if (sameComponent(candidate, other)) {
      continue;
    }

    const periastronAu = orbitPeriastronBetween(
      context,
      candidate.componentLabel,
      other.componentLabel,
    );

    if (periastronAu === null) {
      continue;
    }

    const boost =
      periastronAu <= BINARY_STRIPPING_TIGHT_PERIASTRON_AU
        ? 0.52
        : periastronAu <= BINARY_STRIPPING_CLOSE_PERIASTRON_AU
          ? 0.36
          : periastronAu <= BINARY_STRIPPING_INTERACTION_PERIASTRON_AU
            ? 0.18
            : 0;

    strongest = Math.max(strongest, boost);
  }

  return strongest;
}

function hasInteractionPotential(
  context: StellarSupernovaInteractionContext,
  candidate: StellarSupernovaGroundTruthComponent,
  other: StellarSupernovaGroundTruthComponent,
): boolean {
  const periastronAu = orbitPeriastronBetween(
    context,
    candidate.componentLabel,
    other.componentLabel,
  );

  return (
    periastronAu !== null &&
    periastronAu <= BINARY_STRIPPING_INTERACTION_PERIASTRON_AU
  );
}

function orbitPeriastronBetween(
  context: StellarSupernovaInteractionContext,
  left: StellarSystemComponentLabelValue,
  right: StellarSystemComponentLabelValue,
): number | null {
  const leftName = left.name;
  const rightName = right.name;
  const isInnerPair =
    (leftName === StellarSystemComponentLabel.A.name &&
      rightName === StellarSystemComponentLabel.B.name) ||
    (leftName === StellarSystemComponentLabel.B.name &&
      rightName === StellarSystemComponentLabel.A.name);

  if (isInnerPair) {
    return context.innerPeriastronAu;
  }

  const involvesOuterComponent =
    leftName === StellarSystemComponentLabel.C.name ||
    rightName === StellarSystemComponentLabel.C.name;

  if (involvesOuterComponent) {
    return context.outerPeriastronAu;
  }

  return null;
}

function sameComponent(
  left: StellarSupernovaGroundTruthComponent,
  right: StellarSupernovaGroundTruthComponent,
): boolean {
  return left.componentLabel.name === right.componentLabel.name;
}

function estimatedWhiteDwarfMass(
  component: StellarSupernovaGroundTruthComponent,
): number {
  const initialMassSolar =
    component.lifetimeProfile.evolutionAssessment.input.initialMassSolar;

  return clamp(
    0.109 * initialMassSolar + 0.394,
    IA_MIN_BASE_WHITE_DWARF_MASS_SOLAR,
    IA_MAX_BASE_CO_WHITE_DWARF_MASS_SOLAR,
  );
}

function isCoreCollapseTerminalState(
  state: StellarEvolutionState | null,
): boolean {
  return (
    state !== null &&
    (
      sameState(state, StellarEvolutionState.NEUTRON_STAR) ||
      sameState(state, StellarEvolutionState.STELLAR_BLACK_HOLE)
    )
  );
}

function isDirectCollapse(
  assessment: StellarEvolutionAssessment | null,
): boolean {
  return (
    assessment !== null &&
    sameState(
      assessment.evolutionState,
      StellarEvolutionState.STELLAR_BLACK_HOLE,
    ) &&
    assessment.blackHoleFormationChannel?.name ===
      StellarBlackHoleFormationChannel.DIRECT_COLLAPSE.name
  );
}

function componentFromCompanion(
  companion: StellarCompanion,
): StellarSupernovaGroundTruthComponent {
  return {
    componentLabel: companion.componentLabel,
    designation: companion.designation.name,
    physicalProperties: companion.physicalProperties,
    lifetimeProfile: companion.lifetimeProfile,
  };
}

function interactionContextFromSystem(
  system: StellarSystem,
): StellarSupernovaInteractionContext {
  return Object.freeze({
    generationKey: system.generationKey,
    innerPeriastronAu: system.orbitHierarchy.innerOrbit?.periastronAu ?? null,
    outerPeriastronAu: system.orbitHierarchy.outerOrbit?.periastronAu ?? null,
  });
}

function assertGroundTruthComponents(
  components: readonly StellarSupernovaGroundTruthComponent[],
): void {
  if (components.length < 1 || components.length > 3) {
    throw new RangeError('Supernova Ground Truth requires one to three stellar components.');
  }

  const seen = new Set<number>();
  for (const component of components) {
    if (seen.has(component.componentLabel.code)) {
      throw new RangeError(`Duplicate stellar component ${component.componentLabel.name}.`);
    }
    seen.add(component.componentLabel.code);
    assertPrimaryConsistency(component.physicalProperties, component.lifetimeProfile);
  }
}

function assertPrimaryConsistency(
  physicalProperties: StellarPhysicalProperties,
  lifetimeProfile: StellarLifetimeProfile,
): void {
  const expected = lifetimeProfile.evolutionAssessment.input.initialMassSolar;
  const actual = physicalProperties.initialMassSolar;
  const scale = Math.max(1, Math.abs(expected), Math.abs(actual));

  if (Math.abs(expected - actual) > 1e-10 * scale) {
    throw new RangeError(
      'Primary stellar physical properties and lifetime profile must describe the same initial mass.',
    );
  }
}

function sameState(
  left: { readonly name: string },
  right: { readonly name: string },
): boolean {
  return left.name === right.name;
}

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * clamp01(t);
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
