import type { MoonFormationInventory32F1d } from '../../domain/planetary/moon-formation-inventory-32-f-1d';
import type { MoonWaterPhaseInventory32F2a } from '../../domain/planetary/moon-water-phase-inventory-32-f-2a';
import type { MoonInternalWaterAssessment } from '../../domain/planetary/moon-internal-water-assessment';
import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type {
  MoonInteriorLayer32F2b, MoonInteriorLayerKind32F2b,
  MoonInteriorStructure32F2b, MoonInteriorThermalScenario32F2b,
} from '../../domain/planetary/moon-interior-structure-32-f-2b';

const G = 6.67430e-11;
const R_EARTH = 6_371_000;
const M_EARTH = 5.9722e24;
const K_ICE = 2.5;
const RHO_METAL = 7800;
const RHO_SILICATE = 3300;
const RHO_ICE = 930;
const MAX_ICE_IH_PRESSURE = 200e6;
const RADIOGENIC_UPPER = 1e-11;
const SENSITIVITY_LIMITS = Object.freeze([
  'ENDMEMBER_RADIAL_SORTING_AND_BULK_POROSITY_ARE_NOT_OBSERVED_STRATIGRAPHY',
  'FORMATION_H2O_IS_NOT_A_RESOLVED_PRESENT_DAY_WATER_RESERVOIR',
  'TIDAL_K2_OVER_Q_BOUNDS_ARE_ASSUMPTIONS;_HEAT_DEPOSITION_AND_CONDUCTION_UNRESOLVED',
  'RADIOGENIC_0_TO_1E-11_W_PER_KG_ROCK_IS_AN_ASSUMED_SENSITIVITY_BAND_NOT_DATED_DECAY',
  'NO_SALINITY_OR_HIGH_PRESSURE_ICE_POLYMORPHS;_MELT_VALID_ONLY_BELOW_200_MPA',
  'NO_CONVECTION_LATENT_HEAT_PHASE_KINETICS_VOLATILE_TRANSPORT_OR_DATED_HISTORY',
  'NO_CURRENT_OCEAN_ICE_THICKNESS_OR_BIOLOGICAL_COMPATIBILITY_DEDUCED',
]);

const approximately = (a: number, b: number, relative = 1e-12): boolean =>
  Number.isFinite(a) && Number.isFinite(b) &&
  Math.abs(a - b) <= relative * Math.max(1, Math.abs(a), Math.abs(b));

/** Interior scenario with an exact mass partition and a hydrostatic *gauge*
 * pressure profile. Surface atmospheric pressure is unknown, hence not added.
 * Pure-Ih melting and conductive heat-flux sensitivity do not solve an actual
 * ocean. No PRNG, new seeds, or changes to pre-existing moon states. */
export class MoonInteriorStructureEngine32F2b {
  private constructor() {}

