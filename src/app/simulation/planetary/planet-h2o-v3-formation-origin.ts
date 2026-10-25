import type { PlanetarySystem } from '../../domain/planetary/planetary-system';
import type { Planet } from '../../domain/planetary/planet';
import type { ProtoplanetaryDiskProfile } from '../../domain/planetary/protoplanetary-disk-profile';
import type { PlanetFormationProfile } from '../../domain/planetary/planet-formation-profile';
import { PlanetH2OV3CT0Evolution } from './planet-h2o-v3-ct0-evolution';
import type { Atmosphere } from '../../domain/planetary/atmosphere';
import type { H2OForwardEnvironment } from '../../domain/planetary/planet-h2o-forward-ct0-pre33-03a3';

const EARTH_MASS_KG = 5.9722e24;
const SOLAR_O_PER_H = 4.90e-4;
const SOLAR_SI_PER_H = 3.24e-5;
const SOLAR_C_TO_O = 2.69 / 4.90;
const SOLAR_METAL_MASS_FRACTION = 0.0134;
const clamp01 = (x:number) => Math.max(0, Math.min(1, x));

export const V3_H2O_ORIGIN_CONTRACT = 'PRE-33.03a.3/V3-DISK-FORMATION-ORIGIN/v1' as const;

/** V3-origin water sources are produced from 17.2/17.7 and 18.2, BEFORE 19.5.
 * Their budgets are independent of the later 19.5 material buckets. A solar
 * elemental abundance pattern is still a MODEL PRIOR, not measured disk chemistry. */
export interface V3DiskWaterOrigin {
  readonly contract: typeof V3_H2O_ORIGIN_CONTRACT;
  readonly sourceId: string;
  readonly bodyIndex: bigint;
  readonly sourceFormationOrdinals: readonly number[];
  readonly formationWaterKilograms: number;
  readonly assemblyTemperatureKelvin: number;
  readonly initialDiskDustKilograms: number;
  readonly diskWaterBudgetKilograms: number;
  readonly carbonOxygenRatio: number;
  readonly metallicitySolarRatio: number;
  readonly sourceDiskTemperatureAt1AuKelvin: number;
  readonly chemicalProvenance: '17_2_DISK_AND_SECTOR_METALLICITY_WITH_SOLAR_ELEMENT_PATTERN_PRIOR';
  readonly stellarAgeYearsCT0: number | null;
  readonly timeSinceFormationYears: number | null;
  readonly sourceStellarMassSolar: number | null;
  readonly sourceBolometricLuminositySolar: number | null;
  readonly lateDeliveryWaterBudgetKilograms: number;
  readonly diskSolidMassShare01: number;
  readonly datedHistoryComplete: boolean;
  readonly certifiedCT0: false;
}

/** Frozen from the real V3 stellar/coeval generation boundary, not from the wall clock. */
export interface V3WaterStellarConditions {
  readonly ageBillionYearsCT0: number;
  readonly stellarMassSolar: number;
  readonly bolometricLuminositySolar: number;
  /** Age when formation completes, from the generated Phase-17 maturation. */
  readonly formationCompletionAgeMillionYears: number;
  readonly fluxGeometry: 'CIRCUMSTELLAR' | 'CIRCUMBINARY';
}
type PlanetRecord = ReadonlyMap<bigint, V3DiskWaterOrigin>;
const origins = new WeakMap<PlanetarySystem, PlanetRecord>();

export class PlanetH2OV3FormationOrigin {
  private constructor() {}

