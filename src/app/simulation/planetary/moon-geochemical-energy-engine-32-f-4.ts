import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonInteriorStructure32F2b } from '../../domain/planetary/moon-interior-structure-32-f-2b';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type {
  MoonGeochemicalEnergy32F4, LunarReactionConstraint32F4,
  LunarWaterRockContact32F4,
} from '../../domain/planetary/moon-geochemical-energy-32-f-4';

const LIMITS = Object.freeze([
  'H2O_SOLVENT_ONLY_WHEN_LIQUID_PHASE_SOLVED_CT0_OTHER_SOLVENTS_UNKNOWN',
  'BULK_METAL_SILICATE_AND_CONDENSABLE_MASSES_DO_NOT_IDENTIFY_MINERAL_SPECIES',
  'NO_REACTANT_ACTIVITIES_PH_SALINITY_SPECIATION_OR_CHEMICAL_KINETICS',
  'THERMAL_POWER_AND_CARNOT_BOUND_ARE_NOT_CHEMICAL_FREE_ENERGY',
  'NO_UNSUPPORTED_SERPENTINIZATION_HYDROGEN_METHANE_OR_OXIDANT_PRODUCTION',
  'NO_BIOLOGICAL_ENERGY_THRESHOLD_OR_UNIVERSAL_BIOCHEMISTRY',
  'CURRENT_CT0_MODEL_NOT_DATED_HISTORY_OR_UNIQUE_RECONSTRUCTION',
]);
const close = (a: number, b: number): boolean =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));

/**
 * 32.F.4: quantitative heat/geometric constraints and a non-anthropocentric
 * chemistry inventory. Reaction availability is NEVER inferred from bulk ice
 * or a V1 habitability score. No additional seed is consumed.
 */
export class MoonGeochemicalEnergyEngine32F4 {
  private constructor() {}

