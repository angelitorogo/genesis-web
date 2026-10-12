/**
 * 29.1E-H5-B: CONDITIONAL adiabatic AB barycentre and finite-separation irradiation with mean-anomaly quadrature.
 * Never replace a generated P-type orbit or assert N-body stability. The
 * geometric screen refuses configurations where resolving A+B in coplanar phase averages
 * or treating C as a modeled outer orbit would be unjustified.
 */
export interface H5PTypeInput {
  readonly formationPlanetAxisAu: number;
  readonly planetaryEccentricity: number;
  readonly innerAxisAu: number;
  readonly innerEccentricity: number;
  readonly initialMassA: number;
  readonly currentMassA: number;
  readonly luminosityA: number;
  readonly initialMassB: number;
  readonly currentMassB: number;
  readonly luminosityB: number;
  readonly whiteDwarfLabel: 'A' | 'B';
  readonly outer: Readonly<{
    axisAu: number; eccentricity: number;
    initialMassC: number; currentMassC: number; luminosityC: number;
  }> | null;
}
export interface H5PTypeProjection {
  readonly kind: 'ADIABATIC_CIRCUMBINARY_PHASE_AVERAGED_V1';
  readonly planetAxisAu: number;
  readonly periodYears: number;
  readonly expansionFactor: number;
  readonly projectedInnerAxisAu: number;
  readonly projectedOuterAxisAu: number | null;
  readonly whiteDwarfFluxEarth: number;
  readonly otherStarsFluxEarth: number;
  readonly totalModeledFluxEarth: number;
  readonly circumBinaryStabilityValidated: false;
  readonly phaseAveragingAssumed: true;
  readonly stellarEvolutionAndOrbitsAssumed: true;
}
const validMass = (v: number): boolean => Number.isFinite(v) && v > 0;
const validLum = (v: number): boolean => Number.isFinite(v) && v >= 0;
const validE = (v: number): boolean => Number.isFinite(v) && v >= 0 && v < 0.8;
const SAMPLES = 48;
const TAU = Math.PI * 2;
/** Keplerian planar position at equally spaced mean anomalies, not true anomalies. */
function orbitPositions(axis: number, e: number): readonly (readonly [number, number])[] {
  return Array.from({length: SAMPLES}, (_, i) => {
    const mean = TAU * (i + 0.5) / SAMPLES;
    let anomaly = mean;
    for (let k = 0; k < 12; k++) {
      const delta = (anomaly - e * Math.sin(anomaly) - mean) /
        (1 - e * Math.cos(anomaly));
      anomaly -= delta;
      if (Math.abs(delta) < 1e-13) break;
    }
    return [axis * (Math.cos(anomaly) - e),
      axis * Math.sqrt(1 - e * e) * Math.sin(anomaly)] as const;
  });
}
/** Empirical Holman–Wiegert circumbinary fit: diagnostic applicability only. */
function circumbinaryCriticalRatio(e: number, mu: number): number {
  return 1.60 + 5.10 * e - 2.22 * e ** 2 + 4.12 * mu -
    4.27 * e * mu - 5.09 * mu ** 2 + 4.61 * e ** 2 * mu ** 2;
}

