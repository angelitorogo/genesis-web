import type { GeochemicalFormationSensitivityPRE3307 } from './geochemical-formation-sensitivity-pre33-07';
/** PRE-33.07 — causal, per-niche CT-0 geochemical reaction contract.
 * A thermal flux, V1 habitability score, bulk material, or candidate reaction
 * never constitutes an independently quantified chemical energy source.
 */
export const GEOCHEMISTRY_PRE33_07 = 'PRE-33.07/V3-CAUSAL-GEOCHEMISTRY/v1' as const;
export type ChemicalSpeciesPRE3307 = 'H2'|'O2'|'H2O'|'CO2'|'CH4'|'H2S'|'SO4_2MINUS'|'H_PLUS'|'FeO'|'Fe3O4'|'NH3'|'N2';
export type ChemicalPhasePRE3307 = 'AQUEOUS'|'GAS'|'SOLID'|'LIQUID';
export type ChemicalRoutePRE3307 = 'HYDROGEN_OXIDATION'|'CO2_HYDROGEN_METHANATION'|
  'SULFIDE_OXIDATION'|'WATER_SILICATE_ALTERATION'|
  'AMMONIA_OXIDATION'|'METHANE_OXIDATION';
export interface ChemicalInventoryPRE3307 {
  readonly species: ChemicalSpeciesPRE3307;
  readonly phase: ChemicalPhasePRE3307;
  /** Independently derived total participating reservoir, not a V1 relative abundance. */
  readonly amountMoles: number;
  /** Dimensionless thermodynamic activity at the reaction location. No implicit pH/concentrations. */
  readonly activity: number | null;
  readonly sourceId: string;
}
export interface ChemicalKineticsPRE3307 {
  readonly route: ChemicalRoutePRE3307;
  /** Evaluated standard Gibbs energy at the input temperature and pressure, not a tabulated 298K constant. */
  readonly standardGibbsJoulesPerMole: number;
  readonly temperatureKelvin: number;
  readonly pressurePascal: number;
  /** Independently modeled forward rate with its own provenance; not inferred from thermal heat. */
  readonly forwardRateMolesPerSecond: number;
  readonly thermodynamicSourceId: string;
  readonly kineticSourceId: string;
}
export interface ChemicalNichePRE3307 {
  readonly bodyKind: 'PLANET'|'MOON';
  readonly niche: 'SOLID_SURFACE'|'SUBSURFACE_OCEAN'|'DEEP_ENVELOPE'|'UNKNOWN';
  readonly solvent: 'H2O'|'NH3'|'CH4'|'UNIDENTIFIED'|'NONE';
  readonly solventState: 'MODELLED_LIQUID_CT0'|'CONDITIONAL'|'NOT_MODELLED'|'UNRESOLVED';
  readonly waterRockContact: 'MODELLED_DIRECT'|'MODELLED_SEPARATED'|'UNRESOLVED'|'NOT_APPLICABLE';
  readonly temperatureKelvin: number | null;
  readonly pressurePascal: number | null;
  readonly thermalHeatFluxWattsPerSquareMeter: number | null;
  readonly sourceId: string;
}
export interface ChemicalForcingPRE3307 {
  readonly niche: ChemicalNichePRE3307;
  readonly intervalSeconds: number;
  readonly inventory: readonly ChemicalInventoryPRE3307[];
  readonly kinetics: readonly ChemicalKineticsPRE3307[];
  /** Explicitly conditional endmembers can never promote energy to physical evidence. */
  readonly provenance: 'INDEPENDENT_REACTION_MASS_AND_RATE_MODEL'|'CONDITIONAL_ENDMEMBER';
}
export type ChemicalRouteStatusPRE3307 = 'POWER_MODELLED_CT0'|'HYPOTHETICAL_PATHWAY'|
  'NOT_EVALUABLE'|'REACTANT_ABSENT'|'THERMODYNAMICALLY_UNFAVOURABLE';
export interface ChemicalReactionResultPRE3307 {
  readonly route: ChemicalRoutePRE3307;
  readonly equation: string;
  readonly chargeAndAtomsBalanced: true;
  readonly status: ChemicalRouteStatusPRE3307;
  readonly reason: string;
  readonly gibbsJoulesPerMole: number|null;
  readonly forwardRateMolesPerSecond: number|null;
  readonly chemicalPowerWatts: number|null;
  readonly consumedReactantMoles: number|null;
  readonly reactionExtentMoles: number|null;
  readonly sourceIds: readonly string[];
}
export interface GeochemistryPRE3307 {
  readonly contract: typeof GEOCHEMISTRY_PRE33_07;
  /** Explicit mineral/transport endmember, never eligible as resolved or biological power. */
  readonly formationSensitivityPRE3307?: GeochemicalFormationSensitivityPRE3307 | null;
  readonly niche: ChemicalNichePRE3307;
  readonly inventorySourceIds: readonly string[];
  readonly reactions: readonly ChemicalReactionResultPRE3307[];
  /** Sum of resolved exergonic pathways only. Null when no path was independently evaluated. */
  readonly quantifiedPathwayPowerWatts: number|null;
  /** Not the sum of all possible chemical power in an entire planet/moon. */
  readonly globalChemicalPowerWatts: null;
  /** Positive exergonic flow is NOT measured biological extraction or metabolic coupling. */
  readonly biologicallyExtractedPowerWatts: null;
  readonly hasPositiveResolvedPower: boolean;
  readonly lifeEvaluated: false;
  readonly observationallyConfirmed: false;
  readonly notes: readonly string[];
}
