import {
  H4B_EFFECTIVE_ESCAPE_COUPLING_EXPERIMENTS,
  projectWhiteDwarfPostAgbAtmosphereHistory as project,
} from './white-dwarf-post-agb-atmosphere-history';

const input = Object.freeze({
  isWhiteDwarf: true,
  postAgbOrbitHypothesisAvailable: true,
  initialStellarMassSolar: 1.47,
  currentWhiteDwarfMassSolar: 0.58,
  progenitorTerminalAgeBillionYears: 1.4,
  postMainSequenceDurationBillionYears: 0.18,
  coolingAgeBillionYears: 9.803,
  presentWhiteDwarfLuminositySolar: 1.57e-5,
  formationSemiMajorAxisAu: 4.583,
  hypotheticalPostAgbSemiMajorAxisAu: 13.461,
  planetRadiusEarth: 1.273,
  referenceAtmospherePressurePascal: 1_281_021.912,
  h4WdOnlyGasPressureCeilingPascal: 36_555.703,
  companionIrradiationUnresolved: true,
});

describe('29.1E-H4b parametric RGB/AGB and WD historical sensitivity', () => {
  it('deterministically separates RGB, AGB and the resolved WD cooling window', () => {
    const result = project(input)!;
    expect(result).toEqual(project(input));
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.stages)).toBe(true);
    expect(Object.isFrozen(result.scenarios)).toBe(true);
    expect(result.stages.map(stage => stage.stage))
      .toEqual(['RGB', 'AGB', 'WD_COOLING_RESOLVED_WINDOW']);
    expect(result.stellarMassLostSolar).toBeCloseTo(0.89);
    expect(result.stages[0].representativeDurationBillionYears +
      result.stages[1].representativeDurationBillionYears)
      .toBeCloseTo(input.postMainSequenceDurationBillionYears, 10);
    expect(result.minimumBolometricFluenceJoulePerSquareMeter).toBeGreaterThan(0);
    expect(result.maximumBolometricFluenceJoulePerSquareMeter)
      .toBeGreaterThan(result.minimumBolometricFluenceJoulePerSquareMeter);
    expect(result.missingEarlyWdCoolingExposure).toBe(true);
    expect(result.rgbAgbLuminosityTrackAssumedNotResolved).toBe(true);
    expect(result.presentAtmosphereUnresolved).toBe(true);
    expect(result.planetaryEngulfmentUnresolved).toBe(true);
  });

  it('has bounded, monotonic escape sensitivity without promoting any scenario to actual pressure', () => {
    const result = project(input)!;
    expect(result.scenarios.map(row => row.effectiveBolometricToEscapeCoupling01))
      .toEqual([...H4B_EFFECTIVE_ESCAPE_COUPLING_EXPERIMENTS]);
    expect(result.scenarios[0].afterWdCoolingGasInventoryPressureRangePascal)
      .toEqual([input.referenceAtmospherePressurePascal, input.referenceAtmospherePressurePascal]);
    expect(result.scenarios[0].afterH4CryocondensationCeilingRangePascal)
      .toEqual([input.h4WdOnlyGasPressureCeilingPascal, input.h4WdOnlyGasPressureCeilingPascal]);
    for (let i = 0; i < result.scenarios.length; i++) {
      const current = result.scenarios[i];
      const [lo, hi] = current.afterWdCoolingGasInventoryPressureRangePascal;
      expect(lo).toBeGreaterThanOrEqual(0);
      expect(hi).toBeLessThanOrEqual(input.referenceAtmospherePressurePascal);
      expect(lo).toBeLessThanOrEqual(hi);
      expect(current.afterH4CryocondensationCeilingRangePascal[1])
        .toBeLessThanOrEqual(input.h4WdOnlyGasPressureCeilingPascal);
      if (i > 0) {
        expect(lo).toBeLessThanOrEqual(
          result.scenarios[i - 1].afterWdCoolingGasInventoryPressureRangePascal[0]);
        expect(hi).toBeLessThanOrEqual(
          result.scenarios[i - 1].afterWdCoolingGasInventoryPressureRangePascal[1]);
      }
    }
  });

  it('does not infer wind erosion, XUV fraction or an engulfment result from a mass loss alone', () => {
    const result = project(input)!;
    expect(result.stellarWindAndXuvSpectrumUnresolved).toBe(true);
    expect(result.planetaryEngulfmentUnresolved).toBe(true);
    expect(result.volatileResupplyUnresolved).toBe(true);
    expect(result.companionIrradiationUnresolved).toBe(true);
    expect(result.completeLossCouplingThresholdRange01[0]).toBeLessThanOrEqual(
      result.completeLossCouplingThresholdRange01[1]);
  });

  it('keeps the actual incoming physical data immutable and never needs seed or object name', () => {
    const before = JSON.stringify(input);
    const result = project(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(result).not.toBeNull();
    expect(result!.scenarios.every(row =>
      Object.isFrozen(row) && Object.isFrozen(row.afterAgbGasInventoryPressureRangePascal),
    )).toBe(true);
  });

  it('requires WD, orbit hypothesis, positive physical inputs and available H4 reference', () => {
    expect(project({...input, isWhiteDwarf: false})).toBeNull();
    expect(project({...input, postAgbOrbitHypothesisAvailable: false})).toBeNull();
    expect(project({...input, initialStellarMassSolar: null})).toBeNull();
    expect(project({...input, currentWhiteDwarfMassSolar: 2})).toBeNull();
    expect(project({...input, progenitorTerminalAgeBillionYears: null})).toBeNull();
    expect(project({...input, postMainSequenceDurationBillionYears: null})).toBeNull();
    expect(project({...input, coolingAgeBillionYears: null})).toBeNull();
    expect(project({...input, presentWhiteDwarfLuminositySolar: null})).toBeNull();
    expect(project({...input, hypotheticalPostAgbSemiMajorAxisAu: 1})).toBeNull();
    expect(project({...input, referenceAtmospherePressurePascal: null})).toBeNull();
    expect(project({...input, h4WdOnlyGasPressureCeilingPascal: null})).toBeNull();
    expect(project({...input, h4WdOnlyGasPressureCeilingPascal: 1e9})).toBeNull();
    expect(project({...input, planetRadiusEarth: -1})).toBeNull();
  });

  it('works for SINGLE-like WD inputs and possible BINARY/TRIPLE S-type hosts only with an orbit hypothesis', () => {
    const musia = project({
      ...input,
      initialStellarMassSolar: 1.47, currentWhiteDwarfMassSolar: 0.554,
      formationSemiMajorAxisAu: 1.819, hypotheticalPostAgbSemiMajorAxisAu: 4.828,
      planetRadiusEarth: 0.948, referenceAtmospherePressurePascal: 5704.803,
      h4WdOnlyGasPressureCeilingPascal: 47.119, coolingAgeBillionYears: 8.893,
      presentWhiteDwarfLuminositySolar: 1.73e-5,
    });
    expect(musia).not.toBeNull();
    expect(musia?.scenarios[0].afterH4CryocondensationCeilingRangePascal[1]).toBeCloseTo(47.119);
    expect(project({...input, postAgbOrbitHypothesisAvailable: false})).toBeNull();
  });

  it('separates pre-WD and WD cooling stages instead of pretending the giant exposure was measured', () => {
    const result = project(input)!;
    const giantMin = result.stages[0].bolometricFluenceMinimumJoulePerSquareMeter +
      result.stages[1].bolometricFluenceMinimumJoulePerSquareMeter;
    const wdMin = result.stages[2].bolometricFluenceMinimumJoulePerSquareMeter;
    expect(giantMin + wdMin).toBeCloseTo(result.minimumBolometricFluenceJoulePerSquareMeter, 5);
    expect(result.stages[2].representativeLuminositySolar).toBeNull();
    expect(result.stages[2].representativeDurationBillionYears).toBeCloseTo(
      input.coolingAgeBillionYears - 0.02, 10);
  });
});