  /** Must run at the Phase-18 handoff, before materializing Phase-19 planets.
   * Returns immutable per-body records and imposes a shared DISK-wide H2O cap.
   * This adds no PRNG draws and alters no legacy planetary masses/identities. */
  static registerAtFormation(
    system: PlanetarySystem,
    disk: ProtoplanetaryDiskProfile,
    formationProfile: PlanetFormationProfile,
    stellarConditions?: V3WaterStellarConditions,
  ): readonly V3DiskWaterOrigin[] {
    if (origins.has(system)) throw new RangeError('V3_H2O_ORIGIN_DUPLICATE_REGISTRATION');
    const blue = system.formationBlueprint;
    const Z = formationProfile.metallicitySolarRatio;
    const T1 = disk.referenceTemperatureAt1AuKelvin;
    if (!(Z > 0 && Number.isFinite(Z) && T1 > 0 && Number.isFinite(T1))) {
      throw new RangeError('V3_H2O_ORIGIN_INVALID_DISK');
    }
    const oxygen = SOLAR_O_PER_H * Z;
    const carbon = oxygen * SOLAR_C_TO_O;
    const boundToSilicates = 3 * SOLAR_SI_PER_H * Z;
    const freeOxygen = Math.max(0, oxygen - carbon - boundToSilicates);
    // Solar-pattern prior, explicitly distinguishable from a chemical disk measurement.
    const waterShareInCondensableSolids = clamp01(18 * freeOxygen /
      (SOLAR_METAL_MASS_FRACTION * Z));
    const initialDiskDustKilograms = blue.sourceDustMassEarth * EARTH_MASS_KG;
    const diskWaterBudgetKilograms = initialDiskDustKilograms * waterShareInCondensableSolids;
    const perBody = system.planetSlots.map(slot => {
      const anchors = slot.sourceAnchorOrdinals.map(ordinal => blue.formationAnchors[ordinal - 1]);
      if (anchors.some(a => !a) || !anchors.length) throw new RangeError('V3_H2O_ORIGIN_FOREIGN_ANCHOR');
      // Each anchor is a Stage-17 condensed reservoir. Mixed/migrated worlds
      // retain their actual source anchor radii and frozen 17.7 solid masses.
      const mass = anchors.reduce((s,a) => s + a!.solidCoreMassEarth, 0);
      const rawWaterEarth = anchors.reduce((s,a) => {
        const t = T1 / Math.sqrt(a!.assemblyRadiusAu);
        const condensation = clamp01((190 - t) / 40);
        const carrierCap = a!.compositionMixture.iceBearingFraction01;
        return s + a!.solidCoreMassEarth * Math.min(condensation * waterShareInCondensableSolids, carrierCap);
      }, 0);
      const weightedTemperature = anchors.reduce((s,a) => s + a!.solidCoreMassEarth *
        T1 / Math.sqrt(a!.assemblyRadiusAu), 0) / mass;
      if (!Number.isFinite(weightedTemperature) || !(mass > 0))
        throw new RangeError('V3_H2O_ORIGIN_INVALID_ANCHORS');
      return {slot, raw:rawWaterEarth * EARTH_MASS_KG, t:weightedTemperature};
    });
    const proposed = perBody.reduce((s,x) => s + x.raw, 0);
    const anchorTotalMass = perBody.reduce((s,x) => s +
      x.slot.sourceAnchorOrdinals.reduce((a,ordinal)=> a +
        blue.formationAnchors[ordinal-1]!.solidCoreMassEarth,0),0);
    if (perBody.length>0 && !(anchorTotalMass > 0)) throw new RangeError('V3_H2O_ZERO_PLANET_MASS');
    if (stellarConditions && (!Number.isFinite(stellarConditions.ageBillionYearsCT0) ||
      stellarConditions.ageBillionYearsCT0 <= 0 ||
      !Number.isFinite(stellarConditions.stellarMassSolar) || stellarConditions.stellarMassSolar <= 0 ||
      !Number.isFinite(stellarConditions.bolometricLuminositySolar) ||
      stellarConditions.bolometricLuminositySolar <= 0 ||
      !Number.isFinite(stellarConditions.formationCompletionAgeMillionYears) ||
      stellarConditions.formationCompletionAgeMillionYears < 0))
      throw new RangeError('V3_H2O_INVALID_STELLAR_CHRONOLOGY');
    const scale = proposed > 0 ? Math.min(1, diskWaterBudgetKilograms / proposed) : 1;
    const id = system.generationKey.universeSeed.normalizedValue;
    const l = system.hostStellarSystem.locator;
    const root = `${V3_H2O_ORIGIN_CONTRACT}/${id}/G${l.galaxyIndex}/S${l.sectorKey}/O${l.galacticObjectIndex}`;
    const records = Object.freeze(perBody.map(({slot,raw,t}) => Object.freeze({
      contract:V3_H2O_ORIGIN_CONTRACT,
      sourceId:`${root}/B${slot.bodyLocator.bodyIndex}`,
      bodyIndex:slot.bodyLocator.bodyIndex,
      sourceFormationOrdinals:Object.freeze([...slot.sourceFormationOrdinals]),
      formationWaterKilograms:raw * scale,
      assemblyTemperatureKelvin:t,
      initialDiskDustKilograms,
      diskWaterBudgetKilograms,
      carbonOxygenRatio:SOLAR_C_TO_O,
      metallicitySolarRatio:Z,
      sourceDiskTemperatureAt1AuKelvin:T1,
      chemicalProvenance:'17_2_DISK_AND_SECTOR_METALLICITY_WITH_SOLAR_ELEMENT_PATTERN_PRIOR' as const,
      stellarAgeYearsCT0:stellarConditions ? Math.round(stellarConditions.ageBillionYearsCT0*1e9) : null,
      timeSinceFormationYears:stellarConditions ? Math.max(0,Math.round(
        stellarConditions.ageBillionYearsCT0*1e9 -
        stellarConditions.formationCompletionAgeMillionYears*1e6)) : null,
      sourceStellarMassSolar:stellarConditions?.stellarMassSolar ?? null,
      sourceBolometricLuminositySolar:stellarConditions?.bolometricLuminositySolar ?? null,
      // Late delivery comes from the REMAINING shared disk inventory, not an
      // invented per-planet reservoir. It is an upper budget, not an impact.
      lateDeliveryWaterBudgetKilograms:Math.min(
        Math.max(0,diskWaterBudgetKilograms-proposed*scale)*
          (slot.sourceAnchorOrdinals.reduce((a,ordinal)=>a+
           blue.formationAnchors[ordinal-1]!.solidCoreMassEarth,0)/Math.max(1e-30,anchorTotalMass)),
        raw*scale*0.03),
      diskSolidMassShare01:slot.sourceAnchorOrdinals.reduce((a,ordinal)=>a+
        blue.formationAnchors[ordinal-1]!.solidCoreMassEarth,0)/Math.max(1e-30,anchorTotalMass),
      datedHistoryComplete:stellarConditions!==undefined &&
        stellarConditions.ageBillionYearsCT0*1e9 >
          stellarConditions.formationCompletionAgeMillionYears*1e6,
      certifiedCT0:false as const,
    })));
    if (records.reduce((s,r)=>s+r.formationWaterKilograms,0) >
      diskWaterBudgetKilograms * (1 + 1e-10)) throw new RangeError('V3_H2O_ORIGIN_DISK_BUDGET_VIOLATION');
    origins.set(system, new Map(records.map(r => [r.bodyIndex, r])));
    return records;
  }