export function projectH5PTypeWhiteDwarfEnvironment(input: H5PTypeInput): H5PTypeProjection | null {
  const o = input.outer;
  if (![input.formationPlanetAxisAu, input.innerAxisAu].every(validMass) ||
      !validE(input.planetaryEccentricity) || !validE(input.innerEccentricity) ||
      ![input.initialMassA, input.currentMassA, input.initialMassB, input.currentMassB].every(validMass) ||
      ![input.luminosityA, input.luminosityB].every(validLum) ||
      input.currentMassA > input.initialMassA + 1e-7 ||
      input.currentMassB > input.initialMassB + 1e-7 ||
      (o !== null && (![o.axisAu, o.initialMassC, o.currentMassC].every(validMass) ||
        !validE(o.eccentricity) || !validLum(o.luminosityC) ||
        o.currentMassC > o.initialMassC + 1e-7))) return null;
  const m0 = input.initialMassA + input.initialMassB;
  const mf = input.currentMassA + input.currentMassB;
  const factor = m0 / mf;
  const innerAxis = input.innerAxisAu * factor;
  const planetAxis = input.formationPlanetAxisAu * factor;
  // A new mass ratio changes the empirical critical axis; do not reuse the
  // progenitor stability zone. This fit is an applicability SCREEN, not proof
  // of secular stability, survival or interactions with the giant envelope.
  const mu = Math.min(input.currentMassA, input.currentMassB) / mf;
  const critical = innerAxis * circumbinaryCriticalRatio(input.innerEccentricity, mu);
  const innerApo = innerAxis * (1 + input.innerEccentricity);
  const planetPeri = planetAxis * (1 - input.planetaryEccentricity);
  if (!(planetAxis > 1.02 * critical && planetPeri > 1.15 * innerApo)) return null;
  let cFlux = 0;
  let outerAxis: number | null = null;
  if (o !== null) {
    outerAxis = o.axisAu * (m0 + o.initialMassC) / (mf + o.currentMassC);
    const outerPeri = outerAxis * (1 - o.eccentricity);
    // Reject configurations too close to the moving external companion.
    // This is not a replacement for three-body stability or the canonical
    // S-type critical region bounding the generated AB population.
    if (planetAxis * (1 + input.planetaryEccentricity) >= outerPeri * 0.75) return null;
  }
  // Finite-separation circumbinary irradiation. Orbital phases are averaged
  // independently and uniformly in MEAN anomaly; A and B positions use the
  // contemporary barycentric mass ratios. This avoids the poor point-source
  // approximation at generated P-type distances ~3-4 inner binary axes.
  const planetPositions = orbitPositions(planetAxis, input.planetaryEccentricity);
  const stellarPositions = orbitPositions(innerAxis, input.innerEccentricity);
  // The external C star can be only a few planetary orbital radii away;
  // resolve its own Kepler phase rather than assuming |r| = a_outer.
  if (o && outerAxis !== null && o.luminosityC > 0) {
    const companionPositions = orbitPositions(outerAxis, o.eccentricity);
    for (const planet of planetPositions) {
      for (const relative of companionPositions) {
        for (let apsidal = 0; apsidal < 4; apsidal++) {
          const rx = apsidal === 0 ? relative[0] : apsidal === 1 ? -relative[1] :
            apsidal === 2 ? -relative[0] : relative[1];
          const ry = apsidal === 0 ? relative[1] : apsidal === 1 ? relative[0] :
            apsidal === 2 ? -relative[1] : -relative[0];
          const d2 = (planet[0] - rx) ** 2 + (planet[1] - ry) ** 2;
          if (d2 <= 0) return null;
          cFlux += o.luminosityC / d2;
        }
      }
    }
    cFlux /= 4 * SAMPLES ** 2;
  }
  let fluxA = 0;
  let fluxB = 0;
  for (const planet of planetPositions) {
    for (const relative of stellarPositions) {
      // No known relative apsidal alignment: average four orientations so an
      // artificial aligned eccentric apsis cannot bias the WD/other split.
      for (let apsidal = 0; apsidal < 4; apsidal++) {
        const rx = apsidal === 0 ? relative[0] : apsidal === 1 ? -relative[1] :
          apsidal === 2 ? -relative[0] : relative[1];
        const ry = apsidal === 0 ? relative[1] : apsidal === 1 ? relative[0] :
          apsidal === 2 ? -relative[1] : -relative[0];
        const ax = -rx * input.currentMassB / mf;
        const ay = -ry * input.currentMassB / mf;
        const bx = rx * input.currentMassA / mf;
        const by = ry * input.currentMassA / mf;
        const distA2 = (planet[0] - ax) ** 2 + (planet[1] - ay) ** 2;
        const distB2 = (planet[0] - bx) ** 2 + (planet[1] - by) ** 2;
        if (distA2 <= 0 || distB2 <= 0) return null;
        fluxA += input.luminosityA / distA2;
        fluxB += input.luminosityB / distB2;
      }
    }
  }
  fluxA /= 4 * SAMPLES ** 2;
  fluxB /= 4 * SAMPLES ** 2;
  const wdFlux = input.whiteDwarfLabel === 'A' ? fluxA : fluxB;
  const other = (input.whiteDwarfLabel === 'A' ? fluxB : fluxA) + cFlux;
  const period = Math.sqrt(planetAxis ** 3 / mf);
  if (![planetAxis, innerAxis, wdFlux, other, period].every(Number.isFinite) ||
      wdFlux < 0 || other < 0 || period <= 0) return null;
  return Object.freeze({
    kind: 'ADIABATIC_CIRCUMBINARY_PHASE_AVERAGED_V1' as const,
    planetAxisAu: planetAxis, periodYears: period,
    expansionFactor: factor, projectedInnerAxisAu: innerAxis,
    projectedOuterAxisAu: outerAxis,
    whiteDwarfFluxEarth: wdFlux,
    otherStarsFluxEarth: other,
    totalModeledFluxEarth: wdFlux + other,
    circumBinaryStabilityValidated: false as const,
    phaseAveragingAssumed: true as const,
    stellarEvolutionAndOrbitsAssumed: true as const,
  });
}
