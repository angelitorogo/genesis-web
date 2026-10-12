/**
 * Read-only H5-B adapter for V2 SINGLE and wide, far-field P-type AB systems.
 * Uses the EXISTING H1-H5 engines and the same materialized planet; never
 * promotes a derived orbit/atmosphere to canonical Ground Truth.
 */
import type { PlanetScientificResolvedTarget, PlanetScientificHostEvolutionContext } from '../planetary/planet-scientific-target-resolver';
import { projectPostRemnantUnresolvedLuminosityThermalState } from '../planetary/post-remnant-unresolved-luminosity-thermal-projection';
import { projectWhiteDwarfConditionalThermalEnvelope } from '../planetary/white-dwarf-conditional-thermal-envelope';
import { projectWhiteDwarfPostAgbAtmosphereScenario } from '../planetary/white-dwarf-post-agb-atmosphere-projection';
import { projectWhiteDwarfPostAgbAtmosphereHistory } from '../planetary/white-dwarf-post-agb-atmosphere-history';
import { assessWhiteDwarfPostAgbPlanetarySurvival } from '../planetary/white-dwarf-post-agb-planetary-survival';
import { assessWhiteDwarfPostAgbEnvironmentalResolution } from '../planetary/white-dwarf-post-agb-environment-resolution';
import { simulateWhiteDwarfPostAgbEvolvedEnvironment } from '../planetary/white-dwarf-post-agb-evolved-environment';
import type { WhiteDwarfPostAgbOrbitHypothesis } from './white-dwarf-post-agb-orbit-projection';
import { currentHostRadiativeReferenceZoneAu } from './stellar-compact-host-planetary-coherence';

export interface H5ScientificBridgeInput {
  readonly architecture: 'SINGLE' | 'P_TYPE';
  readonly initialWhiteDwarfMassSolar: number;
  readonly currentWhiteDwarfMassSolar: number;
  readonly presentWhiteDwarfLuminositySolar: number;
  readonly coolingAgeBillionYears: number;
  readonly terminalAgeBillionYears: number | null;
  readonly postMainSequenceDurationBillionYears: number | null;
  readonly totalCurrentHostMassSolar: number;
  readonly orbit: WhiteDwarfPostAgbOrbitHypothesis;
  /** Sum of known modelled luminous non-WD components; null means unresolved. */
  readonly otherStarsFluxEarth: number | null;
  readonly initialFormationAxisAu: number;
  readonly formationEccentricity: number;
}

