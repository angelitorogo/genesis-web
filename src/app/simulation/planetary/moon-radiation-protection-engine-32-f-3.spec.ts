import { MoonPhysicalProperties } from '../../domain/planetary/moon-physical-properties';
import type { MoonOceanReality32F2c } from '../../domain/planetary/moon-ocean-reality-32-f-2c';
import {
  MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3, MoonRadiationProtectionEngine32F3,
} from './moon-radiation-protection-engine-32-f-3';

const physical = new MoonPhysicalProperties(8, 3, .00016, .078, 1.85, .026);
const r = physical.radiusEarth * 6371000;
const sphereVolume = (topKm: number, bottomKm: number): number =>
  4 / 3 * Math.PI * ((r - topKm * 1000) ** 3 - (r - bottomKm * 1000) ** 3);
const iceDepth = .8174;
const bottomDepth = 90.09;
const mockOcean = (state: MoonOceanReality32F2c['state']): MoonOceanReality32F2c => ({
  state, hostPlanetOrdinal: 8, moonOrdinal: 3,
  provenance: 'SIMULATED_CT0_CONSTITUTIVE_MODEL_NOT_DIRECT_OBSERVATION',
  waterInventoryKilograms: 2.165e20,
  iceCoverThicknessKilometers: state === 'PRESENT_IN_SIMULATED_MODEL' ? iceDepth : null,
  radialLayers: state === 'PRESENT_IN_SIMULATED_MODEL' ? [
    { phase: 'ICE_IH', topDepthKilometers: 0, bottomDepthKilometers: iceDepth,
      massKilograms: sphereVolume(0, iceDepth) * 930 },
    { phase: 'LIQUID_H2O', topDepthKilometers: iceDepth, bottomDepthKilometers: bottomDepth,
      massKilograms: sphereVolume(iceDepth, bottomDepth) * 1000 },
  ] : [],
} as unknown as MoonOceanReality32F2c);

