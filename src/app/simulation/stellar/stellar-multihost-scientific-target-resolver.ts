import { BodyLocator, MoonLocator } from '../../domain/generation/procedural-locator';
import { type UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  PlanetScientificTargetResolver,
  type PlanetScientificIdentitySource,
  type PlanetScientificResolvedTarget,
} from '../planetary/planet-scientific-target-resolver';
import {
  PostRemnantConditionalEnvironmentReassessmentEngine,
} from '../planetary/post-remnant-conditional-environment-reassessment';
import { projectPostRemnantUnresolvedLuminosityThermalState } from '../planetary/post-remnant-unresolved-luminosity-thermal-projection';
import { projectWhiteDwarfConditionalThermalEnvelope } from '../planetary/white-dwarf-conditional-thermal-envelope';
import { projectWhiteDwarfPostAgbAtmosphereScenario } from '../planetary/white-dwarf-post-agb-atmosphere-projection';
import { projectWhiteDwarfPostAgbAtmosphereHistory } from '../planetary/white-dwarf-post-agb-atmosphere-history';
import { assessWhiteDwarfPostAgbPlanetarySurvival } from '../planetary/white-dwarf-post-agb-planetary-survival';
import { assessWhiteDwarfPostAgbEnvironmentalResolution } from '../planetary/white-dwarf-post-agb-environment-resolution';
import { simulateWhiteDwarfPostAgbEvolvedEnvironment } from '../planetary/white-dwarf-post-agb-evolved-environment';
import { projectWhiteDwarfPostAgbOrbit } from './white-dwarf-post-agb-orbit-projection';
import { projectH5MultiHostCompanionIrradiation } from './white-dwarf-post-agb-multihost-irradiation-model';
import { projectH5PTypeWhiteDwarfEnvironment } from './white-dwarf-post-agb-circumbinary-model';
import { projectH5WhiteDwarfScientificTarget } from './white-dwarf-post-agb-h5-scientific-bridge';
import {
  MoonScientificTargetResolver,
  type MoonScientificResolvedTarget,
} from '../planetary/moon-scientific-target-resolver';
import { StellarDesignationGenerator } from './stellar-designation-generator';
import { multihostPhysicalSourceKey } from './stellar-multihost-physical-source-key';
import { type GeneratedMultipleHost, type GeneratedPublicPlanet } from './stellar-multihost-formation';
import { StellarCompactHostPlanetaryCoherence, currentHostRadiativeReferenceZoneAu } from './stellar-compact-host-planetary-coherence';
import { StellarMultihostPublicTargetIndex } from './stellar-multihost-public-target-index';
import {
  stellarMultihostPublicMoonDesignation,
  stellarMultihostPublicPlanetDesignation,
} from './stellar-multihost-public-designation';

/**
 * Stage 5: read-only bridge from ONE generated physical aggregate to the
 * existing 26.3/26.4/26.5 scientific primitives. The same aggregate must
 * eventually be supplied to the renderer and scientific routes atomically.
 *
 * This resolver deliberately has NO global fallback: it cannot accidentally
 * resolve an internal B/C/P seed or return a legacy V1 body for an unknown
 * public locator. It does not switch any persisted route over by itself.
 */
export class StellarMultihostScientificTargetResolver {
  private readonly index: StellarMultihostPublicTargetIndex;
  private readonly parentDesignation: string;
  private readonly hostCoherence: StellarCompactHostPlanetaryCoherence;

