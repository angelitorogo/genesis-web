import type { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonOceanReality32F2c, MoonOceanRadialLayer32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import type {
  MoonRadiationProtection32F3, IndependentlyQuantifiedPhotonBeam32F3,
  PhotonLayer32F3, PhotonMedium32F3, PhotonTransferResult32F3,
  TabulatedPhotonEnergyMeV32F3, IndependentlyQuantifiedPhotonSpectrum32F3,
  PhotonSpectrumTransferResult32F3,
} from '../../domain/planetary/moon-radiation-protection-32-f-3';

const EARTH_SOLAR_CONSTANT_W_M2 = 1361;
const EARTH_RADIUS_METERS = 6_371_000;
/** NIST X-Ray Mass Attenuation Tables (1 MeV), cm²/g -> m²/kg = ×0.1.
 * Water liquid is an explicitly identified CHEMICAL proxy for pure ice,
 * ordinary concrete is only a rock proxy; these are NOT universal coefficients.
 * https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/water.html
 * https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/air.html
 * https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/concrete.html
 */
export const MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3: Readonly<Record<PhotonMedium32F3, number>> =
  Object.freeze({
    ICE_H2O_WATER_PROXY: 0.007072,
    LIQUID_WATER: 0.007072,
    AIR_DRY_REFERENCE: 0.006358,
    ROCK_CONCRETE_PROXY: 0.006495,
  });

/** NIST tables at photon energies 1 keV, 10 keV, 100 keV, 1 MeV, 10 MeV.
 * Each coefficient is µ/ρ [cm²/g] converted to [m²/kg] (×0.1).
 * Data: https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/water.html
 *       https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/air.html
 *       https://physics.nist.gov/PhysRefData/XrayMassCoef/ComTab/concrete.html
 */
export const TABULATED_PHOTON_MASS_ATTENUATION_M2_KG_32F3:
  Readonly<Record<TabulatedPhotonEnergyMeV32F3, Readonly<Record<PhotonMedium32F3, number>>>> =
  Object.freeze({
    0.001: Object.freeze({ ICE_H2O_WATER_PROXY: 407.8, LIQUID_WATER: 407.8,
      AIR_DRY_REFERENCE: 360.6, ROCK_CONCRETE_PROXY: 346.6 }),
    0.01: Object.freeze({ ICE_H2O_WATER_PROXY: .5329, LIQUID_WATER: .5329,
      AIR_DRY_REFERENCE: .5120, ROCK_CONCRETE_PROXY: 2.045 }),
    0.1: Object.freeze({ ICE_H2O_WATER_PROXY: .01707, LIQUID_WATER: .01707,
      AIR_DRY_REFERENCE: .01541, ROCK_CONCRETE_PROXY: .01738 }),
    1: MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3,
    10: Object.freeze({ ICE_H2O_WATER_PROXY: .002219, LIQUID_WATER: .002219,
      AIR_DRY_REFERENCE: .002045, ROCK_CONCRETE_PROXY: .002278 }),
  });

const LIMITS = Object.freeze([
  'BOLOMETRIC_REFERENCE_IS_NOT_EUV_XRAY_GAMMA_OR_PARTICLE_FLUX',
  'NIST_REFERENCE_ONE_MEV_DIRECT_PHOTON_BEAM_ONLY_NOT_STELLAR_SPECTRUM',
  'BEER_LAMBERT_UNCOLLIDED_PRIMARY_PHOTONS_SCATTERED_BUILDUP_UNRESOLVED',
  'ICE_USES_LIQUID_WATER_MASS_ATTENUATION_COMPOSITION_PROXY',
  'ATMOSPHERIC_COLUMN_AND_MAGNETOSPHERIC_PARTICLE_TRANSFER_UNKNOWN',
  'NO_SURFACE_OR_OCEAN_DOSE_OR_BIOLOGICAL_SAFETY_INFERRED',
]);

function nonnegative(x: number): boolean { return Number.isFinite(x) && x >= 0; }
function close(a: number, b: number): boolean {
  return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
}

/** Ideal direct-beam Beer–Lambert transport. Removed energy is NOT absorbed dose. */
export class MoonRadiationProtectionEngine32F3 {
  private constructor() {}

  static attenuateIndependentOneMeVBeam(
    beam: IndependentlyQuantifiedPhotonBeam32F3,
    layers: readonly PhotonLayer32F3[],
  ): PhotonTransferResult32F3 {
    if (beam.sourceKind !== 'INDEPENDENT_MONOENERGETIC_GAMMA_1_MEV' ||
      beam.photonEnergyMeV !== 1 || beam.sourceRecordKey.trim().length === 0 ||
      !nonnegative(beam.incidentEnergyFluxWattsPerSquareMeter) ||
      !layers || layers.length === 0) {
      throw new RangeError('32.F.3 requires independently quantified 1 MeV photons and nonempty layers.');
    }
    let opticalDepth = 0;
    for (const layer of layers) {
      if (!nonnegative(layer.massColumnKilogramsPerSquareMeter) ||
        !Object.prototype.hasOwnProperty.call(MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3, layer.medium)) {
        throw new RangeError('32.F.3 requires nonnegative sourced mass columns and known photon medium.');
      }
      opticalDepth += MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3[layer.medium] *
        layer.massColumnKilogramsPerSquareMeter;
    }
    if (!Number.isFinite(opticalDepth)) throw new RangeError('32.F.3 optical depth overflow.');
    const directTransmission01 = Math.exp(-opticalDepth);
    const transmittedDirectBeamWattsPerSquareMeter =
      beam.incidentEnergyFluxWattsPerSquareMeter * directTransmission01;
    return Object.freeze({
      sourceRecordKey: beam.sourceRecordKey,
      incidentEnergyFluxWattsPerSquareMeter: beam.incidentEnergyFluxWattsPerSquareMeter,
      opticalDepth,
      directTransmission01,
      transmittedDirectBeamWattsPerSquareMeter,
      removedFromDirectBeamWattsPerSquareMeter:
        beam.incidentEnergyFluxWattsPerSquareMeter - transmittedDirectBeamWattsPerSquareMeter,
      absorbedDoseGrayPerYear: null,
      scatteredPhotonFluxWattsPerSquareMeter: null,
    });
  }

  /** Spectrally resolved SOURCE-SUPPLIED photons only. This is not a
   * derived stellar X-ray spectrum. No particle dose, scattered buildup or
   * biological conclusions are inferred from the primary-beam transmission. */
  static attenuateIndependentSpectrum(
    source: IndependentlyQuantifiedPhotonSpectrum32F3,
    layers: readonly PhotonLayer32F3[],
  ): PhotonSpectrumTransferResult32F3 {
    if (source.sourceKind !== 'INDEPENDENT_PHOTON_SPECTRUM_1_KEV_TO_10_MEV' ||
      !source.sourceRecordKey || source.sourceRecordKey.trim().length === 0 ||
      !source.bands || source.bands.length === 0 || !layers || layers.length === 0) {
      throw new RangeError('32.F.3 requires sourced photon spectral bands and material columns.');
    }
    const used = new Set<number>();
    const bands: (PhotonTransferResult32F3 & { photonEnergyMeV: TabulatedPhotonEnergyMeV32F3 })[] = [];
    let incident = 0;
    let transmitted = 0;
    for (const band of source.bands) {
      const coefficients = TABULATED_PHOTON_MASS_ATTENUATION_M2_KG_32F3[band.photonEnergyMeV];
      if (!coefficients || used.has(band.photonEnergyMeV) ||
        !nonnegative(band.energyFluxWattsPerSquareMeter)) {
        throw new RangeError('32.F.3 invalid or duplicated spectral photon band.');
      }
      used.add(band.photonEnergyMeV);
      let tau = 0;
      for (const layer of layers) {
        const mu = coefficients[layer.medium];
        if (!nonnegative(layer.massColumnKilogramsPerSquareMeter) || !nonnegative(mu)) {
          throw new RangeError('32.F.3 requires quantified nonnegative columns and tabulated media.');
        }
        tau += mu * layer.massColumnKilogramsPerSquareMeter;
      }
      if (!nonnegative(tau)) throw new RangeError('32.F.3 optical depth overflow.');
      const t = Math.exp(-tau);
      const pass = t * band.energyFluxWattsPerSquareMeter;
      const result = Object.freeze({
        sourceRecordKey: source.sourceRecordKey,
        photonEnergyMeV: band.photonEnergyMeV,
        incidentEnergyFluxWattsPerSquareMeter: band.energyFluxWattsPerSquareMeter,
        opticalDepth: tau,
        directTransmission01: t,
        transmittedDirectBeamWattsPerSquareMeter: pass,
        removedFromDirectBeamWattsPerSquareMeter: band.energyFluxWattsPerSquareMeter - pass,
        absorbedDoseGrayPerYear: null,
        scatteredPhotonFluxWattsPerSquareMeter: null,
      });
      bands.push(result);
      incident += band.energyFluxWattsPerSquareMeter;
      transmitted += pass;
    }
    if (!nonnegative(incident) || !nonnegative(transmitted)) {
      throw new RangeError('32.F.3 photon spectrum energy overflow.');
    }
    return Object.freeze({
      sourceRecordKey: source.sourceRecordKey,
      bands: Object.freeze(bands),
      totalIncidentEnergyFluxWattsPerSquareMeter: incident,
      totalTransmittedDirectBeamWattsPerSquareMeter: transmitted,
      totalRemovedFromDirectBeamWattsPerSquareMeter: incident - transmitted,
      absorbedDoseGrayPerYear: null,
      unmodelledPhotonsAndParticlesStatus: 'UNKNOWN_OUTSIDE_SUPPLIED_ENERGY_BANDS',
    });
  }

  /** Uses V2 bolometric reference and ONLY validated CT-0 ocean-shell geometry.
   * Without a quantified high-energy source, the physical dose stays UNKNOWN.
   * Do NOT substitute the reference 1 MeV example for the stellar spectrum.
   */
  static fromMaterialized(
    physical: MoonPhysicalProperties,
    referenceMeanInsolationEarth: number,
    ocean: MoonOceanReality32F2c | null,
  ): MoonRadiationProtection32F3 {
    if (!nonnegative(referenceMeanInsolationEarth) ||
      !Number.isFinite(physical.radiusEarth) || physical.radiusEarth <= 0 ||
      (ocean !== null && (ocean.hostPlanetOrdinal !== physical.hostPlanetOrdinal ||
        ocean.moonOrdinal !== physical.moonOrdinal))) {
      throw new RangeError('32.F.3 radiation source, moon and ocean must be aligned.');
    }
    let iceCoverThicknessMeters: number | null = null;
    let iceCoverMassColumnKilogramsPerSquareMeter: number | null = null;
    let referenceOneMeVGammaIceOpticalDepth: number | null = null;
    let referenceOneMeVGammaDirectTransmissionToOcean01: number | null = null;
    let referenceOneMeVGammaDirectTransmissionToOceanBase01: number | null = null;
    if (ocean?.state === 'PRESENT_IN_SIMULATED_MODEL' &&
        ocean.provenance === 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION') {
      const ice = ocean.radialLayers.find(layer => layer.phase === 'ICE_IH' &&
        close(layer.topDepthKilometers, 0));
      const liquid = ocean.radialLayers.find(layer => layer.phase === 'LIQUID_H2O');
      if (ice && liquid && ocean.iceCoverThicknessKilometers !== null &&
        nonnegative(ocean.iceCoverThicknessKilometers) &&
        close(ice.bottomDepthKilometers, ocean.iceCoverThicknessKilometers)) {
        const radius = physical.radiusEarth * EARTH_RADIUS_METERS;
        const iceColumn = this.columnFromLayer(ice, radius);
        const liquidColumn = this.columnFromLayer(liquid, radius);
        if (iceColumn !== null && liquidColumn !== null &&
          close(liquid.topDepthKilometers, ice.bottomDepthKilometers)) {
          iceCoverThicknessMeters = ocean.iceCoverThicknessKilometers * 1000;
          iceCoverMassColumnKilogramsPerSquareMeter = iceColumn;
          const tauIce = iceColumn * MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3.ICE_H2O_WATER_PROXY;
          referenceOneMeVGammaIceOpticalDepth = tauIce;
          referenceOneMeVGammaDirectTransmissionToOcean01 = Math.exp(-tauIce);
          referenceOneMeVGammaDirectTransmissionToOceanBase01 = Math.exp(-tauIce -
            liquidColumn * MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3.LIQUID_WATER);
        }
      }
    }
    return Object.freeze({
      contractVersion: '32.F.3-source-separated-photon-transfer-v1',
      provenance: 'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE',
      hostPlanetOrdinal: physical.hostPlanetOrdinal,
      moonOrdinal: physical.moonOrdinal,
      referenceBolometricWattsPerSquareMeter: referenceMeanInsolationEarth * EARTH_SOLAR_CONSTANT_W_M2,
      ionisingPhotonIncidentWattsPerSquareMeter: null,
      energeticParticleIncidentWattsPerSquareMeter: null,
      surfaceIonisingDoseGrayPerYear: null,
      subsurfaceIonisingDoseGrayPerYear: null,
      atmosphericColumnKilogramsPerSquareMeter: null,
      magneticParticleTransmission01: null,
      waterCoveringState: iceCoverMassColumnKilogramsPerSquareMeter !== null
        ? 'ICE_COVER_OVER_MODELLED_OCEAN' : 'NOT_RESOLVED_FOR_SHIELDING',
      iceCoverThicknessMeters,
      iceCoverMassColumnKilogramsPerSquareMeter,
      referenceOneMeVGammaIceOpticalDepth,
      referenceOneMeVGammaDirectTransmissionToOcean01,
      referenceOneMeVGammaDirectTransmissionToOceanBase01,
      scientificLimits: LIMITS,
    } satisfies MoonRadiationProtection32F3);
  }

  private static columnFromLayer(
    layer: MoonOceanRadialLayer32F2c, surfaceRadiusMeters: number,
  ): number | null {
    if (!nonnegative(layer.massKilograms) || !nonnegative(layer.topDepthKilometers) ||
      !nonnegative(layer.bottomDepthKilometers) ||
      layer.bottomDepthKilometers <= layer.topDepthKilometers) return null;
    const rOuter = surfaceRadiusMeters - 1000 * layer.topDepthKilometers;
    const rInner = surfaceRadiusMeters - 1000 * layer.bottomDepthKilometers;
    if (rInner < 0 || rInner >= rOuter) return null;
    const volume = 4 / 3 * Math.PI * (rOuter ** 3 - rInner ** 3);
    if (!(volume > 0)) return null;
    return layer.massKilograms / volume * (rOuter - rInner);
  }
}
