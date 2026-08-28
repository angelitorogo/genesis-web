/**
 * Presentation-only compression of a physical stellar radius into the
 * schematic radius used by point 16.7.
 *
 * The mapping is deliberately monotonic but strongly saturated: visibly
 * smaller/larger stars remain distinguishable while extreme giants or very
 * compact stars cannot dominate (or disappear from) the orbital diagram.
 */
export function stellarVisualRadiusScale(
  radiusSolar:
    number,
): number {

  if (
    !Number.isFinite(
      radiusSolar,
    ) ||
    radiusSolar <=
      0
  ) {
    return 1;
  }

  const logarithmicRadius =
    Math.log10(
      Math.max(
        0.001,
        radiusSolar,
      ),
    );

  const compressed =
    1 +
    0.34 *
      Math.tanh(
        1.15 *
          logarithmicRadius,
      );

  return Math.min(
    1.36,
    Math.max(
      0.68,
      compressed,
    ),
  );
}
