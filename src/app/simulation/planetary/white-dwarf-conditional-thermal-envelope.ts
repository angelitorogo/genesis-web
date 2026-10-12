/**
 * 29.1E-H2. Conditional equilibrium of a planet orbiting a cooling white dwarf.
 * THIS IS NOT a prediction of atmosphere survival, greenhouse warming, surface
 * temperature or water phase. H1 supplies current WD bolometric luminosity.
 * All reference albedos and internal heat proxies are explicitly conditional.
 * No seed, clock, atmosphere generator, or stored world is consulted here.
 */
export const H2_SOLAR_IRRADIANCE_WATTS_PER_SQUARE_METER = 1361;
export const H2_STEFAN_BOLTZMANN_WATTS_PER_M2_K4 = 5.670374419e-8;

export interface WhiteDwarfConditionalThermalEnvelope {
  readonly externalFluxLowerEarth: number;
  /** null means at least one radiative source or its geometry is unresolved. */
  readonly externalFluxUpperEarth: number | null;
  readonly internalHeatFluxWattsPerSquareMeter: number | null;
  readonly equilibriumLowerKelvin: number;
  readonly equilibriumUpperKelvin: number | null;
  readonly albedoIsAssumed: true;
  readonly hasUnresolvedRadiativeSource: boolean;
  readonly includesCompanionBound: boolean;
}

export interface RadiativeBound {
  readonly lowerEarth: number;
  readonly upperEarth: number | null;
  readonly unresolvedSource: boolean;
  readonly includesCompanion: boolean;
}

/**
 * A deliberately conservative geometric range over two Keplerian orbits.
 * This is NOT a point-in-time flux, orbital phase or exact time average.
 * The emitting star's separation from the primary host ranges over
 * [relativePeriastronAu, relativeApoastronAu]; offsetBoundAu accounts for
 * unresolved inner-binary motion within a triple hierarchy.
 */
export function boundCompanionBolometricInsolationEarth(input: Readonly<{
  luminositySolar: number | null;
  relativePeriastronAu: number;
  relativeApoastronAu: number;
  planetaryApoastronAu: number;
  offsetBoundAu?: number;
}>): RadiativeBound {
  const {luminositySolar, relativePeriastronAu, relativeApoastronAu,
    planetaryApoastronAu, offsetBoundAu = 0} = input;
  for (const value of [relativePeriastronAu, relativeApoastronAu, planetaryApoastronAu, offsetBoundAu]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError('H2 companion geometry must be finite and non-negative.');
  }
  if (relativePeriastronAu <= 0 || relativeApoastronAu < relativePeriastronAu) {
    throw new RangeError('H2 requires an ordered positive companion orbit.');
  }
  if (luminositySolar === null) {
    return Object.freeze({lowerEarth: 0, upperEarth: null,
      unresolvedSource: true, includesCompanion: true});
  }
  if (!Number.isFinite(luminositySolar) || luminositySolar < 0) {
    throw new RangeError('H2 companion luminosity must be non-negative and finite.');
  }
  const farthest = relativeApoastronAu + planetaryApoastronAu + offsetBoundAu;
  const closest = relativePeriastronAu - planetaryApoastronAu - offsetBoundAu;
  return Object.freeze({
    lowerEarth: luminositySolar / (farthest * farthest),
    upperEarth: luminositySolar === 0 ? 0 : closest > 0
      ? luminositySolar / (closest * closest) : null,
    unresolvedSource: closest <= 0 && luminositySolar > 0,
    includesCompanion: true,
  });
}

/** Sum radiative envelopes without pretending an unknown upper bound is zero. */
export function sumRadiativeBounds(parts: readonly RadiativeBound[]): RadiativeBound {
  return Object.freeze({
    lowerEarth: parts.reduce((sum, part) => sum + part.lowerEarth, 0),
    upperEarth: parts.every(part => part.upperEarth !== null)
      ? parts.reduce((sum, part) => sum + (part.upperEarth ?? 0), 0)
      : null,
    unresolvedSource: parts.some(part => part.unresolvedSource),
    includesCompanion: parts.some(part => part.includesCompanion),
  });
}

export function projectWhiteDwarfConditionalThermalEnvelope(input: Readonly<{
  currentWhiteDwarfLuminositySolar: number;
  planetSemiMajorAxisAu: number;
  planetEccentricity: number;
  referenceBondAlbedo01: number;
  intrinsicHeatFluxWattsPerSquareMeter: number | null;
  companionRadiativeBound: RadiativeBound;
}>): WhiteDwarfConditionalThermalEnvelope | null {
  const {currentWhiteDwarfLuminositySolar: lum, planetSemiMajorAxisAu: axis,
    planetEccentricity: ecc, referenceBondAlbedo01: albedo,
    intrinsicHeatFluxWattsPerSquareMeter: intrinsic,
    companionRadiativeBound: companion} = input;
  if (![lum, axis, ecc, albedo].every(Number.isFinite) || lum <= 0 || axis <= 0 ||
      ecc < 0 || ecc >= 1 || albedo < 0 || albedo > 1 ||
      (intrinsic !== null && (!Number.isFinite(intrinsic) || intrinsic < 0))) return null;
  if (!Number.isFinite(companion.lowerEarth) || companion.lowerEarth < 0 ||
      (companion.upperEarth !== null &&
        (!Number.isFinite(companion.upperEarth) || companion.upperEarth < companion.lowerEarth))) return null;
  // Exact host angular phase is not known: derive strict geometric limits.
  const hostMin = lum / (axis * (1 + ecc)) ** 2;
  const hostMax = lum / (axis * (1 - ecc)) ** 2;
  const externalFluxLowerEarth = hostMin + companion.lowerEarth;
  const externalFluxUpperEarth = companion.upperEarth === null
    ? null : hostMax + companion.upperEarth;
  const referenceKelvin = (insolationEarth: number, heatWattsPerM2: number) =>
    ((1 - albedo) * H2_SOLAR_IRRADIANCE_WATTS_PER_SQUARE_METER * insolationEarth / 4 +
      heatWattsPerM2) ** 0.25 /
      H2_STEFAN_BOLTZMANN_WATTS_PER_M2_K4 ** 0.25;
  // If intrinsic heat is unknown, only the external-only MINIMUM is justified.
  // The upper total heat bound remains unknown, not silently zero.
  const equilibriumLowerKelvin = referenceKelvin(externalFluxLowerEarth, intrinsic ?? 0);
  const equilibriumUpperKelvin = externalFluxUpperEarth === null || intrinsic === null
    ? null : referenceKelvin(externalFluxUpperEarth, intrinsic);
  if (!Number.isFinite(equilibriumLowerKelvin) ||
      (equilibriumUpperKelvin !== null && !Number.isFinite(equilibriumUpperKelvin))) return null;
  return Object.freeze({
    externalFluxLowerEarth,
    externalFluxUpperEarth,
    internalHeatFluxWattsPerSquareMeter: intrinsic,
    equilibriumLowerKelvin,
    equilibriumUpperKelvin,
    albedoIsAssumed: true as const,
    hasUnresolvedRadiativeSource: companion.unresolvedSource,
    includesCompanionBound: companion.includesCompanion,
  });
}