  static fromMaterialized(
    physical: MoonPhysicalProperties,
    formation: MoonFormationInventory32F1d,
    interior: MoonInteriorStructure32F2b,
    ocean: MoonOceanReality32F2c,
  ): MoonGeochemicalEnergy32F4 {
    const aligned = [formation, interior, ocean].every(x =>
      x.hostPlanetOrdinal === physical.hostPlanetOrdinal &&
      x.moonOrdinal === physical.moonOrdinal);
    if (!aligned ||
      formation.provenance !== 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
      interior.provenance !== 'CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED' ||
      ocean.provenance !== 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION' ||
      interior.layers.length !== 4 ||
      interior.layers[1].kind !== 'SILICATE_MANTLE' ||
      interior.layers[2].kind !== 'OTHER_CONDENSABLES_UNIDENTIFIED' ||
      interior.layers[3].kind !== 'H2O_OUTER_SHELL' ||
      !close(formation.totalMassKilograms, interior.totalMassKilograms) ||
      !close(formation.waterIceMassKilograms, ocean.waterInventoryKilograms) ||
      !close(formation.waterIceMassKilograms, interior.waterMassKilograms) ||
      !close(interior.surfaceRadiusKilometers, physical.radiusEarth * 6371) ||
      !close(ocean.waterShellThicknessKilometers, interior.layers[3].thicknessKilometers) ||
      !Number.isFinite(physical.radiusEarth) || physical.radiusEarth <= 0) {
      throw new RangeError('32.F.4 requires aligned formation, stratification and CT-0 ocean.');
    }
    const flux = ocean.generatedTotalSurfaceHeatFluxWattsPerSquareMeter;
    if (flux !== null && (!Number.isFinite(flux) || flux < 0)) {
      throw new RangeError('32.F.4 cannot accept negative or non-finite thermal power.');
    }
    const liquid = ocean.state === 'PRESENT_IN_SIMULATED_MODEL';
    const absent = ocean.state === 'ABSENT_IN_SIMULATED_MODEL';
    const waterLayer = liquid ? ocean.radialLayers.find(l => l.phase === 'LIQUID_H2O') : undefined;
    if (liquid && (!waterLayer || !Number.isFinite(waterLayer.massKilograms) ||
      !close(waterLayer.massKilograms, ocean.simulatedLiquidWaterMassKilograms ?? NaN) ||
      waterLayer.bottomDepthKilometers <= waterLayer.topDepthKilometers ||
      !close(waterLayer.bottomDepthKilometers - waterLayer.topDepthKilometers,
        ocean.liquidLayerThicknessKilometers ?? NaN) ||
      [waterLayer.temperatureTopKelvin, waterLayer.temperatureBottomKelvin,
       waterLayer.pressureTopPascal, waterLayer.pressureBottomPascal].some(x =>
        !Number.isFinite(x) || x < 0))) {
      throw new RangeError('32.F.4 rejects invalid CT-0 liquid geometry and state.');
    }
    const totalRock = formation.rockMassKilograms;
    const silicates = interior.layers[1];
    const unknownSeparator = interior.layers[2];
    const shell = interior.layers[3];
    let contact: LunarWaterRockContact32F4 = 'UNRESOLVED';
    let contactArea: number | null = null;
    if (absent) contact = 'NO_MODELLED_LIQUID_WATER';
    if (liquid) {
      const touchesShellBase = close(waterLayer!.bottomDepthKilometers,
        ocean.waterShellThicknessKilometers) &&
        (ocean.highPressureIceThicknessKilometers ?? 0) === 0;
      if (!touchesShellBase) contact = 'LIQUID_ISOLATED_BY_HIGH_PRESSURE_ICE';
      else if (unknownSeparator.massKilograms > 0 && unknownSeparator.thicknessKilometers > 1e-9) {
        contact = 'LIQUID_SEPARATED_FROM_SILICATES_BY_UNIDENTIFIED_CONDENSABLES';
      } else if (silicates.massKilograms > 0 && totalRock > 0) {
        contact = 'DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL';
        contactArea = 4 * Math.PI * (shell.innerRadiusKilometers * 1000) ** 2;
      } else contact = 'UNRESOLVED';
    }
    const radiusMeters = physical.radiusEarth * 6371000;
    const totalHeat = flux === null ? null : flux * 4 * Math.PI * radiusMeters ** 2;
    const iceGradient = ocean.iceCoverThicknessKilometers !== null && flux !== null &&
      ocean.iceCoverThicknessKilometers > 0
      ? flux / ocean.assumedIceConductivityWattsPerMeterKelvin * 1000 : null;
    const cold = waterLayer ? Math.min(waterLayer.temperatureTopKelvin,
      waterLayer.temperatureBottomKelvin) : null;
    const hot = waterLayer ? Math.max(waterLayer.temperatureTopKelvin,
      waterLayer.temperatureBottomKelvin) : null;
    // Assumed global flux times surface area is not chemical power. An ideal
    // reversible heat-engine bound is at most a thermal sensitivity indicator.
    const thermalWork = hot !== null && cold !== null && hot > 0 && totalHeat !== null
      ? Math.max(0, totalHeat * (1 - cold / hot)) : null;
    const mk = (
      pathway: LunarReactionConstraint32F4['pathway'],
      referenceStoichiometry: string,
      applicable: boolean,
      missingInputs: readonly string[],
    ): LunarReactionConstraint32F4 => Object.freeze({
      pathway, referenceStoichiometry,
      applicability: applicable ? 'POTENTIAL_IF_SPECIES_AND_CONTACT_EXIST' as const :
        'NOT_ESTABLISHED_WITH_CURRENT_COMPOSITION_OR_ENERGY' as const,
      missingInputs: Object.freeze([...missingInputs]),
      actualReactionGibbsJoulesPerMole: null,
      actualReactionRateMolesPerSecond: null,
      extractableChemicalPowerWatts: null,
    });
    const reactions: readonly LunarReactionConstraint32F4[] = Object.freeze([
      mk('WATER_SILICATE_ALTERATION_H2_CANDIDATE',
        '3 FeO + H₂O → Fe₃O₄ + H₂ (solo si existe FeO reactivo)', liquid && contact ===
        'DIRECT_LIQUID_SILICATE_INTERFACE_IN_MODEL',
        ['Mineralogía reactiva (p. ej. fases ultramáficas)', 'Área de reacción real',
         'Cinética, permeabilidad, temperatura y actividades químicas']),
      mk('H2_OXIDANT_REDox_CANDIDATE',
        '2 H₂ + O₂ → 2 H₂O (solo si coexisten ambos reactivos)', liquid,
        ['H₂ molecular disponible', 'Oxidante identificado y concentraciones',
         'Potencial redox, actividades y cinética']),
      mk('SULFUR_REDox_CANDIDATE',
        'H₂S + 2 O₂ → SO₄²⁻ + 2 H⁺ (referencia estequiométrica)', liquid,
        ['Especies de azufre identificadas', 'Donadores y aceptores de electrones',
         'Estado de oxidación y actividades']),
      mk('CARBON_REDox_CANDIDATE',
        'CO₂ + 4 H₂ → CH₄ + 2 H₂O (referencia estequiométrica)', liquid,
        ['Especies de carbono identificadas', 'Reductores y oxidantes cuantificados',
         'Presión, temperatura y cinética de reacción']),
      mk('PHOTOCHEMICAL_REDox_CANDIDATE',
        'Fotones + reactivo identificado → productos fotoquímicos (no identificados)', false,
        ['Espectro fotónico químicamente activo en la ubicación',
         'Transporte óptico y especies fotorreactivas', 'Flujo de fotones útil']),
    ]);
    return Object.freeze({
      contractVersion: '32.F.4-chemical-constraints-and-thermal-gradients-v1',
      provenance: 'CT0_PHASE_AND_THERMAL_MODEL_WITH_UNIDENTIFIED_REACTANTS',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      solventState: liquid ? 'MODELLED_LIQUID_H2O_CT0' :
        absent && ocean.reason === 'NO_FORMATION_H2O' ? 'NO_FORMATION_H2O' :
        absent ? 'H2O_SOLID_IN_CT0_MODEL' : 'UNRESOLVED_H2O_STATE',
      otherSolventSpeciation: 'UNRESOLVED',
      modeledLiquidH2OMassKilograms: liquid ? ocean.simulatedLiquidWaterMassKilograms :
        absent ? 0 : null,
      modeledLiquidLayerThicknessKilometers: liquid ? ocean.liquidLayerThicknessKilometers :
        absent ? 0 : null,
      modeledOceanTopPressurePascal: waterLayer?.pressureTopPascal ?? null,
      modeledOceanBottomPressurePascal: waterLayer?.pressureBottomPascal ?? null,
      modeledOceanTopTemperatureKelvin: waterLayer?.temperatureTopKelvin ?? null,
      modeledOceanBottomTemperatureKelvin: waterLayer?.temperatureBottomKelvin ?? null,
      modeledWaterRockContact: contact,
      directSilicateWaterInterfaceAreaSquareMeters: contactArea,
      generatedHeatFluxWattsPerSquareMeter: flux,
      generatedGlobalHeatPowerWatts: totalHeat,
      iceConductiveGradientKelvinPerKilometer: iceGradient,
      idealThermalWorkUpperBoundWatts: thermalWork,
      redoxReactantActivities: null,
      dissolvedMineralComposition: null,
      dissolvedOxidantInventoryMoles: null,
      pH: null, salinity: null,
      actualChemicalDisequilibriumJoulesPerMole: null,
      actualChemicalPowerWatts: null,
      reactions,
      scientificLimits: LIMITS,
    } satisfies MoonGeochemicalEnergy32F4);
  }
}
