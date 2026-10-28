/** VIDA.5: deterministic, versioned post-biological atmosphere, based on the frozen physics. */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { AtmosphereGas, atmosphereGasMolarMassGramsPerMole } from '../../domain/planetary/atmosphere-gas';
import { atmospherePressureRegimeForSurfacePressurePascal } from '../../domain/planetary/atmosphere-pressure-regime';
import { VIDA5_ATMOSPHERE_REVISION, type Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import type { Vida4EcologySnapshot } from '../../domain/life/procedural-ecology-vida4';
import type { PlanetScientificResolvedTarget, PlanetScientificGasSource } from '../planetary/planet-scientific-target-resolver';

const clamp = (x: number, low: number, high: number) => Math.max(low, Math.min(high, x));
const digest = (s: string) => bytesToHex(sha256(utf8ToBytes(s)));
const valid = (x: number | null | undefined): x is number => x !== null && x !== undefined && Number.isFinite(x);
const gasMass = (gas: string): number => Object.values(AtmosphereGas).includes(gas as AtmosphereGas)
  ? atmosphereGasMolarMassGramsPerMole(gas as AtmosphereGas) : 28.97;
const gasFraction = (xs: readonly PlanetScientificGasSource[], gas: string) => xs.find(x => x.gas === gas)?.moleFraction01 ?? 0;
function normalize(xs: readonly PlanetScientificGasSource[]): readonly PlanetScientificGasSource[] | null {
  if (xs.some(x => !valid(x.moleFraction01) || x.moleFraction01 < 0 || x.moleFraction01 > 1)) return null;
  const sum = xs.reduce((n, x) => n + x.moleFraction01, 0);
  if (sum <= 0 || Math.abs(sum - 1) > 0.035) return null;
  return Object.freeze(xs.map(x => Object.freeze({gas: x.gas, moleFraction01: x.moleFraction01 / sum})));
}
const meanMass = (xs: readonly PlanetScientificGasSource[]) =>
  xs.reduce((m, x) => m + x.moleFraction01 * gasMass(x.gas), 0);

export class Vida5BiogenicAtmosphere {
  private constructor() {}

  static evaluate(ecology: Vida4EcologySnapshot, source: PlanetScientificResolvedTarget): Vida5AtmosphericFeedback {
    if (ecology.revision !== 'VIDA.4/ecology/v2-advanced-calibration' ||
        ecology.identity.kind !== 'PLANET' || ecology.identity.generatorVersionCode !== 3) {
      throw new Error('VIDA.5 requires a VIDA.4a V3 planetary ecological snapshot');
    }
    const a = source.detail.atmosphere;
    const c = source.detail.climate;
    const baseline = normalize(a.retainedGasComposition);
    const initialP = a.retainedSurfacePressurePascal;
    const oldO2 = baseline === null ? null : gasFraction(baseline, AtmosphereGas.OXYGEN);
    const advanced = ecology.groups.includes('REPTILES');
    const hasPlants = ecology.habitat === 'SURFACE_OPEN' && ecology.groups.includes('PLANTS_TREES');
    let status: Vida5AtmosphericFeedback['status'] = hasPlants ? 'UNRESOLVED_PHYSICAL_BUDGET' : 'NO_PHOTOSYNTHETIC_VEGETATION';
    let gases = baseline ?? Object.freeze([...a.retainedGasComposition]);
    let pressure = initialP;
    let deltaK = 0;
    let climateTemperature = c.meanSurfaceTemperatureKelvin;
    let mass = a.retainedMeanMolarMassGramsPerMole;
    let density = a.retainedReferenceDensityKilogramsPerCubicMeter;
    let trapping = a.longwaveTrappingFraction01;
    let pressureFactor: number | null = null;
    if (hasPlants && baseline && valid(initialP) && initialP > 0 &&
        !a.isVacuum && !a.isDeepEnvelope && valid(climateTemperature) &&
        c.meanSurfaceTemperatureKelvin !== null &&
        source.detail.surface.hasDefinedSolidSurfaceBase === true) {
      // A photosynthetic surface produces O2 while lowering atmospheric CO2.
      // Preserve relative proportions of other volatiles. No oxygen is added to
      // a non-photosynthetic or buried ecosystem.
      const spread = parseInt(digest(`${VIDA5_ATMOSPHERE_REVISION}|${ecology.digest}|O2`).slice(0, 8), 16) / 0x100000000;
      const requestedO2 = advanced ? 0.17 + 0.09 * spread : 0.12 + 0.16 * spread;
      const oldCO2 = gasFraction(baseline, AtmosphereGas.CARBON_DIOXIDE);
      const newCO2 = oldCO2 > 0 ? Math.min(oldCO2 * 0.35, 0.025) : 0;
      const other = baseline.filter(x => x.gas !== AtmosphereGas.OXYGEN && x.gas !== AtmosphereGas.CARBON_DIOXIDE);
      const otherTotal = other.reduce((v, x) => v + x.moleFraction01, 0);
      if (otherTotal > 1e-8) {
        const remainder = 1 - requestedO2 - newCO2;
        const updated: PlanetScientificGasSource[] = other.map(x => ({
          gas: x.gas, moleFraction01: x.moleFraction01 * remainder / otherTotal,
        }));
        updated.push({gas: AtmosphereGas.OXYGEN, moleFraction01: requestedO2});
        if (newCO2 > 0) updated.push({gas: AtmosphereGas.CARBON_DIOXIDE, moleFraction01: newCO2});
        gases = Object.freeze(updated.sort((x, y) => y.moleFraction01 - x.moleFraction01).map(x => Object.freeze(x)));
        const originalMass = meanMass(baseline);
        const nextMass = meanMass(gases);
        // First-order column closure: chemical replacement changes mean molar
        // mass, hence surface pressure for the same total gas-mole column.
        const columnPressure = initialP * nextMass / originalMass;
        // A bounded, long-term exchange with crust/ocean volatile reservoirs
        // can stabilize the O2 partial pressure. Reject unbounded corrections.
        const pMin = advanced ? 16_000 / requestedO2 : 11_000 / requestedO2;
        const pMax = 35_000 / requestedO2;
        const adjusted = clamp(columnPressure, pMin, pMax);
        const factor = adjusted / columnPressure;
        if (factor >= 0.45 && factor <= 2.1 && Number.isFinite(factor) &&
            Number.isFinite(nextMass) && requestedO2 >= (advanced ? 0.16 : 0.12) &&
            requestedO2 <= 0.28 && adjusted <= 250_000) {
          status = 'APPLIED';
          pressure = adjusted;
          pressureFactor = factor;
          mass = nextMass;
          density = adjusted * (nextMass / 1000) / (8.31446261815324 * 288.15);
          // A restrained CO2/water greenhouse adjustment, not a full new
          // radiative-convective simulation. The original climate is immutable.
          const forcing = clamp(3.5 * Math.log((newCO2 + 0.0008) / (oldCO2 + 0.0008)), -9, 2);
          deltaK = forcing;
          climateTemperature += deltaK;
          trapping = clamp(a.longwaveTrappingFraction01 + deltaK / 180, 0, 1);
          if (climateTemperature < 260 || climateTemperature > 335) {
            status = 'UNRESOLVED_PHYSICAL_BUDGET';
          }
        }
      }
    }
    if (status !== 'APPLIED') {
      gases = Object.freeze([...a.retainedGasComposition]);
      pressure = initialP;
      deltaK = 0;
      climateTemperature = c.meanSurfaceTemperatureKelvin;
      mass = a.retainedMeanMolarMassGramsPerMole;
      density = a.retainedReferenceDensityKilogramsPerCubicMeter;
      trapping = a.longwaveTrappingFraction01;
      pressureFactor = null;
    }
    // VIDA.4a describes ecological *potential*. VIDA.5 conditions the stable
    // expression of the higher groups on a closed atmosphere/climate. Never
    // claim a forest/aerobic fauna or civilization for a thin-air world.
    const effectiveGroups = Object.freeze(status === 'UNRESOLVED_PHYSICAL_BUDGET' && hasPlants
      ? ecology.groups.slice(0, 2) : [...ecology.groups]);
    const stablePhotosyntheticVegetation = hasPlants && status === 'APPLIED';
    const advancedAerobicFaunaSupported = advanced && status === 'APPLIED';
    const nativeCivilizationAtmosphereReady = ecology.nativeCivilizationEcosystemReady &&
      advancedAerobicFaunaSupported;
    const o2 = status === 'APPLIED' ? gasFraction(gases, AtmosphereGas.OXYGEN) : oldO2;
    const o2Pressure = valid(pressure) && o2 !== null ? pressure * o2 : null;
    const fingerprint = digest([VIDA5_ATMOSPHERE_REVISION, ecology.digest,
      String(initialP), JSON.stringify(a.retainedGasComposition), String(c.meanSurfaceTemperatureKelvin),
      status, String(pressure), JSON.stringify(gases), String(deltaK), ...effectiveGroups].join('|'));
    return Object.freeze({revision: VIDA5_ATMOSPHERE_REVISION, status, ecologyDigest: ecology.digest,
      sourcePressurePascal: initialP, pressurePascal: pressure, sourceOxygenFraction01: oldO2,
      oxygenFraction01: o2, oxygenPartialPressurePascal: o2Pressure, aerobicAdvanced: advanced,
      effectiveGroups, stablePhotosyntheticVegetation, advancedAerobicFaunaSupported, nativeCivilizationAtmosphereReady,
      gasComposition: gases, meanMolarMassGramsPerMole: mass,
      referenceDensityKilogramsPerCubicMeter: density,
      greenhouseTrappingFraction01: trapping, climateDeltaKelvin: deltaK,
      meanSurfaceTemperatureKelvin: climateTemperature, pressureBalanceFactor: pressureFactor,
      digest: fingerprint});
  }

  /** Future VIDA.7 must check this in addition to the eight ecological groups. */
  static assertNativeCivilizationAtmosphereReady(ecology: Vida4EcologySnapshot,
    feedback: Vida5AtmosphericFeedback): void {
    if (!ecology.nativeCivilizationEcosystemReady || !feedback.nativeCivilizationAtmosphereReady ||
        feedback.status !== 'APPLIED' || (feedback.oxygenFraction01 ?? 0) < 0.16 ||
        (feedback.oxygenPartialPressurePascal ?? 0) < 16_000) {
      throw new Error('VIDA.5 requires a stable oxygenated atmosphere for native civilizations');
    }
  }

  /** A local derived *effective* detail, leaving PRE-33 physical source untouched. */
  static applyToTarget(target: PlanetScientificResolvedTarget,
    feedback: Vida5AtmosphericFeedback): PlanetScientificResolvedTarget {
    if (feedback.status !== 'APPLIED') return target;
    const a = target.detail.atmosphere;
    const c = target.detail.climate;
    const shift = (value: number | null) => value === null ? null : value + feedback.climateDeltaKelvin;
    return Object.freeze({...target, detail: Object.freeze({...target.detail,
      atmosphere: Object.freeze({...a,
        retainedGasComposition: feedback.gasComposition,
        retainedSurfacePressurePascal: feedback.pressurePascal,
        retainedPressureRegime: atmospherePressureRegimeForSurfacePressurePascal(feedback.pressurePascal!),
        retainedMeanMolarMassGramsPerMole: feedback.meanMolarMassGramsPerMole,
        retainedReferenceDensityKilogramsPerCubicMeter: feedback.referenceDensityKilogramsPerCubicMeter!,
        longwaveTrappingFraction01: feedback.greenhouseTrappingFraction01!,
      }),
      climate: Object.freeze({...c,
        meanSurfaceTemperatureKelvin: feedback.meanSurfaceTemperatureKelvin,
        greenhouseSurfaceWarmingKelvin: c.greenhouseSurfaceWarmingKelvin === null ? null
          : Math.max(0, c.greenhouseSurfaceWarmingKelvin + feedback.climateDeltaKelvin),
        minimumSurfaceTemperatureKelvin: shift(c.minimumSurfaceTemperatureKelvin),
        maximumSurfaceTemperatureKelvin: shift(c.maximumSurfaceTemperatureKelvin),
      }),
    })});
  }
}
