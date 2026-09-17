/**
 * V1 point-24.6 minor-body ellipse presentation.  The focus stays at the host:
 * b=a sqrt(1-e²), c=a e, and when required the *whole* ellipse is expanded
 * uniformly to keep its periapsis outside the apparent photosphere.
 * Physical AU, period, eccentricity and angular elements never change.
 */
export function buildSystemSceneMinorBodyOrbitPresentationV1(input: Readonly<{
  semiMajorAxisAu: number;
  eccentricity: number;
  projectedSemiMajorScene: number;
  maximumVisibleStarRadiusScene: number;
}>): Readonly<{
  semiMajorScene: number;
  semiMinorScene: number;
  focusOffsetScene: number;
  presentationExpansionFactor: number;
  linearScenePerAu: number | null;
}> {
  const {semiMajorAxisAu: physicalAxis, eccentricity: e,
    projectedSemiMajorScene: projectedAxis, maximumVisibleStarRadiusScene: starRadius} = input;
  if (!(Number.isFinite(physicalAxis) && physicalAxis > 0 &&
    Number.isFinite(e) && e >= 0 && e < 1 &&
    Number.isFinite(projectedAxis) && projectedAxis > 0 &&
    Number.isFinite(starRadius) && starRadius >= 0)) {
    throw new RangeError('V1 minor-body orbit requires a valid bound Kepler ellipse.');
  }
  // These are the original V1 snapshot-builder constants and equations.
  const projectedPeriapsisScene = projectedAxis * (1 - e);
  const minimumPeriapsisScene = Math.max(0.48, starRadius + 0.22);
  const expansion = projectedPeriapsisScene > Number.EPSILON &&
    projectedPeriapsisScene < minimumPeriapsisScene
      ? minimumPeriapsisScene / projectedPeriapsisScene : 1;
  const aScene = projectedAxis * expansion;
  return Object.freeze({
    semiMajorScene: aScene,
    semiMinorScene: aScene * Math.sqrt(1 - e ** 2),
    focusOffsetScene: aScene * e,
    presentationExpansionFactor: expansion,
    linearScenePerAu: expansion > 1 && physicalAxis > Number.EPSILON
      ? aScene / physicalAxis : null,
  });
}