  static sourceForPlanet(planet: Planet): V3DiskWaterOrigin | null {
    const source = origins.get(planet.hostPlanetarySystem)?.get(planet.locator.bodyIndex) ?? null;
    if (source && (source.bodyIndex !== planet.locator.bodyIndex ||
      source.sourceFormationOrdinals.join(',') !== planet.architectureSlot.sourceFormationOrdinals.join(','))) {
      throw new RangeError('V3_H2O_ORIGIN_BODY_IDENTITY_MISMATCH');
    }
    return source;
  }

  static environmentForPlanet(planet:Planet, atmosphere?:Atmosphere): H2OForwardEnvironment | null {
    const origin = this.sourceForPlanet(planet);
    if (!origin) return null;
    if(atmosphere) return PlanetH2OV3CT0Evolution.fromOrigin(planet,atmosphere,origin);
    return Object.freeze({
      sourceId:origin.sourceId,
      metallicitySolarRatio:origin.metallicitySolarRatio,
      carbonOxygenRatio:origin.carbonOxygenRatio,
      formationWaterKilogramsFromDisk:origin.formationWaterKilograms,
      diskFormationTemperatureKelvin:origin.assemblyTemperatureKelvin,
      originChemistryContract:V3_H2O_ORIGIN_CONTRACT,
    });
  }
}
