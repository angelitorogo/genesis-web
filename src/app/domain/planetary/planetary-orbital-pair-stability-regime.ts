/**
 * Point-18.5 coarse dynamical state of one adjacent mature-planet pair.
 *
 * V1 intentionally distinguishes a hard mutual-Hill failure from a conservative
 * marginal spacing. It is not an N-body integration, resonance map or secular
 * chaos classifier.
 */
export enum PlanetaryOrbitalPairStabilityRegime {
  STABLE =
    'STABLE',

  MARGINAL =
    'MARGINAL',

  UNSTABLE =
    'UNSTABLE',
}
