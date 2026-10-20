import type { MoonAtmospherePhysicalBalance32F1 } from './moon-atmosphere-physical-32-f-1';

/**
 * 32.F.1e.b: conditional initial column fed by a formation inventory.
 * It is neither a dated physical reconstruction nor a measured atmosphere.
 * The H2O column requires exposed, equilibrated H2O. Unknown exobase,
 * photochemistry, particle losses and replenishment prohibit a forecast.
 * Zero is a zero-H2O scenario, NOT an observed vacuum. Other volatile species remain unidentified in 32.F.1d.
 */
export interface MoonAtmosphereFormationEvolution32F1e {
  readonly contractVersion: '32.F.1e-water-vapor-endmember-v2';
  readonly provenance: 'CONDITIONAL_FORMATION_ENDMEMBER_NOT_OBSERVATION';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  readonly initialGasMassStatus: 'UNRESOLVED';
  readonly realAtmosphericPressureStatus: 'UNKNOWN';
  readonly realAtmosphericRegimeStatus: 'UNKNOWN';
  readonly sourceWaterIceMassKilograms: number;
  readonly unidentifiedCondensablesKilograms: number;
  readonly intervalSeconds: number;
  /** Mass of H2O vapor if *all necessary* H2O is exposed and at saturation. */
  readonly conditionalInitialWaterVaporMassKilograms: number | null;
  readonly conditionalInitialWaterVaporPressurePascal: number | null;
  /** Null pending actual exobase T, density, altitude and kinetic validity. */
  readonly conditionalThermalJeansEscapeKilogramsPerSecond: number | null;
  /** Null: future gas mass requires escape AND replenishment boundary conditions. */
  readonly conditionalFinalWaterVaporPressurePascal: number | null;
  /** Null until independently characterized forcing; no proxy surface Jeans. */
  readonly conditionalBalance: MoonAtmospherePhysicalBalance32F1 | null;
  readonly missingIndependentSources: readonly [
    'EXPOSED_H2O_FRACTION_AND_INITIAL_GAS_MASS',
    'STELLAR_EUV_AND_PHOTOLYSIS',
    'CHARGED_PARTICLE_EROSION',
    'OUTGASSING_AND_REPLENISHMENT',
    'OTHER_VOLATILE_SPECIATION',
    'DATED_ATMOSPHERIC_EVOLUTION',
  ];
  readonly assumption: 'SATURATED_H2O_INITIAL_COLUMN_ONLY_NO_EXOBASE_OR_REPLENISHMENT';
}
