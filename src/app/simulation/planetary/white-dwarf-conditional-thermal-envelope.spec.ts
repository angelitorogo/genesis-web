import {
  boundCompanionBolometricInsolationEarth,
  projectWhiteDwarfConditionalThermalEnvelope,
  sumRadiativeBounds,
  H2_SOLAR_IRRADIANCE_WATTS_PER_SQUARE_METER,
  H2_STEFAN_BOLTZMANN_WATTS_PER_M2_K4,
} from './white-dwarf-conditional-thermal-envelope';

const companionZero = Object.freeze({lowerEarth: 0, upperEarth: 0,
  unresolvedSource: false, includesCompanion: false});
const envelope = (input: Partial<Parameters<typeof projectWhiteDwarfConditionalThermalEnvelope>[0]> = {}) =>
  projectWhiteDwarfConditionalThermalEnvelope({
    currentWhiteDwarfLuminositySolar: 1.73e-5,
    planetSemiMajorAxisAu: 1.819,
    planetEccentricity: 0.029,
    referenceBondAlbedo01: 0.138,
    intrinsicHeatFluxWattsPerSquareMeter: 0.066,
    companionRadiativeBound: companionZero,
    ...input,
  });

describe('29.1E-H2 - WD thermal envelope without atmosphere invention', () => {
  it('computes deterministic airless equilibrium with explicit WD bolometric flux + intrinsic heat', () => {
    const result = envelope()!;
    const far = 1.819 * (1 + 0.029);
    const expectedFlux = 1.73e-5 / far ** 2;
    const expectedKelvin = (
      ((1 - 0.138) * expectedFlux * H2_SOLAR_IRRADIANCE_WATTS_PER_SQUARE_METER / 4 + 0.066) /
      H2_STEFAN_BOLTZMANN_WATTS_PER_M2_K4
    ) ** 0.25;
    expect(result.externalFluxLowerEarth).toBeCloseTo(expectedFlux, 12);
    expect(result.equilibriumLowerKelvin).toBeCloseTo(expectedKelvin, 10);
    expect(result.equilibriumUpperKelvin).toBeGreaterThan(result.equilibriumLowerKelvin);
    expect(envelope()).toEqual(result);
    expect(Object.isFrozen(result)).toBe(true);
    expect('retainedSurfacePressurePascal' in result).toBe(false);
    expect('waterPhaseRegime' in result).toBe(false);
  });

  it('handles the Xiria B-4 H1 values as a conditional scenario, never as a current climate', () => {
    const result = envelope({
      currentWhiteDwarfLuminositySolar: 1.57e-5,
      planetSemiMajorAxisAu: 4.583,
      planetEccentricity: 0.025,
      referenceBondAlbedo01: 0.207,
      intrinsicHeatFluxWattsPerSquareMeter: 0.112,
    })!;
    expect(result.externalFluxLowerEarth).toBeGreaterThan(0);
    expect(result.equilibriumLowerKelvin).toBeGreaterThan(0);
    expect(result.equilibriumUpperKelvin).toBeGreaterThanOrEqual(result.equilibriumLowerKelvin);
    expect(result.albedoIsAssumed).toBe(true);
  });

  it('keeps unknown companion flux and unknown intrinsic heating as unknown upper bounds', () => {
    const result = envelope({
      intrinsicHeatFluxWattsPerSquareMeter: null,
      companionRadiativeBound: {
        lowerEarth: 0, upperEarth: null, unresolvedSource: true, includesCompanion: true,
      },
    })!;
    expect(result.externalFluxLowerEarth).toBeGreaterThan(0);
    expect(result.externalFluxUpperEarth).toBeNull();
    expect(result.equilibriumUpperKelvin).toBeNull();
    expect(result.hasUnresolvedRadiativeSource).toBe(true);
  });

  it('adds known companion flux without pretending an orbital phase', () => {
    const b = boundCompanionBolometricInsolationEarth({
      luminositySolar: 1, relativePeriastronAu: 300, relativeApoastronAu: 360,
      planetaryApoastronAu: 2,
    });
    expect(b.lowerEarth).toBeCloseTo(1 / 362 ** 2, 12);
    expect(b.upperEarth).toBeCloseTo(1 / 298 ** 2, 12);
    const result = envelope({companionRadiativeBound: b})!;
    expect(result.equilibriumLowerKelvin).toBeGreaterThan(envelope()!.equilibriumLowerKelvin);
    expect(result.includesCompanionBound).toBe(true);
    expect(result.hasUnresolvedRadiativeSource).toBe(false);
  });

  it('combines A/B/C sources and prevents false finite upper bound when one is unmodeled', () => {
    const a = boundCompanionBolometricInsolationEarth({
      luminositySolar: 0.1, relativePeriastronAu: 300, relativeApoastronAu: 360,
      planetaryApoastronAu: 3, offsetBoundAu: 2,
    });
    const b = boundCompanionBolometricInsolationEarth({
      luminositySolar: null, relativePeriastronAu: 300, relativeApoastronAu: 360,
      planetaryApoastronAu: 3,
    });
    const total = sumRadiativeBounds([a, b]);
    expect(total.lowerEarth).toBeCloseTo(a.lowerEarth, 12);
    expect(total.upperEarth).toBeNull();
    expect(total.unresolvedSource).toBe(true);
  });

  it('does not fabricate a finite maximum if companion could overlap the planet orbit', () => {
    const result = boundCompanionBolometricInsolationEarth({
      luminositySolar: 1, relativePeriastronAu: 5, relativeApoastronAu: 10,
      planetaryApoastronAu: 6,
    });
    expect(result.upperEarth).toBeNull();
    expect(result.unresolvedSource).toBe(true);
  });

  it('rejects unsupported parameters rather than clamping albedo, orbital eccentricity or luminosity', () => {
    expect(envelope({referenceBondAlbedo01: 1.2})).toBeNull();
    expect(envelope({planetEccentricity: 1})).toBeNull();
    expect(envelope({currentWhiteDwarfLuminositySolar: 0})).toBeNull();
    expect(envelope({intrinsicHeatFluxWattsPerSquareMeter: -1})).toBeNull();
    expect(() => boundCompanionBolometricInsolationEarth({
      luminositySolar: 1, relativePeriastronAu: 10, relativeApoastronAu: 9,
      planetaryApoastronAu: 1,
    })).toThrow(RangeError);
  });
});
