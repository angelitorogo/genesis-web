/**
 * H5 optional parametric irradiation of WD-hosted S-type planets in a multiple.
 * Apply the same isolated/slow-mass-loss closure to inner AB and triple outer
 * (AB,C) relative orbits. Only the orbit-averaged point-source *approximation*
 * is calculated. It omits evolving inclinations, planetary synodic phases,
 * secular stability, tidal evolution and collisions. Never persist it as an
 * authoritative system hierarchy or current irradiation measurement.
 */
export interface H5StellarComponentInput {
  readonly label: 'A' | 'B' | 'C';
  readonly initialMassSolar: number;
  readonly currentMassSolar: number | null;
  readonly currentLuminositySolar: number | null;
}
export interface H5RelativeStellarOrbitInput {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
}
export interface H5MultiHostFluxInput {
  readonly host: 'A' | 'B' | 'C';
  readonly components: readonly H5StellarComponentInput[];
  readonly innerOrbit: H5RelativeStellarOrbitInput;
  readonly outerOrbit: H5RelativeStellarOrbitInput | null;
  readonly projectedPlanetSemiMajorAxisAu: number;
  readonly planetaryEccentricity: number;
}
export interface H5MultiHostIrradiationScenario {
  readonly kind: 'ASSUMED_ADIABATIC_MULTIPLE_HIERARCHY_V1';
  readonly innerRelativeAxisAu: number;
  readonly outerRelativeAxisAu: number | null;
  readonly companionMeanFluxEarth: number;
  readonly geometryWasProjected: true;
  readonly stabilityValidated: false;
  readonly luminositiesComplete: true;
}
const validOrbit = (o: H5RelativeStellarOrbitInput): boolean =>
  Number.isFinite(o.semiMajorAxisAu) && o.semiMajorAxisAu > 0 &&
  Number.isFinite(o.eccentricity) && o.eccentricity >= 0 && o.eccentricity < 0.8;
const positive = (v: number | null): v is number =>
  v !== null && Number.isFinite(v) && v > 0;

export function projectH5MultiHostCompanionIrradiation(
  input: H5MultiHostFluxInput,
): H5MultiHostIrradiationScenario | null {
  const {components, host, innerOrbit, outerOrbit} = input;
  if (!validOrbit(innerOrbit) || !positive(input.projectedPlanetSemiMajorAxisAu) ||
      !(Number.isFinite(input.planetaryEccentricity) &&
        input.planetaryEccentricity >= 0 && input.planetaryEccentricity < 1) ||
      (components.length !== 2 && components.length !== 3) ||
      (components.length === 3 ? outerOrbit === null || !validOrbit(outerOrbit) : outerOrbit !== null) ||
      new Set(components.map(c => c.label)).size !== components.length ||
      !components.some(c => c.label === host) ||
      !components.some(c => c.label === 'A') || !components.some(c => c.label === 'B') ||
      (components.length === 3 && !components.some(c => c.label === 'C')) ||
      components.some(c => !positive(c.initialMassSolar) || !positive(c.currentMassSolar) ||
        c.currentMassSolar > c.initialMassSolar + 1e-7 ||
        c.currentLuminositySolar === null ||
        !Number.isFinite(c.currentLuminositySolar) || c.currentLuminositySolar < 0)) return null;
  const a = components.find(c => c.label === 'A')!;
  const b = components.find(c => c.label === 'B')!;
  const c = components.find(c => c.label === 'C');
  const originalAB = a.initialMassSolar + b.initialMassSolar;
  const currentAB = a.currentMassSolar! + b.currentMassSolar!;
  const currentInner = innerOrbit.semiMajorAxisAu * originalAB / currentAB;
  const currentOuter = c && outerOrbit ? outerOrbit.semiMajorAxisAu *
    (originalAB + c.initialMassSolar) / (currentAB + c.currentMassSolar!) : null;
  // Avoid applying distant point-source approximation when the planet is
  // large enough to overlap the stellar relative orbital range.
  const apoPlanet = input.projectedPlanetSemiMajorAxisAu * (1 + input.planetaryEccentricity);
  const innerPeri = currentInner * (1 - innerOrbit.eccentricity);
  if (!positive(currentInner) || !positive(innerPeri) ||
      (host !== 'C' && apoPlanet >= 0.25 * innerPeri) ||
      (host === 'C' && (currentOuter === null || outerOrbit === null ||
        apoPlanet >= 0.25 * currentOuter * (1 - outerOrbit.eccentricity)))) return null;
  const flux = (luminosity: number, axis: number, ecc: number): number =>
    luminosity / (axis * axis * Math.sqrt(1 - ecc * ecc));
  let companionFlux = 0;
  if (host === 'A' || host === 'B') {
    companionFlux += flux(host === 'A' ? b.currentLuminositySolar! : a.currentLuminositySolar!,
      currentInner, innerOrbit.eccentricity);
    if (c && currentOuter !== null && outerOrbit) {
      companionFlux += flux(c.currentLuminositySolar!, currentOuter, outerOrbit.eccentricity);
    }
  } else if (currentOuter !== null && outerOrbit) {
    companionFlux += flux(a.currentLuminositySolar! + b.currentLuminositySolar!,
      currentOuter, outerOrbit.eccentricity);
  }
  if (!Number.isFinite(companionFlux) || companionFlux < 0) return null;
  return Object.freeze({
    kind: 'ASSUMED_ADIABATIC_MULTIPLE_HIERARCHY_V1' as const,
    innerRelativeAxisAu: currentInner,
    outerRelativeAxisAu: currentOuter,
    companionMeanFluxEarth: companionFlux,
    geometryWasProjected: true as const,
    stabilityValidated: false as const,
    luminositiesComplete: true as const,
  });
}