describe('32.F.3 — radiation transport separated from sources and biological verdicts', () => {
  it('reuses NIST 1 MeV mass attenuation in SI with explicitly labelled media proxies', () => {
    expect(MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3.ICE_H2O_WATER_PROXY).toBe(.007072);
    expect(MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3.AIR_DRY_REFERENCE).toBe(.006358);
    expect(MASS_ATTENUATION_ONE_MEV_M2_PER_KG_32F3.ROCK_CONCRETE_PROXY).toBe(.006495);
  });
  it('conserves direct-beam flux as transmitted + removed; not absorbed dose', () => {
    const source = { sourceKind: 'INDEPENDENT_MONOENERGETIC_GAMMA_1_MEV',
      sourceRecordKey: 'quantified-line-1', photonEnergyMeV: 1,
      incidentEnergyFluxWattsPerSquareMeter: 4 } as const;
    const layers = [
      { medium: 'AIR_DRY_REFERENCE', massColumnKilogramsPerSquareMeter: 20 },
      { medium: 'ROCK_CONCRETE_PROXY', massColumnKilogramsPerSquareMeter: 30 },
      { medium: 'ICE_H2O_WATER_PROXY', massColumnKilogramsPerSquareMeter: 10 },
      { medium: 'LIQUID_WATER', massColumnKilogramsPerSquareMeter: 10 },
    ] as const;
    const x = MoonRadiationProtectionEngine32F3.attenuateIndependentOneMeVBeam(source, layers);
    const tau = .006358 * 20 + .006495 * 30 + .007072 * 20;
    expect(x.opticalDepth).toBeCloseTo(tau, 12);
    expect(x.directTransmission01).toBeCloseTo(Math.exp(-tau), 12);
    expect(x.incidentEnergyFluxWattsPerSquareMeter).toBeCloseTo(
      x.transmittedDirectBeamWattsPerSquareMeter + x.removedFromDirectBeamWattsPerSquareMeter, 12);
    expect(x.absorbedDoseGrayPerYear).toBeNull();
    expect(x.scatteredPhotonFluxWattsPerSquareMeter).toBeNull();
  });
  it('rejects unsourced beams, negative columns, unknown media and non-finite values', () => {
    const ok = { sourceKind: 'INDEPENDENT_MONOENERGETIC_GAMMA_1_MEV',
      sourceRecordKey: 'real-record', photonEnergyMeV: 1,
      incidentEnergyFluxWattsPerSquareMeter: 1 } as const;
    const layer = [{ medium: 'ICE_H2O_WATER_PROXY', massColumnKilogramsPerSquareMeter: 1 }] as const;
    expect(() => MoonRadiationProtectionEngine32F3.attenuateIndependentOneMeVBeam(
      {...ok, sourceRecordKey: ' '}, layer)).toThrow();
    expect(() => MoonRadiationProtectionEngine32F3.attenuateIndependentOneMeVBeam(
      {...ok, photonEnergyMeV: 2 as 1}, layer)).toThrow();
    expect(() => MoonRadiationProtectionEngine32F3.attenuateIndependentOneMeVBeam(
      {...ok, incidentEnergyFluxWattsPerSquareMeter: Number.NaN}, layer)).toThrow();
    expect(() => MoonRadiationProtectionEngine32F3.attenuateIndependentOneMeVBeam(ok,
      [{...layer[0], massColumnKilogramsPerSquareMeter: -1}])).toThrow();
    expect(() => MoonRadiationProtectionEngine32F3.attenuateIndependentOneMeVBeam(ok,
      [{...layer[0], medium: 'ALIEN' as typeof layer[0]['medium']}])).toThrow();
  });
  it('transports supplied multi-band X/gamma flux with NIST energy-dependent attenuation', () => {
    const result = MoonRadiationProtectionEngine32F3.attenuateIndependentSpectrum({
      sourceKind: 'INDEPENDENT_PHOTON_SPECTRUM_1_KEV_TO_10_MEV',
      sourceRecordKey: 'quantified-x-gamma-spectrum',
      bands: [
        { photonEnergyMeV: .01, energyFluxWattsPerSquareMeter: 10 },
        { photonEnergyMeV: .1, energyFluxWattsPerSquareMeter: 20 },
        { photonEnergyMeV: 1, energyFluxWattsPerSquareMeter: 40 },
        { photonEnergyMeV: 10, energyFluxWattsPerSquareMeter: 30 },
      ],
    }, [
      { medium: 'AIR_DRY_REFERENCE', massColumnKilogramsPerSquareMeter: 10 },
      { medium: 'ROCK_CONCRETE_PROXY', massColumnKilogramsPerSquareMeter: 30 },
      { medium: 'ICE_H2O_WATER_PROXY', massColumnKilogramsPerSquareMeter: 100 },
      { medium: 'LIQUID_WATER', massColumnKilogramsPerSquareMeter: 100 },
    ]);
    expect(result.bands).toHaveLength(4);
    expect(result.totalIncidentEnergyFluxWattsPerSquareMeter).toBe(100);
    expect(result.totalTransmittedDirectBeamWattsPerSquareMeter +
      result.totalRemovedFromDirectBeamWattsPerSquareMeter).toBeCloseTo(100, 10);
    const gamma = result.bands.find(b => b.photonEnergyMeV === 1)!;
    expect(gamma.opticalDepth).toBeCloseTo(.006358*10+.006495*30+.007072*200, 10);
    expect(result.bands[0].directTransmission01).toBeLessThan(gamma.directTransmission01);
    expect(result.bands[3].directTransmission01).toBeGreaterThan(gamma.directTransmission01);
    expect(result.absorbedDoseGrayPerYear).toBeNull();
    expect(result.unmodelledPhotonsAndParticlesStatus).toBe('UNKNOWN_OUTSIDE_SUPPLIED_ENERGY_BANDS');
    expect(() => MoonRadiationProtectionEngine32F3.attenuateIndependentSpectrum({
      sourceKind: 'INDEPENDENT_PHOTON_SPECTRUM_1_KEV_TO_10_MEV',
      sourceRecordKey: 'quantified-x-gamma-spectrum',
      bands: [
        { photonEnergyMeV: .1, energyFluxWattsPerSquareMeter: 1 },
        { photonEnergyMeV: .1, energyFluxWattsPerSquareMeter: 1 },
      ],
    }, [{medium:'LIQUID_WATER',massColumnKilogramsPerSquareMeter:1}])).toThrow();
  });
  it('uses CT-0 ice mass and geometry, without inventing a stellar gamma flux or dose', () => {
    const a = MoonRadiationProtectionEngine32F3.fromMaterialized(physical, .652, mockOcean('PRESENT_IN_SIMULATED_MODEL'));
    const b = MoonRadiationProtectionEngine32F3.fromMaterialized(physical, .652, mockOcean('PRESENT_IN_SIMULATED_MODEL'));
    expect(a).toEqual(b);
    expect(a.referenceBolometricWattsPerSquareMeter).toBeCloseTo(.652 * 1361, 9);
    expect(a.waterCoveringState).toBe('ICE_COVER_OVER_MODELLED_OCEAN');
    expect(a.iceCoverThicknessMeters).toBeCloseTo(817.4, 9);
    expect(a.iceCoverMassColumnKilogramsPerSquareMeter).toBeCloseTo(930 * 817.4, 5);
    expect(a.referenceOneMeVGammaIceOpticalDepth).toBeCloseTo(.007072 * 930 * 817.4, 8);
    expect(a.referenceOneMeVGammaDirectTransmissionToOcean01).toBe(0);
    expect(a.referenceOneMeVGammaDirectTransmissionToOceanBase01).toBe(0);
    expect(a.ionisingPhotonIncidentWattsPerSquareMeter).toBeNull();
    expect(a.energeticParticleIncidentWattsPerSquareMeter).toBeNull();
    expect(a.subsurfaceIonisingDoseGrayPerYear).toBeNull();
    expect(a.surfaceIonisingDoseGrayPerYear).toBeNull();
    expect(a.magneticParticleTransmission01).toBeNull();
    expect(a.atmosphericColumnKilogramsPerSquareMeter).toBeNull();
  });
  it('unknown/subsurface-free worlds never inherit fictitious ice shielding', () => {
    for (const state of ['ABSENT_IN_SIMULATED_MODEL', 'UNRESOLVED_IN_SIMULATED_MODEL'] as const) {
      const a = MoonRadiationProtectionEngine32F3.fromMaterialized(physical, .8, mockOcean(state));
      expect(a.waterCoveringState).toBe('NOT_RESOLVED_FOR_SHIELDING');
      expect(a.referenceOneMeVGammaDirectTransmissionToOcean01).toBeNull();
      expect(a.iceCoverMassColumnKilogramsPerSquareMeter).toBeNull();
    }
    const noOcean = MoonRadiationProtectionEngine32F3.fromMaterialized(physical, 1, null);
    expect(noOcean.iceCoverThicknessMeters).toBeNull();
  });
  it('rejects inconsistent lunar identity and invalid irradiance', () => {
    expect(() => MoonRadiationProtectionEngine32F3.fromMaterialized(
      physical, -1, mockOcean('PRESENT_IN_SIMULATED_MODEL'))).toThrow();
    expect(() => MoonRadiationProtectionEngine32F3.fromMaterialized(
      physical, 1, {...mockOcean('PRESENT_IN_SIMULATED_MODEL'), moonOrdinal: 999})).toThrow();
  });
});