  /** Adapter for MoonScientificCardAssembler's pre-existing injection seam. */
  readonly moonCardResolver: Readonly<{
    resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint) => MoonScientificResolvedTarget | null;
    resolveHostPlanetDetailed: (key: UniverseGenerationKey, locator: BodyLocator) => PlanetScientificResolvedTarget | null;
  }>;

  constructor(private readonly source: GeneratedMultipleHost) {
    this.index = StellarMultihostPublicTargetIndex.build(source);
    this.hostCoherence = new StellarCompactHostPlanetaryCoherence(source);
    this.parentDesignation = StellarDesignationGenerator.generate(
      multihostPhysicalSourceKey(source.parentGenerationKey), source.parentLocator,
    ).name;
    this.moonCardResolver = Object.freeze({
      resolveDetailed: (key: UniverseGenerationKey, locator: BodyLocator, moonIndex: bigint) =>
        this.resolveMoonDetailed(key, locator, moonIndex),
      resolveHostPlanetDetailed: (key: UniverseGenerationKey, locator: BodyLocator) =>
        this.resolveDetailed(key, locator),
    });
  }

  resolve(generationKey: UniverseGenerationKey, locator: BodyLocator): PlanetScientificIdentitySource | null {
    const entry = this.findPlanet(generationKey, locator);
    return entry === null ? null : this.identity(entry);
  }

  /** Matches the existing planet card's injectable resolveDetailed contract. */
  resolveDetailed(generationKey: UniverseGenerationKey, locator: BodyLocator): PlanetScientificResolvedTarget | null {
    const entry = this.findPlanet(generationKey, locator);
    if (entry === null) return null;
    const projected = PlanetScientificTargetResolver.projectGenerated(
      this.identity(entry), entry.planet, entry.atmosphere, entry.moonSystem,
    );
    const withHost = this.withCurrentHostEvolution(projected, entry);
    return this.withPublicMoonDesignations(withHost, entry);
  }

  /** Matches the existing moon card's optional host-planet resolver contract. */
  resolveHostPlanetDetailed(
    generationKey: UniverseGenerationKey, locator: BodyLocator,
  ): PlanetScientificResolvedTarget | null {
    return this.resolveDetailed(generationKey, locator);
  }

  /** Moon index is local to its public host planet; minor moons lack detailed data. */
  resolveMoonDetailed(
    generationKey: UniverseGenerationKey, planetLocator: BodyLocator, moonIndex: bigint,
  ): MoonScientificResolvedTarget | null {
    if (!this.matchesKey(generationKey) || moonIndex < 0n || moonIndex > BigInt(Number.MAX_SAFE_INTEGER) ||
      this.index.resolvePlanet(planetLocator) === null) return null;
    const publicMoon = this.index.resolveMoon(new MoonLocator(
      planetLocator.galaxyIndex, planetLocator.sectorKey, planetLocator.galacticObjectIndex,
      planetLocator.bodyIndex, moonIndex,
    ));
    if (publicMoon === null || publicMoon.relevantMoon === null) return null;
    // Existing moon projection consumes the EXACT same planet's already
    // materialized moon science; there is no second MoonGenerator invocation.
    return MoonScientificTargetResolver.resolveDetailed(
      generationKey, planetLocator, moonIndex,
      { resolveDetailed: (key, locator) => this.resolveDetailed(key, locator) },
    );
  }

  private findPlanet(generationKey: UniverseGenerationKey, locator: BodyLocator): GeneratedPublicPlanet | null {
    if (!this.matchesKey(generationKey)) return null;
    return this.index.resolvePlanet(locator);
  }

  private matchesKey(key: UniverseGenerationKey): boolean {
    return key.equals(this.source.parentGenerationKey);
  }

  private withCurrentHostEvolution(
    target: PlanetScientificResolvedTarget,
    entry: GeneratedPublicPlanet,
  ): PlanetScientificResolvedTarget {
    const state = this.hostCoherence.stateFor(entry.host);
    if (!state.requiresPostStellarEvolutionReassessment) return target;
    if (entry.host === 'AB' && state.componentEvolutionStates.includes('WHITE_DWARF')) {
      const pType = this.withPTypeWhiteDwarfEvolution(target, entry);
      if (pType !== target) return pType;
      // An inapplicable P-type closure must fall through to the pre-existing
      // unresolved-remnant path, never display the progenitor atmosphere.
    }

    const dynamics = this.hostCoherence.planetaryDynamics(entry);
    const hasResolvedCurrentOrbit =
      dynamics.disposition === 'BOUND_RECONFIGURED' &&
      dynamics.semiMajorAxisAu !== null &&
      dynamics.eccentricity !== null;
    // H3: a WD's old formation axis is NOT an authoritative current orbit.
    // A slow, isotropic AGB mass-loss test-particle scenario is useful as a
    // conditional scientific projection, but cannot prove survival or stability.
    const isWhiteDwarfCircumstellar = entry.host !== 'AB' &&
      state.componentEvolutionStates.length === 1 &&
      state.componentEvolutionStates[0] === 'WHITE_DWARF';
    const actualHost = this.source.components.find(host => host.label === entry.host);
    const whiteDwarfPostAgbOrbit = isWhiteDwarfCircumstellar &&
      dynamics.disposition === 'UNCHANGED' && actualHost !== undefined
      ? projectWhiteDwarfPostAgbOrbit({
          evolutionStateName: 'WHITE_DWARF',
          context: this.source.components.length === 2 ? 'BINARY_S' : 'TRIPLE_S',
          initialHostMassSolar: actualHost.physical.initialMassSolar,
          currentHostMassSolar: state.currentGravitatingMassSolar,
          formationSemiMajorAxisAu: entry.planet.orbit.semiMajorAxisAu,
          formationEccentricity: entry.planet.orbit.eccentricity,
          currentWhiteDwarfLuminositySolar: state.currentLuminositySolar,
          explosiveReconfiguration: false,
        }) : null;
    const unresolvedPostAgbOrbit = state.componentEvolutionStates.includes('WHITE_DWARF') &&
      !hasResolvedCurrentOrbit;
    const periodYears = unresolvedPostAgbOrbit ? null :
      dynamics.disposition === 'EJECTED' || dynamics.disposition === 'HOST_DISRUPTED'
        ? null : hasResolvedCurrentOrbit
          ? dynamics.periodYears
          : this.hostCoherence.correctedPeriodYears(
              entry.host, entry.planet.orbit.semiMajorAxisAu,
            );
    const periodDays = periodYears === null ? null : periodYears * 365.25;
    const insolation = unresolvedPostAgbOrbit ? null :
      dynamics.disposition === 'EJECTED' ? 0 :
        dynamics.disposition === 'HOST_DISRUPTED' ? null :
          this.hostCoherence.currentMeanInsolationEarth(
            entry.host,
            hasResolvedCurrentOrbit ? dynamics.semiMajorAxisAu! : entry.planet.orbit.semiMajorAxisAu,
            hasResolvedCurrentOrbit ? dynamics.eccentricity! : entry.planet.orbit.eccentricity,
          );

    // H1 adds a WD *radiative* estimate, not a validated post-AGB atmosphere.
    // H2 owns the environmental rerun and its gas/water survival assumptions.
    const deferWhiteDwarfEnvironment = state.componentEvolutionStates.includes('WHITE_DWARF');
    const referenceZone = dynamics.disposition !== 'EJECTED' &&
      dynamics.disposition !== 'HOST_DISRUPTED' &&
      state.radiativeRegime === 'WHITE_DWARF_COOLING_ESTIMATE'
      ? currentHostRadiativeReferenceZoneAu(state.currentLuminositySolar)
      : null;
    const reassessment = insolation === null || deferWhiteDwarfEnvironment
      ? null
      : PostRemnantConditionalEnvironmentReassessmentEngine.generate(
          entry.planet,
          entry.moonSystem,
          insolation,
          entry.atmosphere,
        );
    // H1 retains the *intrinsic-only* readout independently of the known WD
    // luminosity: it is not yet a WD environment or atmosphere projection.
    // Never reuse old progenitor climates when the orbit was reconfigured.
    const intrinsicOnly = reassessment === null &&
      (state.radiativeRegime === 'COMPACT_LUMINOSITY_UNMODELED' ||
        deferWhiteDwarfEnvironment) &&
      dynamics.disposition === 'UNCHANGED'
        ? projectPostRemnantUnresolvedLuminosityThermalState({
            massEarth: entry.planet.massEarth,
            radiusEarth: entry.planet.radiusEarth,
            referenceBondAlbedo01: entry.planet.referenceBondAlbedo01,
            internalHeatRetentionIndex01: entry.atmosphere.internalHeatRetentionIndex01,
            tidalHeatingIndex01: entry.atmosphere.tidalHeatingIndex01,
          })
        : null;
    // H3: project the host's CURRENT cooling luminosity onto the explicitly
    // conditional post-AGB test-particle orbit, never onto the formation axis.
    // The A/B/C hierarchy was generated before slow mass loss; using its
    // frozen distances as current companion bounds would be unsupported.
    // Therefore the companion's LOWER bound is zero and UPPER is unknown.
    // P-type AB remains unresolved (barycentric mass-loss/stability missing).
    const whiteDwarfThermalEnvelope = whiteDwarfPostAgbOrbit !== null &&
      state.currentLuminositySolar !== null
        ? projectWhiteDwarfConditionalThermalEnvelope({
            currentWhiteDwarfLuminositySolar: state.currentLuminositySolar,
            planetSemiMajorAxisAu: whiteDwarfPostAgbOrbit.hypotheticalSemiMajorAxisAu,
            planetEccentricity: whiteDwarfPostAgbOrbit.hypotheticalEccentricity,
            referenceBondAlbedo01: entry.planet.referenceBondAlbedo01,
            intrinsicHeatFluxWattsPerSquareMeter:
              intrinsicOnly?.totalIntrinsicFluxWattsPerSquareMeter ?? null,
            companionRadiativeBound: Object.freeze({
              lowerEarth: 0, upperEarth: null, unresolvedSource: true,
              includesCompanion: true,
            }),
          }) : null;
    // H4 only consumes pre-AGB atmospheric data as a reference inventory.
    // It never copies it into present-day atmospheric fields or claims escape
    // history/companion irradiation are resolved.
    const postAgbAtmosphereScenario = whiteDwarfThermalEnvelope === null ? null :
      projectWhiteDwarfPostAgbAtmosphereScenario({
        isWhiteDwarf: isWhiteDwarfCircumstellar,
        postAgbOrbitHypothesisAvailable: whiteDwarfPostAgbOrbit !== null,
        progenitorReferencePressurePascal: target.detail.atmosphere.retainedSurfacePressurePascal,
        progenitorGasComposition: target.detail.atmosphere.retainedGasComposition,
        massEarth: entry.planet.massEarth,
        radiusEarth: entry.planet.radiusEarth,
        coolingAgeBillionYears: state.whiteDwarfCoolingAgeBillionYears ?? null,
        airlessReferenceTemperatureKelvin: whiteDwarfThermalEnvelope.equilibriumLowerKelvin,
        companionIrradiationUnresolved: whiteDwarfThermalEnvelope.hasUnresolvedRadiativeSource,
      });
    // H4b is an independent, readonly sensitivity reconstruction.
    // Do not use its pressure scenarios as contemporary atmosphere or climate.
    // Terminal age and initial mass are taken from the same actual B/C/A host;
    // we never derive stellar-history inputs from a route/seed/body-specific fix.
    const postAgbAtmosphereHistory = postAgbAtmosphereScenario === null ||
      whiteDwarfPostAgbOrbit === null || actualHost === undefined
      ? null
      : projectWhiteDwarfPostAgbAtmosphereHistory({
          isWhiteDwarf: isWhiteDwarfCircumstellar,
          postAgbOrbitHypothesisAvailable: true,
          initialStellarMassSolar: actualHost.physical.initialMassSolar,
          currentWhiteDwarfMassSolar: state.currentGravitatingMassSolar,
          progenitorTerminalAgeBillionYears: actualHost.lifetime.terminalAgeBillionYears,
          postMainSequenceDurationBillionYears:
            actualHost.lifetime.evolutionAssessment.postMainSequenceDurationBillionYears,
          coolingAgeBillionYears: state.whiteDwarfCoolingAgeBillionYears ?? null,
          presentWhiteDwarfLuminositySolar: state.currentLuminositySolar,
          formationSemiMajorAxisAu: entry.planet.orbit.semiMajorAxisAu,
          hypotheticalPostAgbSemiMajorAxisAu:
            whiteDwarfPostAgbOrbit.hypotheticalSemiMajorAxisAu,
          planetRadiusEarth: entry.planet.radiusEarth,
          referenceAtmospherePressurePascal:
            target.detail.atmosphere.retainedSurfacePressurePascal,
          h4WdOnlyGasPressureCeilingPascal:
            postAgbAtmosphereScenario.scenarioGasPressureCeilingPascal,
          companionIrradiationUnresolved:
            whiteDwarfThermalEnvelope?.hasUnresolvedRadiativeSource ?? true,
        });
    // H4c is read-only: the giant radius is a Stefan-Boltzmann scenario
    // derived from H4b's explicitly ASSUMED luminosities, not a stellar track.
    // Species escape uses hypothetical exobase temperatures. No survivor,
    // actual atmosphere, orbital stability or outgassing source is inferred.
    const postAgbSurvivalAssessment = postAgbAtmosphereHistory === null ||
      whiteDwarfPostAgbOrbit === null ? null :
      assessWhiteDwarfPostAgbPlanetarySurvival({
        isWhiteDwarf: isWhiteDwarfCircumstellar,
        hasConditionalAdiabaticOrbit: true,
        history: postAgbAtmosphereHistory,
        formationEccentricity: entry.planet.orbit.eccentricity,
        planetMassEarth: entry.planet.massEarth,
        planetRadiusEarth: entry.planet.radiusEarth,
        priorAtmosphere: target.detail.atmosphere.retainedGasComposition,
      });
    // H4d consolidates evidence without promoting an escape hypothesis to
    // contemporary Ground Truth. Existence is already established by the
    // resolved canonical planet; its RGB/AGB evolutionary path is not.
    const postAgbEnvironmentalResolution =
      assessWhiteDwarfPostAgbEnvironmentalResolution({
        canonicalPlanetExists: true,
        isWhiteDwarfCircumstellar,
        orbitIsHypotheticalNotValidated: whiteDwarfPostAgbOrbit !== null && !hasResolvedCurrentOrbit,
        actualCurrentAtmosphereReassessmentApplied: reassessment !== null,
        scenario: postAgbAtmosphereScenario,
        history: postAgbAtmosphereHistory,
        survival: postAgbSurvivalAssessment,
        currentTotalIrradiationUpperEarth: whiteDwarfThermalEnvelope?.externalFluxUpperEarth ?? null,
      });
    // H5: project the A/B(/C) separation under the SAME stated adiabatic
    // mass-loss hypothesis. This is a new model closure, NOT an authoritative
    // replacement for the unvalidated multihost geometry in H2/H3/H4d.
    const h5CompanionModel = isWhiteDwarfCircumstellar &&
      whiteDwarfPostAgbOrbit !== null ?
      projectH5MultiHostCompanionIrradiation({
        host: entry.host as 'A' | 'B' | 'C',
        components: this.source.components.map(component => {
          const current = this.hostCoherence.stateFor(component.label);
          return Object.freeze({
            label: component.label,
            initialMassSolar: component.physical.initialMassSolar,
            currentMassSolar: current.currentGravitatingMassSolar,
            currentLuminositySolar: current.currentLuminositySolar,
          });
        }),
        innerOrbit: this.source.innerOrbit,
        outerOrbit: this.source.outerOrbit,
        projectedPlanetSemiMajorAxisAu: whiteDwarfPostAgbOrbit.hypotheticalSemiMajorAxisAu,
        planetaryEccentricity: whiteDwarfPostAgbOrbit.hypotheticalEccentricity,
      }) : null;
    // H5 is a new derived, parameterized *simulated* current environment.
    // H4d remains the audit of what cannot be INFERRED observationally; H5
    // instead selects a published GENESIS physical closure. Do not replace
    // canonical atmosphere/orbit or claim to have resolved companion flux.
    const evolvedWhiteDwarfEnvironment = simulateWhiteDwarfPostAgbEvolvedEnvironment({
      isCircumstellarWhiteDwarf: isWhiteDwarfCircumstellar,
      hasAdiabaticOrbitHypothesis: whiteDwarfPostAgbOrbit !== null,
      history: postAgbAtmosphereHistory,
      h4: postAgbAtmosphereScenario,
      h4c: postAgbSurvivalAssessment,
      massEarth: entry.planet.massEarth,
      radiusEarth: entry.planet.radiusEarth,
      priorGasComposition: target.detail.atmosphere.retainedGasComposition,
      atmosphericPressureBeforeAgbPascal: target.detail.atmosphere.retainedSurfacePressurePascal,
      geologicalOutgassingPotential01: target.detail.geology.volatileOutgassingPotential01,
      airlessThermalReferenceKelvin: whiteDwarfThermalEnvelope?.equilibriumLowerKelvin ?? null,
      companionRadiationUnresolved: h5CompanionModel === null,
      modeledCompanionIrradiationEarth: h5CompanionModel?.companionMeanFluxEarth ?? null,
      referenceBondAlbedo01: entry.planet.referenceBondAlbedo01,
    });
    const environmentallyReassessed = reassessment === null
      ? target
      : PlanetScientificTargetResolver.applyConditionalEnvironmentReassessment(
          target,
          reassessment,
        );

    return Object.freeze({
      ...environmentallyReassessed,
      detail: Object.freeze({
        ...environmentallyReassessed.detail,
        orbit: Object.freeze({
          ...environmentallyReassessed.detail.orbit,
          ...(hasResolvedCurrentOrbit ? {
            semiMajorAxisAu: dynamics.semiMajorAxisAu!,
            eccentricity: dynamics.eccentricity!,
            periastronAu: dynamics.periastronAu!,
            apoastronAu: dynamics.apoastronAu!,
          } : {}),
          ...(periodDays === null ? {} : { periodDays, periodYears: periodYears! }),
          ...(insolation === null ? {} : { referenceMeanInsolationEarth: insolation }),
        }),
      }),
      hostEvolution: Object.freeze({
        hostLabel: entry.host,
        evolutionStateNames: state.componentEvolutionStates,
        containsCompactRemnant: state.containsCompactRemnant,
        requiresPostStellarEvolutionReassessment: state.requiresPostStellarEvolutionReassessment,
        currentHostMassSolar: state.currentGravitatingMassSolar,
        currentHostLuminositySolar: state.currentLuminositySolar,
        whiteDwarfCoolingAgeBillionYears: state.whiteDwarfCoolingAgeBillionYears ?? null,
        currentRadiativeReferenceZoneInnerAu: referenceZone?.innerAu ?? null,
        currentRadiativeReferenceZoneOuterAu: referenceZone?.outerAu ?? null,
        currentOrbitalPeriodDays: periodDays,
        currentOrbitalPeriodYears: periodYears,
        currentMeanInsolationEarth: insolation,
        radiativeRegime: state.radiativeRegime,
        whiteDwarfThermalEnvelopeApplied: whiteDwarfThermalEnvelope !== null,
        whiteDwarfPostAgbAtmosphereScenario: postAgbAtmosphereScenario,
        whiteDwarfPostAgbAtmosphereHistory: postAgbAtmosphereHistory,
        whiteDwarfPostAgbSurvivalAssessment: postAgbSurvivalAssessment,
        whiteDwarfPostAgbEnvironmentalResolution: postAgbEnvironmentalResolution,
        whiteDwarfPostAgbEvolvedEnvironment: evolvedWhiteDwarfEnvironment,
        whiteDwarfPostAgbModeledCompanionFluxEarth:
          h5CompanionModel?.companionMeanFluxEarth ?? null,
        whiteDwarfPostAgbOrbitalHypothesisApplied: whiteDwarfPostAgbOrbit !== null,
        whiteDwarfPostAgbSemiMajorAxisAu: whiteDwarfPostAgbOrbit?.hypotheticalSemiMajorAxisAu ?? null,
        whiteDwarfPostAgbPeriodYears: whiteDwarfPostAgbOrbit?.hypotheticalPeriodYears ?? null,
        whiteDwarfPostAgbHostInsolationEarth:
          whiteDwarfPostAgbOrbit?.hypotheticalHostMeanInsolationEarth ?? null,
        whiteDwarfPostAgbMassExpansionFactor: whiteDwarfPostAgbOrbit?.massExpansionFactor ?? null,
        whiteDwarfExternalFluxLowerEarth:
          whiteDwarfThermalEnvelope?.externalFluxLowerEarth ?? null,
        whiteDwarfExternalFluxUpperEarth:
          whiteDwarfThermalEnvelope?.externalFluxUpperEarth ?? null,
        whiteDwarfEquilibriumLowerKelvin:
          whiteDwarfThermalEnvelope?.equilibriumLowerKelvin ?? null,
        whiteDwarfEquilibriumUpperKelvin:
          whiteDwarfThermalEnvelope?.equilibriumUpperKelvin ?? null,
        whiteDwarfCompanionEnvelopeIncluded:
          whiteDwarfThermalEnvelope?.includesCompanionBound ?? false,
        whiteDwarfHasUnresolvedCompanion:
          whiteDwarfThermalEnvelope?.hasUnresolvedRadiativeSource ?? false,
        conditionalEnvironmentReassessmentApplied: reassessment !== null,
        conditionalEnvironmentEffectiveInsolationEarth:
          reassessment?.effectiveRadiativeForcingEarth ?? null,
        conditionalEnvironmentUsesMinimumRadiativeFloor:
          reassessment?.usesMinimumRadiativeFloor ?? false,
        intrinsicOnlyThermalProjectionApplied: intrinsicOnly !== null,
        intrinsicOnlyBlackbodyEquivalentKelvin:
          intrinsicOnly?.intrinsicBlackbodyEquivalentKelvin ?? null,
        conditionalGeothermalHeatFluxWattsPerSquareMeter:
          reassessment?.intrinsicThermalState.geothermalHeatFluxWattsPerSquareMeter ??
          intrinsicOnly?.geothermalFluxWattsPerSquareMeter ?? null,
        conditionalTidalHeatFluxWattsPerSquareMeter:
          reassessment?.intrinsicThermalState.tidalHeatFluxWattsPerSquareMeter ??
          intrinsicOnly?.tidalFluxWattsPerSquareMeter ?? null,
        conditionalTotalIntrinsicHeatFluxWattsPerSquareMeter:
          reassessment?.intrinsicThermalState.totalIntrinsicHeatFluxWattsPerSquareMeter ??
          intrinsicOnly?.totalIntrinsicFluxWattsPerSquareMeter ?? null,
        conditionalIntrinsicEquivalentInsolationEarth:
          reassessment?.intrinsicThermalState.intrinsicEquivalentInsolationEarth ?? null,
        postSupernovaOrbitDisposition: dynamics.disposition,
        postSupernovaSourceEventKeys: dynamics.sourceEventKeys,
        postSupernovaSemiMajorAxisAu: dynamics.semiMajorAxisAu,
        postSupernovaEccentricity: dynamics.eccentricity,
        postSupernovaPeriastronAu: dynamics.periastronAu,
        postSupernovaApoastronAu: dynamics.apoastronAu,
        postSupernovaInclinationChangeDegrees: dynamics.inclinationChangeDegrees,
        postSupernovaMassLossRegime: dynamics.massLossRegime,
        postSupernovaMaximumEffectiveKickKmS: dynamics.maximumEffectiveKickKmS,
        postSupernovaMoonStates: dynamics.moonStates,
      }),
    });
  }

  /** H5-B: conditional AB barycentric P-type solution; no change to S-type. */
  private withPTypeWhiteDwarfEvolution(
    target: PlanetScientificResolvedTarget,
    entry: GeneratedPublicPlanet,
  ): PlanetScientificResolvedTarget {
    if (this.source.components.length < 2 ||
        this.hostCoherence.planetaryDynamics(entry).disposition !== 'UNCHANGED') return target;
    const a = this.source.components.find(c => c.label === 'A');
    const b = this.source.components.find(c => c.label === 'B');
    if (!a || !b) return target;
    const wdHosts = [a, b].filter(c => c.stellarSystem.primaryStar.evolutionState.name === 'WHITE_DWARF');
    // A two-WD binary needs BOTH stellar wind/XUV histories. H5-B only
    // models the single progenitor WD + one companion closure at present.
    if (wdHosts.length !== 1) return target;
    const wd = wdHosts[0];
    const wdState = this.hostCoherence.stateFor(wd.label);
    const aState = this.hostCoherence.stateFor('A');
    const bState = this.hostCoherence.stateFor('B');
    const c = this.source.components.find(host => host.label === 'C');
    const cState = c ? this.hostCoherence.stateFor('C') : null;
    const currentWdMass = wdState.currentGravitatingMassSolar;
    const wdAge = wdState.whiteDwarfCoolingAgeBillionYears;
    const wdLum = wdState.currentLuminositySolar;
    if (currentWdMass === null || wdAge == null || wdLum === null ||
        aState.currentGravitatingMassSolar === null || bState.currentGravitatingMassSolar === null ||
        aState.currentLuminositySolar === null || bState.currentLuminositySolar === null ||
        (c !== undefined && (cState?.currentGravitatingMassSolar == null ||
          cState.currentLuminositySolar === null))) return target;
    const circumbinary = projectH5PTypeWhiteDwarfEnvironment({
      formationPlanetAxisAu: entry.planet.orbit.semiMajorAxisAu,
      planetaryEccentricity: entry.planet.orbit.eccentricity,
      innerAxisAu: this.source.innerOrbit.semiMajorAxisAu,
      innerEccentricity: this.source.innerOrbit.eccentricity,
      initialMassA: a.physical.initialMassSolar,
      currentMassA: aState.currentGravitatingMassSolar,
      luminosityA: aState.currentLuminositySolar,
      initialMassB: b.physical.initialMassSolar,
      currentMassB: bState.currentGravitatingMassSolar,
      luminosityB: bState.currentLuminositySolar,
      whiteDwarfLabel: wd.label as 'A' | 'B',
      outer: c && cState && this.source.outerOrbit ? {
        axisAu: this.source.outerOrbit.semiMajorAxisAu,
        eccentricity: this.source.outerOrbit.eccentricity,
        initialMassC: c.physical.initialMassSolar,
        currentMassC: cState.currentGravitatingMassSolar!,
        luminosityC: cState.currentLuminositySolar!,
      } : null,
    });
    if (circumbinary === null) return target;
    const projected = Object.freeze({
      status: 'ADIABATIC_CONDITIONAL' as const,
      formationSemiMajorAxisAu: entry.planet.orbit.semiMajorAxisAu,
      hypotheticalSemiMajorAxisAu: circumbinary.planetAxisAu,
      hypotheticalEccentricity: entry.planet.orbit.eccentricity,
      massExpansionFactor: circumbinary.expansionFactor,
      hypotheticalPeriodYears: circumbinary.periodYears,
      hypotheticalHostMeanInsolationEarth: circumbinary.whiteDwarfFluxEarth,
      stabilityResolved: false as const,
      survivalResolved: false as const,
      companionHierarchyResolved: false as const,
    });
    return projectH5WhiteDwarfScientificTarget(target, {
      architecture: 'P_TYPE',
      initialWhiteDwarfMassSolar: wd.physical.initialMassSolar,
      currentWhiteDwarfMassSolar: currentWdMass,
      presentWhiteDwarfLuminositySolar: wdLum,
      coolingAgeBillionYears: wdAge,
      terminalAgeBillionYears: wd.lifetime.terminalAgeBillionYears,
      postMainSequenceDurationBillionYears:
        wd.lifetime.evolutionAssessment.postMainSequenceDurationBillionYears,
      totalCurrentHostMassSolar:
        aState.currentGravitatingMassSolar + bState.currentGravitatingMassSolar,
      orbit: projected,
      otherStarsFluxEarth: circumbinary.otherStarsFluxEarth,
      initialFormationAxisAu: entry.planet.orbit.semiMajorAxisAu,
      formationEccentricity: entry.planet.orbit.eccentricity,
    });
  }

  private withPublicMoonDesignations(
    target: PlanetScientificResolvedTarget,
    entry: GeneratedPublicPlanet,
  ): PlanetScientificResolvedTarget {
    const relevantMoons = Object.freeze(target.detail.moons.relevantMoons.map(moon => Object.freeze({
      ...moon,
      designation: stellarMultihostPublicMoonDesignation(
        this.parentDesignation, entry.host, entry.sourcePlanetOrdinal, moon.moonOrdinal,
      ),
    })));
    return Object.freeze({
      ...target,
      detail: Object.freeze({
        ...target.detail,
        moons: Object.freeze({
          ...target.detail.moons,
          relevantMoons,
        }),
      }),
    });
  }

  private identity(entry: GeneratedPublicPlanet): PlanetScientificIdentitySource {
    return Object.freeze({
      locator: entry.publicLocator,
      planetOrdinal: Number(entry.publicLocator.bodyIndex) + 1,
      // Parent-system names are public aliases. Internal child universe keys,
      // planet seeds and private child system designations never reach cards.
      designation: stellarMultihostPublicPlanetDesignation(
        this.parentDesignation, entry.host, entry.sourcePlanetOrdinal,
      ),
      hostSystemDesignation: this.parentDesignation,
      orbitTopology: entry.planet.hostPlanetarySystem.architecture.orbitTopology,
      hostPlanetCount: this.index.planets.length,
    });
  }
}
