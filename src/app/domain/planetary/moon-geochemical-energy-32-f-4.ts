/**
 * 32.F.4 — source-separated geochemical constraints for a modelled lunar interior.
 * Identifying a H2O liquid layer is NOT identification of its dissolved species,
 * redox activities, reaction kinetics, metabolism or universal habitability.
 */
export type LunarSolventStatus32F4 =
  | 'MODELLED_LIQUID_H2O_CT0'
  | 'H2O_SOLID_IN_CT0_MODEL'
  | 'NO_FORMATION_H2O'
  | 'UNRESOLVED_H2O_STATE';

export type LunarWaterRockContact32F4 =
  | 'DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL'
  | 'LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE'
  | 'LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES'
  | 'NO_MODELLED_LIQUID_WATER'
  | 'UNRESOLVED';

export type LunarChemicalPathway32F4 =
  | 'WATER_SILICATE_ALTERATION_H2_CANDIDATE'
  | 'H2_OXIDANT_REDox_CANDIDATE'
  | 'SULFUR_REDox_CANDIDATE'
  | 'CARBON_REDox_CANDIDATE'
  | 'PHOTOCHEMICAL_REDox_CANDIDATE';

export interface LunarReactionConstraint32F4 {
  readonly pathway: LunarChemicalPathway32F4;
  /** Balanced conceptual reference, never a species inventory or reaction claim. */
  readonly referenceStoichiometry: string;
  /** A possible *chemical* route, not evidence of reagents, reactions or life. */
  readonly applicability: 'POTENTIAL_IF_SPECIES_AND_CONTACT_EXIST' |
    'NOT_ESTABLISHED_WITH_CURRENT_COMPOSITION_OR_ENERGY';
  readonly missingInputs: readonly string[];
  readonly actualReactionGibbsJoulesPerMole: null;
  readonly actualReactionRateMolesPerSecond: null;
  readonly extractableChemicalPowerWatts: null;
}

export interface MoonGeochemicalEnergy32F4 {
  readonly contractVersion: '32.F.4-chemical-constraints-and-thermal-gradients-v1';
  readonly provenance: 'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly solventState: LunarSolventStatus32F4;
  /** Other solvents cannot be excluded/assigned from bulk condensable mass. */
  readonly otherSolventSpeciation: 'UNRESOLVED';
  readonly modeledLiquidH2OMassKilograms: number | null;
  readonly modeledLiquidLayerThicknessKilometers: number | null;
  readonly modeledOceanTopPressurePascal: number | null;
  readonly modeledOceanBottomPressurePascal: number | null;
  readonly modeledOceanTopTemperatureKelvin: number | null;
  readonly modeledOceanBottomTemperatureKelvin: number | null;
  readonly modeledWaterRockContact: LunarWaterRockContact32F4;
  readonly directSilicateWaterInterfaceAreaSquareMeters: number | null;
  /** Heat flow in the seed-defined physical realization; NOT free chemical energy. */
  readonly generatedHeatFluxWattsPerSquareMeter: number | null;
  readonly generatedGlobalHeatPowerWatts: number | null;
  /** Conductive gradient across modelled ice: q/k, not ocean convection. */
  readonly iceConductiveGradientKelvinPerKilometer: number | null;
  /** Reversible Carnot bound on *thermal work* for the selected liquid-column endpoints. */
  readonly idealThermalWorkUpperBoundWatts: number | null;
  readonly redoxReactantActivities: null;
  readonly dissolvedMineralComposition: null;
  readonly dissolvedOxidantInventoryMoles: null;
  readonly pH: null;
  readonly salinity: null;
  readonly actualChemicalDisequilibriumJoulesPerMole: null;
  readonly actualChemicalPowerWatts: null;
  readonly reactions: readonly LunarReactionConstraint32F4[];
  readonly scientificLimits: readonly string[];
}
