/**
 * 32.F.3: CT-0 radiative inputs and narrowly-defined photon attenuation.
 * Total bolometric stellar flux is NOT ionising EUV/X-ray/gamma flux or dose.
 * Reference 1 MeV direct-beam transmission is NOT an actual stellar spectrum,
 * scattered radiation field, particle shield, biological protection or absorbed dose.
 */
export interface MoonRadiationProtection32F3 {
  readonly contractVersion: '32.F.3-source-separated-photon-transfer-v1';
  readonly provenance: 'V2_BOLOMETRIC_AND_CT0_GEOMETRY_WITH_NIST_PHOTON_REFERENCE';
  readonly hostPlanetOrdinal: number;
  readonly moonOrdinal: number;
  /** Integrated stellar irradiance, not an ionising or gamma source. */
  readonly referenceBolometricWattsPerSquareMeter: number | null;
  readonly ionisingPhotonIncidentWattsPerSquareMeter: null;
  readonly energeticParticleIncidentWattsPerSquareMeter: null;
  readonly surfaceIonisingDoseGrayPerYear: null;
  readonly subsurfaceIonisingDoseGrayPerYear: null;
  readonly atmosphericColumnKilogramsPerSquareMeter: null;
  readonly magneticParticleTransmission01: null;
  readonly waterCoveringState: 'ICE_COVER_OVER_MODELLED_OCEAN' | 'NOT_RESOLVED_FOR_SHIELDING';
  readonly iceCoverThicknessMeters: number | null;
  /** Column computed from the spherical shell layer mass/volume, CT-0. */
  readonly iceCoverMassColumnKilogramsPerSquareMeter: number | null;
  /** Conditional transmission of a MONOENERGETIC 1 MeV PRIMARY gamma beam. */
  readonly referenceOneMeVGammaIceOpticalDepth: number | null;
  readonly referenceOneMeVGammaDirectTransmissionToOcean01: number | null;
  readonly referenceOneMeVGammaDirectTransmissionToOceanBase01: number | null;
  readonly scientificLimits: readonly string[];
}

/** Reference media for 1 MeV primary gamma photons, not multi-band radiation. */
export type PhotonMedium32F3 =
  | 'ICE_H2O_WATER_PROXY' | 'LIQUID_WATER' | 'AIR_DRY_REFERENCE' | 'ROCK_CONCRETE_PROXY';

export interface PhotonLayer32F3 {
  readonly medium: PhotonMedium32F3;
  readonly massColumnKilogramsPerSquareMeter: number;
}

export interface IndependentlyQuantifiedPhotonBeam32F3 {
  readonly sourceKind: 'INDEPENDENT_MONOENERGETIC_GAMMA_1_MEV';
  readonly sourceRecordKey: string;
  readonly photonEnergyMeV: 1;
  readonly incidentEnergyFluxWattsPerSquareMeter: number;
}

export interface PhotonTransferResult32F3 {
  readonly sourceRecordKey: string;
  readonly incidentEnergyFluxWattsPerSquareMeter: number;
  readonly opticalDepth: number;
  readonly directTransmission01: number;
  readonly transmittedDirectBeamWattsPerSquareMeter: number;
  /** Removed from PRIMARY beam (includes scattering); not equivalent to absorbed energy. */
  readonly removedFromDirectBeamWattsPerSquareMeter: number;
  readonly absorbedDoseGrayPerYear: null;
  readonly scatteredPhotonFluxWattsPerSquareMeter: null;
}

/** NIST tabulated photon energies; EUV (<1 keV) and particles are excluded. */
export type TabulatedPhotonEnergyMeV32F3 = 0.001 | 0.01 | 0.1 | 1 | 10;

export interface QuantifiedPhotonBand32F3 {
  readonly photonEnergyMeV: TabulatedPhotonEnergyMeV32F3;
  readonly energyFluxWattsPerSquareMeter: number;
}

export interface IndependentlyQuantifiedPhotonSpectrum32F3 {
  readonly sourceKind: 'INDEPENDENT_PHOTON_SPECTRUM_1_KEV_TO_10_MEV';
  readonly sourceRecordKey: string;
  readonly bands: readonly QuantifiedPhotonBand32F3[];
}

export interface PhotonSpectrumTransferResult32F3 {
  readonly sourceRecordKey: string;
  readonly bands: readonly (PhotonTransferResult32F3 & {
    readonly photonEnergyMeV: TabulatedPhotonEnergyMeV32F3;
  })[];
  readonly totalIncidentEnergyFluxWattsPerSquareMeter: number;
  readonly totalTransmittedDirectBeamWattsPerSquareMeter: number;
  readonly totalRemovedFromDirectBeamWattsPerSquareMeter: number;
  readonly absorbedDoseGrayPerYear: null;
  readonly unmodelledPhotonsAndParticlesStatus: 'UNKNOWN_OUTSIDE_SUPPLIED_ENERGY_BANDS';
}