  static fromMaterialized(
    physical: MoonPhysicalProperties,
    formation: MoonFormationInventory32F1d,
    water: MoonWaterPhaseInventory32F2a,
    cryosphere: MoonInternalWaterAssessment | null,
    surfaceTemperatureKelvin: number,
  ): MoonInteriorStructure32F2b {
    const mass = physical.massEarth * M_EARTH;
    const radius = physical.radiusEarth * R_EARTH;
    if (!approximately(formation.totalMassKilograms, mass) ||
        !approximately(water.sourceFormationMassKilograms, mass) ||
        !approximately(water.sourceFormationWaterKilograms, formation.waterIceMassKilograms) ||
        !approximately(water.sourceSurfaceTemperatureKelvin, surfaceTemperatureKelvin, 1e-10) ||
        !approximately(formation.rockMassKilograms,
          formation.metallicMassKilograms + formation.silicateMassKilograms) ||
        formation.provenance !== 'DETERMINISTIC_CONDITIONAL_FORMATION_MODEL_NOT_OBSERVATION' ||
        water.provenance !== 'FORMATION_H2O_ENDMEMBER_CONDITIONAL_NOT_OBSERVED' ||
        [formation, water].some(a => a.moonOrdinal !== physical.moonOrdinal ||
          a.hostPlanetOrdinal !== physical.hostPlanetOrdinal) ||
        !Number.isFinite(surfaceTemperatureKelvin) || surfaceTemperatureKelvin <= 0 ||
        !Number.isFinite(radius) || radius <= 0 ||
        !Number.isFinite(mass) || mass <= 0 ||
        !Number.isFinite(formation.modelPorosityFraction01) ||
        formation.modelPorosityFraction01 < 0 || formation.modelPorosityFraction01 >= 1) {
      throw new RangeError('32.F.2b requires aligned physical, formation and phase-inventory inputs.');
    }
    if (cryosphere !== null && (
      cryosphere.basis !== 'ECCENTRICITY_TIDES_BOUNDED_SCENARIO' ||
      [cryosphere.tidalHeatFluxMinimumWattsPerSquareMeter,
        cryosphere.tidalHeatFluxMaximumWattsPerSquareMeter].some(
          v => v !== null && (!Number.isFinite(v) || v < 0)) ||
      (cryosphere.tidalHeatFluxMinimumWattsPerSquareMeter !== null &&
        cryosphere.tidalHeatFluxMaximumWattsPerSquareMeter !== null &&
        cryosphere.tidalHeatFluxMinimumWattsPerSquareMeter >
          cryosphere.tidalHeatFluxMaximumWattsPerSquareMeter)
    )) throw new RangeError('32.F.2b invalid tidal power interval.');
    const kinds: readonly MoonInteriorLayerKind32F2b[] = [
      'METALLIC_CORE', 'SILICATE_MANTLE',
      'OTHER_CONDENSABLES_UNIDENTIFIED', 'H2O_OUTER_SHELL',
    ];
    const masses = [formation.metallicMassKilograms, formation.silicateMassKilograms,
      formation.otherCondensableMassKilograms, formation.waterIceMassKilograms];
    if (masses.some(v => !Number.isFinite(v) || v < 0) ||
        !approximately(masses.reduce((a, b) => a + b, 0), mass)) {
      throw new RangeError('32.F.2b mass components are not physical/conserved.');
    }
    // Assign the formation model's effective void volume to the silicate mantle.
    // This is only ONE density-compatible radial arrangement; no unique core or
    // shell geometry can be recovered from mean density alone.
    const compactVolumes = [masses[0] / RHO_METAL, masses[1] / RHO_SILICATE,
      masses[2] / RHO_ICE, masses[3] / RHO_ICE];
    const totalCompactVolume = compactVolumes.reduce((a, b) => a + b, 0);
    const porosityVoidVolume = totalCompactVolume *
      formation.modelPorosityFraction01 / (1 - formation.modelPorosityFraction01);
    const modelVolumes = [...compactVolumes];
    modelVolumes[1] += porosityVoidVolume;
    const volumeTotal = modelVolumes.reduce((a, b) => a + b, 0);
    const realVolume = 4 * Math.PI * radius ** 3 / 3;
    if (!Number.isFinite(volumeTotal) || volumeTotal <= 0 ||
        !Number.isFinite(realVolume) || realVolume <= 0) {
      throw new RangeError('32.F.2b degenerate conditional layer geometry.');
    }
    const volumeScale = realVolume / volumeTotal;
    const bareLayers: Array<{
      kind: MoonInteriorLayerKind32F2b; mass: number; inner: number; outer: number; density: number;
    }> = [];
    let cumulativeVolume = 0;
    for (let i = 0; i < 4; i++) {
      const inner = Math.cbrt(cumulativeVolume / volumeTotal) * radius;
      cumulativeVolume += modelVolumes[i];
      const outer = i === 3 ? radius : Math.cbrt(cumulativeVolume / volumeTotal) * radius;
      bareLayers.push({ kind: kinds[i], mass: masses[i], inner, outer,
        density: modelVolumes[i] > 0 ? masses[i] / (modelVolumes[i] * volumeScale) : 0 });
    }
    const enclosedAt = (r: number): number => {
      let enclosed = 0;
      for (const l of bareLayers) {
        if (r >= l.outer) { enclosed += l.mass; continue; }
        if (r > l.inner && l.outer > l.inner) {
          enclosed += l.mass * ((r ** 3 - l.inner ** 3) /
            (l.outer ** 3 - l.inner ** 3));
        }
        break;
      }
      return enclosed;
    };
    // Hydrostatic pressure from surface toward centre via shell integration.
    // Midpoint quadrature (2048 zones) uses the enclosed mass, not constant-g.
    // Pressure is relative to unknown atmospheric pressure at the surface.
    const ZONES = 2048;
    const dr = radius / ZONES;
    const pressures = new Float64Array(ZONES + 1);
    for (let i = ZONES - 1; i >= 0; i--) {
      const r = (i + 0.5) * dr;
      const l = bareLayers.find(x => r >= x.inner && r <= x.outer);
      const rho = l?.density ?? 0;
      const dp = G * enclosedAt(r) * rho * dr / (r * r);
      pressures[i] = pressures[i + 1] + dp;
    }
    if (!Number.isFinite(pressures[0]) || pressures[0] < 0) {
      throw new RangeError('32.F.2b invalid hydrostatic pressure.');
    }
    const pressureAtRadius = (r: number): number => {
      const idx = Math.max(0, Math.min(ZONES, r / dr));
      const left = Math.floor(idx);
      if (left === ZONES) return 0;
      return pressures[left] * (1 - (idx - left)) + pressures[left + 1] * (idx - left);
    };
    const layers: MoonInteriorLayer32F2b[] = bareLayers.map(l => Object.freeze({
      kind: l.kind, massKilograms: l.mass, innerRadiusKilometers: l.inner / 1000,
      outerRadiusKilometers: l.outer / 1000, thicknessKilometers: (l.outer - l.inner) / 1000,
      effectiveDensityKilogramsPerCubicMeter: l.density,
      pressureAtInnerBoundaryPascal: pressureAtRadius(l.inner),
      pressureAtOuterBoundaryPascal: pressureAtRadius(l.outer),
    }));
    const profile = Object.freeze([0, 0.05, 0.1, 0.25, 0.5, 0.75, 1].map(fraction =>
      Object.freeze({depthKilometers: radius * fraction / 1000,
        pressurePascal: pressureAtRadius(radius * (1 - fraction))})));
    const waterShell = bareLayers[3];
    const waterThickness = waterShell.outer - waterShell.inner;
    const rockMass = formation.rockMassKilograms;
    const assumedRadiogenicMaximum = RADIOGENIC_UPPER * rockMass / (4 * Math.PI * radius ** 2);
    const tideMin = cryosphere?.tidalHeatFluxMinimumWattsPerSquareMeter ?? null;
    const tideMax = cryosphere?.tidalHeatFluxMaximumWattsPerSquareMeter ?? null;
    const thermalCases: readonly MoonInteriorThermalScenario32F2b['case'][] = [
      'LOW_TIDAL_NO_RADIOGENIC', 'HIGH_TIDAL_WITH_ASSUMED_RADIOGENIC_UPPER',
    ];
    const thermalScenarios: MoonInteriorThermalScenario32F2b[] = thermalCases.map((caseName, i) => {
      const tidal = i === 0 ? tideMin : tideMax;
      const radiogenic = i === 0 ? 0 : assumedRadiogenicMaximum;
      const flux = tidal === null ? null : tidal + radiogenic;
      let regime: MoonInteriorThermalScenario32F2b['phaseRegime'];
      let shellThickness: number | null = null;
      let iceMass: number | null = null;
      let liquidMass: number | null = null;
      let baseTemperature: number | null = null;
      if (masses[3] === 0) {
        regime = 'NO_FORMATION_WATER';
      } else if (flux === null || !Number.isFinite(flux) || flux < 0) {
        regime = 'NO_RESOLVED_TIDAL_HEAT_INPUT';
      } else if (surfaceTemperatureKelvin >= 273.15) {
        regime = 'NO_STABLE_SURFACE_ICE_IN_ASSUMED_STRATIGRAPHY';
      } else if (waterShell.inner <= 0 || waterThickness < 0) {
        regime = 'UNRESOLVED_CONDUCTION_OUTSIDE_DOMAIN';
      } else {
        // Steady spherical conductive solution for heat supplied at the base:
        // T(r) = T_surface + F_surface R²/k (1/r - 1/R).
        const temperatureAt = (depth: number): number => {
          const r = radius - depth;
          return surfaceTemperatureKelvin + flux * radius ** 2 / K_ICE * (1 / r - 1 / radius);
        };
        // Ice Ih linearized Clapeyron sensitivity. Above this pressure the
        // water phase cannot be inferred without high-pressure ice polymorphs.
        const meltAt = (depth: number): number =>
          273.15 - 7.4e-8 * pressureAtRadius(radius - depth);
        let deepestValid = waterThickness;
        if (pressureAtRadius(waterShell.inner) > MAX_ICE_IH_PRESSURE) {
          let low = 0, high = waterThickness;
          for (let j = 0; j < 65; j++) {
            const middle = (low + high) / 2;
            if (pressureAtRadius(radius - middle) > MAX_ICE_IH_PRESSURE) high = middle;
            else low = middle;
          }
          deepestValid = low;
        }
        baseTemperature = temperatureAt(deepestValid);
        if (!Number.isFinite(baseTemperature) || baseTemperature <= 0 ||
            baseTemperature > 900) {
          regime = 'UNRESOLVED_CONDUCTION_OUTSIDE_DOMAIN';
        } else if (baseTemperature < meltAt(deepestValid)) {
          if (deepestValid < waterThickness * (1 - 1e-9)) {
            regime = 'UNRESOLVED_HIGH_PRESSURE_ICE_PHASES';
          } else {
            regime = 'ICE_ONLY_IN_THIS_CONDITIONAL_MODEL';
            shellThickness = waterThickness / 1000;
            iceMass = masses[3];
            liquidMass = 0;
          }
        } else if (deepestValid < waterThickness * (1 - 1e-9)) {
          regime = 'UNRESOLVED_HIGH_PRESSURE_ICE_PHASES';
        } else {
          let low = 0, high = waterThickness;
          for (let j = 0; j < 65; j++) {
            const middle = (low + high) / 2;
            if (temperatureAt(middle) >= meltAt(middle)) high = middle;
            else low = middle;
          }
          shellThickness = high / 1000;
          // Density is constant within the assumed H2O shell; allocate by
          // volume and close the other mass by subtraction.
          const interfaceRadius = radius - high;
          const solidVolumeFraction = (radius ** 3 - interfaceRadius ** 3) /
            (radius ** 3 - waterShell.inner ** 3);
          iceMass = masses[3] * solidVolumeFraction;
          liquidMass = masses[3] - iceMass;
          regime = 'POTENTIAL_LIQUID_BELOW_ICE_CONDITIONAL';
        }
      }
      const temperatureProfile = Object.freeze([0, 0.25, 0.5, 0.75, 1].map(f => {
        const depth = f * waterThickness;
        const r = radius - depth;
        const t = flux === null || !Number.isFinite(flux) || r <= 0
          ? null : surfaceTemperatureKelvin + flux * radius ** 2 / K_ICE * (1 / r - 1 / radius);
        return Object.freeze({ depthKilometers: depth / 1000,
          lithostaticPressurePascal: pressureAtRadius(r),
          conditionalTemperatureKelvin: t !== null && Number.isFinite(t) && t > 0 && t <= 900
            ? t : null });
      }));
      return Object.freeze({case: caseName, tidalFluxWattsPerSquareMeter: tidal,
        assumedRadiogenicFluxWattsPerSquareMeter: tidal === null ? null : radiogenic,
        assumedBasalFluxWattsPerSquareMeter: flux,
        baseOfH2OShellTemperatureKelvin: baseTemperature,
        modelledIceThicknessKilometers: shellThickness,
        conditionalIceMassKilograms: iceMass,
        conditionalLiquidMassKilograms: liquidMass,
        phaseRegime: regime, temperatureProfile});
    });
    for (const scenario of thermalScenarios) {
      if (scenario.conditionalIceMassKilograms !== null &&
          (!approximately(scenario.conditionalIceMassKilograms + scenario.conditionalLiquidMassKilograms!,
            masses[3]) || scenario.conditionalLiquidMassKilograms! < 0)) {
        throw new RangeError('32.F.2b water shell scenarios must conserve H2O.');
      }
    }
    return Object.freeze({
      contractVersion: '32.F.2b-differentiated-conditional-profile-v1',
      provenance: 'CONDITIONAL_DIFFERENTIATED_FORMATION_ENDMEMBER_NOT_OBSERVED',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      totalMassKilograms: mass, waterMassKilograms: masses[3],
      surfaceRadiusKilometers: radius / 1000,
      layers: Object.freeze(layers), pressureProfile: profile,
      centralLithostaticPressurePascal: pressures[0],
      assumedWaterConductivityWattsPerMeterKelvin: 2.5,
      pressureDependentMeltModel: 'PURE_H2O_ICE_IH_ONLY_BELOW_200_MPA',
      assumedRadiogenicSpecificPowerUpperWattsPerKilogramRock: 1e-11,
      actualRadiogenicHeatFluxWattsPerSquareMeter: null,
      actualSalinity: null, actualOceanPresence: 'UNKNOWN',
      actualInteriorLiquidMassKilograms: null,
      actualIceShellThicknessKilometers: null,
      thermalScenarios: Object.freeze(thermalScenarios), modelLimits: SENSITIVITY_LIMITS,
    } satisfies MoonInteriorStructure32F2b);
  }
}
