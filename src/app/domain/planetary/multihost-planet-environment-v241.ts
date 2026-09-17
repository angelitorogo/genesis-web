/** V2.4.1 estimated planetary environment contract. Domain types cannot import
 * implementations in simulation. This contract is shared by the generator and
 * scientific planet model, and does not claim measured climate or oceans. */
export interface MultihostPlanetEnvironmentV241 {
  readonly source: 'V2_4_1_ESTIMATED_ENVIRONMENT';
  readonly referenceOnly: true;
  readonly referenceMeanInsolationEarth: number | null;
  readonly equilibriumTemperatureKelvin: number | null;
  readonly atmosphere: Readonly<{
    regime: 'DEEP_ENVELOPE' | 'VACUUM' | 'THIN' | 'RETAINED' | 'UNKNOWN';
    pressurePascal: number | null;
    infraredOpticalDepthProxy: number | null;
    greenhouseAmplificationFactor: number | null;
    vaporMoleFraction01: number | null;
  }>;
  readonly climate: Readonly<{
    meanSurfaceTemperatureKelvin: number | null;
    stabilityIndex01: null;
    companionIrradianceIncluded: false;
  }>;
  readonly water: Readonly<{
    inventoryIndex01: number;
    surfaceLiquidWaterCoverageFraction01: number | null;
    surfaceIceCoverageFraction01: number | null;
    vaporFraction01: number | null;
    regime: 'DEEP_ENVELOPE' | 'UNKNOWN' | 'DRY' | 'ICE' | 'LIQUID_CANDIDATE' | 'VAPOR';
  }>;
}
