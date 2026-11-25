/** 38.6 · Reconstructed physical infrastructure. Never an observed location.
 * The ONLY input is a CT-0 record supplied by an already CONFIRMED system card,
 * or by a confirmed-system repository reader. Do not use this on private data
 * before checking that external discovery permission.
 */
import {
  VIDA9_REVISION, vida9DigestForRecord, type Vida9BiologyRecord,
} from '../../domain/life/vida9-biology-exploration';
import { VIDA6_REVISION } from '../../domain/life/vida6-ecosystems-species';
import { VIDA7_REVISION, type Vida7Settlement, type Vida7CivilizationTier, type Vida7CivilizableLineage } from '../../domain/life/vida7-intelligence-civilizations';
import {
  VIDA8_REVISION, type Vida8ColonialSettlement, type Vida8HabitatTechnology,
} from '../../domain/life/vida8-technological-colonization';

export const VIDA38_INFRASTRUCTURE_REVISION_386 = 'VIDA.38.6/physical-infrastructure/v1' as const;

export interface Vida38InfrastructurePlan386 {
  readonly revision: typeof VIDA38_INFRASTRUCTURE_REVISION_386;
  readonly id: string;
  readonly provenance: 'VIDA7_NATIVE_SETTLEMENT' | 'VIDA8_COLONIAL_SETTLEMENT';
  readonly bodyStorageKey: string;
  readonly seedUint32: number;
  /** Visual reconstruction, not a scientifically resolved coordinate. */
  readonly locationStatus: 'RECONSTRUCTED_NOT_OBSERVED';
  readonly latitudeRadians: number;
  readonly longitudeRadians: number;
  readonly form: Vida7Settlement['builtForm'] | 'COLONIAL_HABITAT';
  readonly scale: Vida7Settlement['scale'] | Vida8ColonialSettlement['populationBand'];
  readonly tier: Vida7CivilizationTier | 'COLONIAL';
  readonly lineage: Vida7CivilizableLineage;
  readonly habitat: string;
  readonly purpose: string;
  readonly habitatTechnology: Vida8HabitatTechnology | null;
  /** COLVIS.1 visual-only provenance copied from VERIFIED VIDA.8, never persisted. */
  readonly colonyArchitectureCOLVIS1?: Readonly<{
    founderTier: 'ADVANCED' | 'VERY_ADVANCED';
    destinationKind: 'PLANET' | 'MOON';
    populationRange: readonly [number, number];
    function: 'RESEARCH' | 'EXTRACTION' | 'HABITATION' | 'BIOSPHERE_CONSERVATION';
    founderSpeciesId: string;
    founderSourceBodyStorageKey: string;
  }>;
}

function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) h = Math.imul(h ^ value.charCodeAt(i), 16777619) >>> 0;
  return h >>> 0;
}
function u01(seed: number, salt: number): number {
  let h = (seed ^ salt) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 0x100000000;
}

export function vida38InfrastructureAnchor386(seed: number): Readonly<{latitudeRadians: number; longitudeRadians: number}> {
  // Exclude near poles for visual clarity. No geographical claim is made.
  return Object.freeze({
    latitudeRadians: Math.asin(-0.84 + u01(seed, 0x3761) * 1.68),
    longitudeRadians: (u01(seed, 0x3762) * 2 - 1) * Math.PI,
  });
}

function matchesIdentity(record: Vida9BiologyRecord): boolean {
  const id = record.identity;
  if (!id || id.generatorVersionCode !== 3 || !id.universeSeed ||
      (id.kind !== 'PLANET' && id.kind !== 'MOON')) return false;
  const expected = [id.galaxyIndex, id.sectorKey, id.galacticObjectIndex,
    id.bodyIndex, id.kind, id.moonIndex ?? '-'].join(':');
  if (record.bodyStorageKey !== expected) return false;
  const {ecosystem: e, intelligence: i, colonization: c} = record;
  const same = (identity: typeof id, storageKey: string) => !!identity &&
    identity.universeSeed === id.universeSeed &&
    identity.generatorVersionCode === id.generatorVersionCode &&
    identity.galaxyIndex === id.galaxyIndex && identity.sectorKey === id.sectorKey &&
    identity.galacticObjectIndex === id.galacticObjectIndex &&
    identity.bodyIndex === id.bodyIndex && identity.kind === id.kind &&
    identity.moonIndex === id.moonIndex && storageKey === expected;
  return !!e && !!i && !!c && e.revision === VIDA6_REVISION &&
    i.revision === VIDA7_REVISION && c.revision === VIDA8_REVISION &&
    same(e.identity,e.bodyStorageKey) && same(i.identity,i.bodyStorageKey) &&
    same(c.identity,c.bodyStorageKey) &&
    i.ecosystemDigest === e.digest && c.ecosystemDigest === e.digest &&
    c.nativeCivilizationDigest === i.digest &&
    record.nativeCivilizationPresent === i.civilizationPresent &&
    record.colonialPopulationPresent === c.colonialPopulationPresent;
}

function recordAuthorized(record: Vida9BiologyRecord | null | undefined): record is Vida9BiologyRecord {
  if (!record || record.revision !== VIDA9_REVISION || record.epoch !== 'CT-0' ||
      record.epochOffsetYears !== 0 || record.historicalOriginEpochYears !== null ||
      record.revealPolicy !== 'FULL_SYSTEM_REVEAL_ON_CONFIRMED') return false;
  try {
    if (!matchesIdentity(record)) return false;
    const {digest, ...withoutDigest} = record;
    return vida9DigestForRecord(withoutDigest) === digest;
  } catch { return false; }
}