export function projectH5WhiteDwarfScientificTarget(
  target: PlanetScientificResolvedTarget,
  input: H5ScientificBridgeInput,
): PlanetScientificResolvedTarget {
  const p = target.detail;
  const wd = input.presentWhiteDwarfLuminositySolar;
  if (input.orbit.status !== 'ADIABATIC_CONDITIONAL' ||
      !Number.isFinite(wd) || wd <= 0 ||
      !Number.isFinite(input.totalCurrentHostMassSolar) || input.totalCurrentHostMassSolar <= 0) return target;
  const intrinsic = projectPostRemnantUnresolvedLuminosityThermalState({
    massEarth: p.general.massEarth,
    radiusEarth: p.general.radiusEarth,
    referenceBondAlbedo01: p.general.referenceBondAlbedo01,
    internalHeatRetentionIndex01: p.geology.internalHeatRetentionIndex01,
    tidalHeatingIndex01: p.geology.tidalHeatingIndex01,
  });
  const boundUnresolved = input.architecture === 'P_TYPE' && input.otherStarsFluxEarth === null;
  const thermal = projectWhiteDwarfConditionalThermalEnvelope({
    currentWhiteDwarfLuminositySolar: wd,
    planetSemiMajorAxisAu: input.orbit.hypotheticalSemiMajorAxisAu,
    planetEccentricity: input.orbit.hypotheticalEccentricity,
    referenceBondAlbedo01: p.general.referenceBondAlbedo01,
    intrinsicHeatFluxWattsPerSquareMeter: intrinsic?.totalIntrinsicFluxWattsPerSquareMeter ?? null,
    companionRadiativeBound: {
      lowerEarth: 0, upperEarth: boundUnresolved ? null : input.otherStarsFluxEarth,
      unresolvedSource: boundUnresolved, includesCompanion: input.architecture === 'P_TYPE',
    },
  });
  if (thermal === null) return target;
  const atmosphere = projectWhiteDwarfPostAgbAtmosphereScenario({
    isWhiteDwarf: true, postAgbOrbitHypothesisAvailable: true,
    progenitorReferencePressurePascal: p.atmosphere.retainedSurfacePressurePascal,
    progenitorGasComposition: p.atmosphere.retainedGasComposition,
    massEarth: p.general.massEarth, radiusEarth: p.general.radiusEarth,
    coolingAgeBillionYears: input.coolingAgeBillionYears,
    airlessReferenceTemperatureKelvin: thermal.equilibriumLowerKelvin,
    companionIrradiationUnresolved: boundUnresolved,
  });
  const history = atmosphere === null ? null : projectWhiteDwarfPostAgbAtmosphereHistory({
    isWhiteDwarf: true, postAgbOrbitHypothesisAvailable: true,
    initialStellarMassSolar: input.initialWhiteDwarfMassSolar,
    currentWhiteDwarfMassSolar: input.currentWhiteDwarfMassSolar,
    progenitorTerminalAgeBillionYears: input.terminalAgeBillionYears,
    postMainSequenceDurationBillionYears: input.postMainSequenceDurationBillionYears,
    coolingAgeBillionYears: input.coolingAgeBillionYears,
    presentWhiteDwarfLuminositySolar: wd,
    formationSemiMajorAxisAu: input.initialFormationAxisAu,
    hypotheticalPostAgbSemiMajorAxisAu: input.orbit.hypotheticalSemiMajorAxisAu,
    planetRadiusEarth: p.general.radiusEarth,
    referenceAtmospherePressurePascal: p.atmosphere.retainedSurfacePressurePascal,
    h4WdOnlyGasPressureCeilingPascal: atmosphere.scenarioGasPressureCeilingPascal,
    companionIrradiationUnresolved: boundUnresolved,
  });
  const survival = history === null ? null : assessWhiteDwarfPostAgbPlanetarySurvival({
    isWhiteDwarf: true, hasConditionalAdiabaticOrbit: true,
    history, formationEccentricity: input.formationEccentricity,
    planetMassEarth: p.general.massEarth, planetRadiusEarth: p.general.radiusEarth,
    priorAtmosphere: p.atmosphere.retainedGasComposition,
  });
  const resolution = assessWhiteDwarfPostAgbEnvironmentalResolution({
    canonicalPlanetExists: true, isWhiteDwarfCircumstellar: true,
    orbitIsHypotheticalNotValidated: true,
    actualCurrentAtmosphereReassessmentApplied: false,
    scenario: atmosphere, history, survival,
    currentTotalIrradiationUpperEarth: thermal.externalFluxUpperEarth,
  });
  const evolved = simulateWhiteDwarfPostAgbEvolvedEnvironment({
    isCircumstellarWhiteDwarf: true,
    hasAdiabaticOrbitHypothesis: true,
    history, h4: atmosphere, h4c: survival,
    massEarth: p.general.massEarth, radiusEarth: p.general.radiusEarth,
    priorGasComposition: p.atmosphere.retainedGasComposition,
    atmosphericPressureBeforeAgbPascal: p.atmosphere.retainedSurfacePressurePascal,
    geologicalOutgassingPotential01: p.geology.volatileOutgassingPotential01,
    airlessThermalReferenceKelvin: thermal.equilibriumLowerKelvin,
    companionRadiationUnresolved: boundUnresolved,
    modeledCompanionIrradiationEarth: input.otherStarsFluxEarth,
    referenceBondAlbedo01: p.general.referenceBondAlbedo01,
  });
  const zone = currentHostRadiativeReferenceZoneAu(wd);
  const evolution: PlanetScientificHostEvolutionContext = Object.freeze({
    hostLabel: input.architecture === 'SINGLE' ? 'A' : 'AB',
    evolutionStateNames: ['WHITE_DWARF'],
    containsCompactRemnant: true,
    requiresPostStellarEvolutionReassessment: true,
    currentHostMassSolar: input.totalCurrentHostMassSolar,
    currentHostLuminositySolar: wd,
    currentOrbitalPeriodDays: null, currentOrbitalPeriodYears: null,
    currentMeanInsolationEarth: null,
    radiativeRegime: 'WHITE_DWARF_COOLING_ESTIMATE',
    whiteDwarfCoolingAgeBillionYears: input.coolingAgeBillionYears,
    currentRadiativeReferenceZoneInnerAu: zone?.innerAu ?? null,
    currentRadiativeReferenceZoneOuterAu: zone?.outerAu ?? null,
    whiteDwarfPostAgbOrbitalHypothesisApplied: true,
    whiteDwarfPostAgbPTypeHypothesisApplied: input.architecture === 'P_TYPE',
    whiteDwarfPostAgbSemiMajorAxisAu: input.orbit.hypotheticalSemiMajorAxisAu,
    whiteDwarfPostAgbPeriodYears: input.orbit.hypotheticalPeriodYears,
    whiteDwarfPostAgbHostInsolationEarth: input.orbit.hypotheticalHostMeanInsolationEarth,
    whiteDwarfPostAgbMassExpansionFactor: input.orbit.massExpansionFactor,
    whiteDwarfThermalEnvelopeApplied: true,
    whiteDwarfExternalFluxLowerEarth: thermal.externalFluxLowerEarth,
    whiteDwarfExternalFluxUpperEarth: thermal.externalFluxUpperEarth,
    whiteDwarfEquilibriumLowerKelvin: thermal.equilibriumLowerKelvin,
    whiteDwarfEquilibriumUpperKelvin: thermal.equilibriumUpperKelvin,
    whiteDwarfCompanionEnvelopeIncluded: input.architecture === 'P_TYPE',
    whiteDwarfHasUnresolvedCompanion: boundUnresolved,
    // The RGB/AGB proxy only represents the WD progenitor in P-type. We
    // retain the H4 audit outputs, with the unmodelled companion history
    // explicitly described in fiche labels instead of declaring them complete.
    whiteDwarfPostAgbAtmosphereScenario: atmosphere,
    whiteDwarfPostAgbAtmosphereHistory: history,
    whiteDwarfPostAgbSurvivalAssessment: survival,
    whiteDwarfPostAgbEnvironmentalResolution: resolution,
    whiteDwarfPostAgbEvolvedEnvironment: evolved,
    whiteDwarfPostAgbModeledCompanionFluxEarth: input.otherStarsFluxEarth,
    intrinsicOnlyThermalProjectionApplied: intrinsic !== null,
    intrinsicOnlyBlackbodyEquivalentKelvin: intrinsic?.intrinsicBlackbodyEquivalentKelvin ?? null,
    conditionalGeothermalHeatFluxWattsPerSquareMeter: intrinsic?.geothermalFluxWattsPerSquareMeter ?? null,
    conditionalTidalHeatFluxWattsPerSquareMeter: intrinsic?.tidalFluxWattsPerSquareMeter ?? null,
    conditionalTotalIntrinsicHeatFluxWattsPerSquareMeter: intrinsic?.totalIntrinsicFluxWattsPerSquareMeter ?? null,
    conditionalEnvironmentReassessmentApplied: false,
    postSupernovaOrbitDisposition: 'UNCHANGED',
  });
  return Object.freeze({...target, hostEvolution: evolution});
}
