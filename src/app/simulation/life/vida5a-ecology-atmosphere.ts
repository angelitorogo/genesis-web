/** VIDA.5a — physical-atmosphere-informed ecological succession, with no galactic quotas. */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA4_GROUPS, VIDA4_ROLL_NAMESPACE,
  type Vida4EcologySnapshot } from '../../domain/life/procedural-ecology-vida4';
import { VIDA5A_COUPLING_REVISION, VIDA5A_COMPLEX_RATE_ATMOSPHERE_READY,
  VIDA5A_COMPLEX_RATE_ATMOSPHERE_UNRESOLVED, VIDA5A_SURFACE_LEVEL_THRESHOLDS,
  type Vida5aCoupledBiosphere, type Vida5aCouplingStatus,
} from '../../domain/life/vida5a-ecology-atmosphere';
import type { PlanetScientificResolvedTarget, PlanetScientificGasSource } from '../planetary/planet-scientific-target-resolver';
import type { Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { atmosphereGasMolarMassGramsPerMole, AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { Vida5BiogenicAtmosphere } from './vida5-biogenic-atmosphere';

const hash = (value: string) => bytesToHex(sha256(utf8ToBytes(value)));
const roll = (value: string): number => {
  const h = sha256(utf8ToBytes(value));
  return (h[0] * 0x1000000 + h[1] * 0x10000 + h[2] * 0x100 + h[3]) / 0x100000000;
};

export class Vida5aEcologyAtmosphere {
  private constructor() {}

  /** Original VIDA.4a is immutable and persisted separately in IndexedDB V9.
   * The effective VIDA.5a scenario is derived, deterministic and recalculable.
   * No life is generated where VIDA.3b found none; no second microbial roll. */
  static evaluate(ecology: Vida4EcologySnapshot,
    source: PlanetScientificResolvedTarget): Vida5aCoupledBiosphere {
    if (ecology.revision !== 'VIDA.4/ecology/v2-advanced-calibration' ||
        ecology.identity.kind !== 'PLANET' || ecology.identity.generatorVersionCode !== 3) {
      throw Error('VIDA.5a requires VIDA.4a / planet / V3');
    }
    const key = [VIDA4_ROLL_NAMESPACE, ecology.identity.universeSeed,
      String(ecology.identity.generatorVersionCode), ecology.bodyStorageKey].join('|');
    const surface = ecology.lifePresent && ecology.habitat === 'SURFACE_OPEN';
    const exploratory = surface ? this.project(ecology, 3) : ecology;
    const viability = Vida5BiogenicAtmosphere.evaluate(exploratory, source);
    const atmosphereReady = surface && this.stabilizeReactiveGases(viability, source) !== null;
    // One original, per-body deterministic complex-life roll, now *conditioned*
    // by the ability to sustain an oxygenic surface biosphere. No population
    // count, galaxy index quota or regenerated planet enters this decision.
    const conditionalProbability = !surface ? 0
      : atmosphereReady ? VIDA5A_COMPLEX_RATE_ATMOSPHERE_READY
        : VIDA5A_COMPLEX_RATE_ATMOSPHERE_UNRESOLVED;
    const selected = surface && roll(`${key}|COMPLEX_LIFE`) < conditionalProbability;
    let feedback = Vida5BiogenicAtmosphere.evaluate(ecology, source);
    let level = ecology.groups.length;
    let burialFraction = 0;
    let status: Vida5aCouplingStatus = 'NOT_SURFACE_BIOSPHERE';
    if (surface) {
      level = selected ? 2 : 1;
      status = !selected ? 'NO_COMPLEX_EVOLUTION' : 'ATMOSPHERE_LIMITED';
      if (selected && atmosphereReady) {
        const evolution = roll(`${key}|EVOLUTION_LEVEL`);
        const proposed = Math.min(8, 2 + VIDA5A_SURFACE_LEVEL_THRESHOLDS
          .filter(t => evolution >= t).length);
        // Reconcile oxygen fraction *and* partial pressure after deciding the
        // ecological level. If aerobic closure fails, try a less demanding
        // level instead of inventing air, pressure, heat or an O2 reservoir.
        for (let candidate = proposed; candidate >= 3; candidate--) {
          const projected = this.project(ecology, candidate);
          const trial = this.stabilizeReactiveGases(
            Vida5BiogenicAtmosphere.evaluate(projected, source), source);
          if (trial && (candidate < 5 || ((trial.feedback.oxygenFraction01 ?? 0) >= 0.16 &&
                (trial.feedback.oxygenPartialPressurePascal ?? 0) >= 16_000))) {
            level = candidate;
            feedback = trial.feedback;
            burialFraction = trial.burialFraction;
            status = candidate >= 5 ? 'STABLE_ADVANCED_BIOSPHERE' : 'STABLE_BIOSPHERE';
            break;
          }
        }
      }
      if (level < 3) feedback = Vida5BiogenicAtmosphere.evaluate(this.project(ecology, level), source);
    }
    const groups = Object.freeze(surface ? [...VIDA4_GROUPS.slice(0, level)] : [...feedback.effectiveGroups]);
    // The legacy potential ecological levels are never treated as *actual*
    // when a later atmospheric closure rejects them.
    const nativeReady = groups.length === VIDA4_GROUPS.length &&
      feedback.status === 'APPLIED' && feedback.nativeCivilizationAtmosphereReady &&
      (feedback.oxygenFraction01 ?? 0) >= 0.16 &&
      (feedback.oxygenPartialPressurePascal ?? 0) >= 16_000;
    return Object.freeze({revision: VIDA5A_COUPLING_REVISION,
      originalEcologyDigest: ecology.digest, originalEcologyGroups: ecology.groups,
      photosyntheticAtmospherePlausible: atmosphereReady,
      calibratedComplexSelected: selected, reactiveGasBurialFraction01: burialFraction,
      conditionalComplexProbability: conditionalProbability,
      effectiveGroups: groups, nativeCivilizationPrerequisitesReady: nativeReady,
      status, atmosphericFeedback: feedback,
      digest: hash([VIDA5A_COUPLING_REVISION, ecology.digest, status,
        selected ? '1' : '0', atmosphereReady ? '1' : '0', String(burialFraction),
        feedback.digest, ...groups].join('|'))});
  }

  /** VIDA.5c: preflight complete ecological atmosphere, without awarding life or
   * altering the original physical target. Keep VIDA.5a's strict gas sink,
   * column mass, climate and reactive-load checks as the single source of truth. */
  static assessAdvancedPhysicalEligibility(ecology: Vida4EcologySnapshot,
    source: PlanetScientificResolvedTarget): Vida5AtmosphericFeedback | null {
    const scenario = Object.freeze({...ecology,
      groups: VIDA4_GROUPS, nativeCivilizationEcosystemReady: true,
      digest: `FULL-ECO-PROBE|${ecology.digest}`});
    const raw = Vida5BiogenicAtmosphere.evaluate(scenario, source);
    const closed = this.stabilizeReactiveGases(raw, source)?.feedback ?? null;
    if (!closed || (closed.oxygenFraction01 ?? 0) < 0.16 ||
        (closed.oxygenFraction01 ?? 1) > 0.28 ||
        (closed.oxygenPartialPressurePascal ?? 0) < 16000 ||
        (closed.oxygenPartialPressurePascal ?? Number.POSITIVE_INFINITY) > 35000 ||
        (closed.meanSurfaceTemperatureKelvin ?? 0) < 260 ||
        (closed.meanSurfaceTemperatureKelvin ?? Number.POSITIVE_INFINITY) > 335) return null;
    return closed;
  }

  static assertNativeCivilizationReady(snapshot: Vida5aCoupledBiosphere): void {
    if (!snapshot.nativeCivilizationPrerequisitesReady ||
        snapshot.effectiveGroups.length !== VIDA4_GROUPS.length ||
        VIDA4_GROUPS.some((group, index) => group !== snapshot.effectiveGroups[index])) {
      throw Error('VIDA.5a native civilizations require eight stabilized groups and aerobic atmosphere');
    }
  }

  /** Sulfur/CO/ammonia removal by long-term oxidation and geological burial.
   * This is a small, explicitly bounded atmospheric reservoir scenario, not a
   * claim that any arbitrary atmosphere can be transformed into breathable air.
   * Reactive loads >9% of total gas are rejected, never silently scrubbed.
   * The remaining column mass is reduced; N2 and O2 are not fabricated.
   */
  private static stabilizeReactiveGases(feedback: Vida5AtmosphericFeedback,
    source: PlanetScientificResolvedTarget):
    {feedback: Vida5AtmosphericFeedback; burialFraction: number} | null {
    if (feedback.status !== 'APPLIED' || feedback.pressurePascal === null ||
        feedback.meanMolarMassGramsPerMole === null) return null;
    const reactive = new Set<string>([AtmosphereGas.SULFUR_DIOXIDE,
      AtmosphereGas.CARBON_MONOXIDE, AtmosphereGas.AMMONIA]);
    const xs = feedback.gasComposition;
    const initialLoad = xs.reduce((sum, x) => sum + (reactive.has(x.gas) ? x.moleFraction01 : 0), 0);
    if (initialLoad > 0.09) return null;
    // Stable biospheres sequester much of the residual reactive gases and
    // carbonate-fix any CO2 exceeding 1% of the initial mole column.
    const remaining = xs.map(x => ({gas:x.gas, moleFraction01: reactive.has(x.gas)
      ? x.moleFraction01 * 0.001 : x.gas === AtmosphereGas.CARBON_DIOXIDE
        ? Math.min(x.moleFraction01, 0.01) : x.moleFraction01}));
    let remainingMoles = remaining.reduce((a, b) => a + b.moleFraction01, 0);
    // A small surplus after CO/SO2 burial can be fixed by crustal oxidation.
    // Removing O2 (not adding N2) keeps the target composition <=28%.
    const oxygenInventory = remaining.find(x => x.gas === AtmosphereGas.OXYGEN);
    if (oxygenInventory && oxygenInventory.moleFraction01 / remainingMoles > 0.28) {
      const uptake = Math.max(0, (oxygenInventory.moleFraction01 - 0.275 * remainingMoles) / 0.725);
      if (uptake > 0.035) return null; // hard geochemical sink budget
      oxygenInventory.moleFraction01 -= uptake;
      remainingMoles -= uptake;
    }
    if (!Number.isFinite(remainingMoles) || remainingMoles < 0.86) return null;
    const buried = Math.max(0, 1 - remainingMoles);
    const gases: readonly PlanetScientificGasSource[] = Object.freeze(remaining
      .filter(x => x.moleFraction01 > 0)
      .map(x => Object.freeze({gas:x.gas,moleFraction01:x.moleFraction01 / remainingMoles}))
      .sort((a,b)=>b.moleFraction01-a.moleFraction01));
    const meanMass = gases.reduce((sum, x) => sum + x.moleFraction01 *
      atmosphereGasMolarMassGramsPerMole(x.gas as AtmosphereGas), 0);
    // Fixed gravity/area: the column loses the mass actually buried.
    const pressure = feedback.pressurePascal * remainingMoles * meanMass /
      feedback.meanMolarMassGramsPerMole;
    const o2 = gases.find(x => x.gas === AtmosphereGas.OXYGEN)?.moleFraction01 ?? 0;
    const o2Partial = pressure * o2;
    if (!Number.isFinite(pressure) || pressure <= 0 || o2 < 0.12 || o2 > 0.28 ||
        o2Partial < 8_000 || o2Partial > 35_000) return null;
    if (feedback.aerobicAdvanced && (o2 < 0.16 || o2Partial < 16_000)) return null;
    // CO2 burial reduces greenhouse forcing slightly further. Keep the
    // inherited radiative-equilibrium floor and the 260 K liquid-water
    // stability floor; this is not a coupled radiative transfer model.
    const initialCO2 = xs.find(x => x.gas === AtmosphereGas.CARBON_DIOXIDE)?.moleFraction01 ?? 0;
    const finalCO2 = gases.find(x => x.gas === AtmosphereGas.CARBON_DIOXIDE)?.moleFraction01 ?? 0;
    const rawExtraCooling = Math.max(-5, Math.min(0,
      3.5 * Math.log((finalCO2 + 0.0008) / (initialCO2 + 0.0008))));
    const currentTemperature = feedback.meanSurfaceTemperatureKelvin;
    if (currentTemperature === null || !Number.isFinite(currentTemperature)) return null;
    const floor = Math.max(260, source.detail.climate.equilibriumTemperatureKelvin ?? 260);
    const extraCooling = Math.max(rawExtraCooling, floor - currentTemperature);
    if (currentTemperature + extraCooling > 335 || currentTemperature + extraCooling < 260) return null;
    const next: Vida5AtmosphericFeedback = Object.freeze({...feedback,
      gasComposition:gases, pressurePascal:pressure, oxygenFraction01:o2,
      oxygenPartialPressurePascal:o2Partial,
      meanMolarMassGramsPerMole:meanMass,
      referenceDensityKilogramsPerCubicMeter: pressure * (meanMass / 1000) /
        (8.31446261815324 * 288.15),
      climateDeltaKelvin:feedback.climateDeltaKelvin + extraCooling,
      meanSurfaceTemperatureKelvin:currentTemperature + extraCooling,
      greenhouseTrappingFraction01:Math.max(0, Math.min(1,
        (feedback.greenhouseTrappingFraction01 ?? 0) + extraCooling / 180)),
      nativeCivilizationAtmosphereReady:feedback.nativeCivilizationAtmosphereReady &&
        o2 >= 0.16 && o2Partial >= 16000,
      digest:hash([VIDA5A_COUPLING_REVISION,'GEOCHEMICAL_BURIAL',feedback.digest,
        pressure.toPrecision(15),buried.toPrecision(15),String(extraCooling),
        JSON.stringify(gases)].join('|'))});
    return {feedback:next,burialFraction:buried};
  }

  private static project(original: Vida4EcologySnapshot, level: number): Vida4EcologySnapshot {
    const groups = Object.freeze([...VIDA4_GROUPS.slice(0, level)]);
    return Object.freeze({...original, groups, maximumGroup: groups.at(-1) ?? null,
      complexRollSelected: level >= 2, complexLifePresent: level >= 2,
      atmosphericFeedbackPending: level >= 3,
      nativeCivilizationEcosystemReady: level === VIDA4_GROUPS.length,
      // Versioned result identity prevents mixing with persisted V4a snapshots.
      digest: hash(`${VIDA5A_COUPLING_REVISION}|${original.digest}|level:${level}`)});
  }
}