function plan(record: Vida9BiologyRecord, provenance: Vida38InfrastructurePlan386['provenance'],
  id: string, form: Vida38InfrastructurePlan386['form'], scale: Vida38InfrastructurePlan386['scale'],
  tier: Vida38InfrastructurePlan386['tier'], lineage: Vida7CivilizableLineage, habitat: string, purpose: string,
  habitatTechnology: Vida8HabitatTechnology | null,
  colonyArchitectureCOLVIS1?: Vida38InfrastructurePlan386['colonyArchitectureCOLVIS1']): Vida38InfrastructurePlan386 {
  const key = [VIDA38_INFRASTRUCTURE_REVISION_386,record.identity.universeSeed,
    record.identity.generatorVersionCode,record.bodyStorageKey,provenance,id].join('|');
  const seedUint32 = hash32(key);
  return Object.freeze({
    revision: VIDA38_INFRASTRUCTURE_REVISION_386, id: key, provenance,
    bodyStorageKey: record.bodyStorageKey, seedUint32,
    locationStatus: 'RECONSTRUCTED_NOT_OBSERVED',
    ...vida38InfrastructureAnchor386(seedUint32),
    form, scale, tier, lineage, habitat, purpose, habitatTechnology,
    ...(colonyArchitectureCOLVIS1 ? {colonyArchitectureCOLVIS1} : {}),
  });
}

/** Caller MUST have verified confirmed system discovery before passing the record.
 * Fail closed on corrupt/incompatible state. No orbital installations are inferred
 * from technological tier, 37.A/37.B signals, or the legacy satellite display.
 */
export function vida38InfrastructurePlansFromConfirmed386(
  record: Vida9BiologyRecord | null | undefined,
): readonly Vida38InfrastructurePlan386[] {
  if (!recordAuthorized(record)) return Object.freeze([]);
  if (!Array.isArray(record.ecosystem.species) || !Array.isArray(record.ecosystem.habitatsOccupied) ||
      !Array.isArray(record.colonization.colonies) ||
      (record.intelligence.civilization !== null &&
        !Array.isArray(record.intelligence.civilization.settlementPatterns))) return Object.freeze([]);
  const result: Vida38InfrastructurePlan386[] = [];
  const civilization = record.intelligence.civilization;
  const intelligent = record.intelligence.intelligentSpecies;
  if (record.identity.kind === 'PLANET' && record.nativeCivilizationPresent &&
      record.intelligence.intelligencePresent && record.intelligence.civilizationPresent &&
      civilization && intelligent && intelligent.speciesId === civilization.founderSpeciesId &&
      intelligent.lineage === civilization.lineage &&
      record.ecosystem.species.some(s => s.id === civilization.founderSpeciesId) &&
      ['PRIMITIVE','ADVANCED','VERY_ADVANCED'].includes(civilization.tier) &&
      ['HUMANOID','REPTILIAN','INSECTOID'].includes(civilization.lineage)) {
    const seen = new Set<string>();
    for (const settlement of civilization.settlementPatterns ?? []) {
      if (!settlement || typeof settlement.id !== 'string' || !settlement.id || seen.has(settlement.id) ||
          !record.ecosystem.habitatsOccupied.includes(settlement.habitat) ||
          !['HABITAT_HOMESTEAD','ROCK_TERRACE','COLONY_MOUND','MODULAR_CITY','INTEGRATED_HABITAT','CANOPY_NEST','WETLAND_PLATFORM'].includes(settlement.builtForm) ||
          !['SMALL','MEDIUM','LARGE'].includes(settlement.scale)) continue;
      seen.add(settlement.id);
      if (result.length >= 12) break;
      result.push(plan(record,'VIDA7_NATIVE_SETTLEMENT',settlement.id,
        settlement.builtForm,settlement.scale,civilization.tier,civilization.lineage,settlement.habitat,
        settlement.purpose,null));
    }
  }
  const colonization = record.colonization;
  if (colonization.outcome === 'COLONIZED' && colonization.colonialPopulationPresent) {
    const seen = new Set<string>();
    for (const colony of colonization.colonies ?? []) {
      const settlement = colony?.settlement;
      if (colony?.provenance !== 'TECHNOLOGICAL_COLONIZATION' || !colony.id ||
          !settlement?.id || seen.has(colony.id) ||
          !colony.origin?.sourceBodyStorageKey ||
          !['ADVANCED','VERY_ADVANCED'].includes(colony.origin.tier) ||
          !['HUMANOID','REPTILIAN','INSECTOID'].includes(colony.origin.lineage) ||
          colony.origin.sourceBodyStorageKey === record.bodyStorageKey ||
          !['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'].includes(settlement.habitatTechnology) ||
          !['OUTPOST','SETTLEMENT','CITY','NETWORK'].includes(settlement.populationBand)) continue;
      seen.add(colony.id);
      if (result.length >= 20) break;
      result.push(plan(record,'VIDA8_COLONIAL_SETTLEMENT',colony.id + '|' + settlement.id,
        'COLONIAL_HABITAT',settlement.populationBand,'COLONIAL',colony.origin.lineage,
        settlement.habitatTechnology,settlement.function,settlement.habitatTechnology,
        Object.freeze({founderTier:colony.origin.tier,destinationKind:record.identity.kind,
          populationRange:settlement.colonialPopulationRange,function:settlement.function,
          founderSpeciesId:colony.origin.founderSpeciesId,
          founderSourceBodyStorageKey:colony.origin.sourceBodyStorageKey})));
    }
  }
  return Object.freeze(result);
}

/** VIDA.7 and VIDA.8 do not contain a concrete orbital-station entity or orbit.
 * Technosignature 37 is an observational signal, not station identification.
 */
export function vida38OrbitalInstallationsFromConfirmed386(_record: Vida9BiologyRecord | null | undefined): readonly never[] {
  return Object.freeze([]);
}
