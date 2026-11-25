import type { LodgrpAtlasResultV1 } from './system-scene-group-atlas-lodgrp1';
import { lodgrpAtlasByteSizeV1 } from './system-scene-group-atlas-lodgrp1';

export type LodgrpPhaseV1 = 'LOW' | 'PREPARING' | 'READY' | 'HIGH' | 'BUDGET_LIMITED' | 'FAILED';
export interface LodgrpGroupV1 {
  readonly hostId: string;
  readonly moonIds: readonly string[];
  readonly requestedBytes: number;
}
export interface LodgrpStatusV1 {
  readonly hostId: string | null;
  readonly phase: LodgrpPhaseV1;
  readonly generation: number;
  readonly ready: number;
  readonly total: number;
  readonly requestedBytes: number;
}

export const LODGRP_MAX_BYTES_V1 = 128 * 1024 * 1024;
export const LODGRP_CACHE_BYTES_V1 = 144 * 1024 * 1024;
/** Estimated peak RAM/GPU footprint for a 1024 lunar albedo/normal/roughness
 * triplet. The parent uses VISSURF.5d 1024 or VISCATM.1c 512. */
export function lodgrpEstimateBytesV1(moonCount: number): number {
  return 16 * 1024 * 1024 + moonCount * 8 * 1024 * 1024;
}

/** Hysteresis is evaluated in projected pixels, including the visual orbital
 * envelope, not the individual moons' own screen sizes. */
export function lodgrpProximityV1(
  envelopePixels: number, followed: boolean, previous: 'OUT' | 'PREPARING' | 'IN',
): 'OUT' | 'PREPARING' | 'IN' {
  if (followed) return 'IN';
  if (!Number.isFinite(envelopePixels) || envelopePixels < 0) return 'OUT';
  if (previous === 'IN' && envelopePixels >= 54) return 'IN';
  if (envelopePixels >= 100) return 'IN';
  if (previous !== 'OUT' && envelopePixels >= 35) return 'PREPARING';
  return envelopePixels >= 62 ? 'PREPARING' : 'OUT';
}

/** One active planetary group, with bounded CPU atlas retention for a quick
 * return. Worker inputs/outputs and GPU handles are NOT retained globally. */
export class PlanetaryLodGroupControllerV1 {
  private generation = 0;
  private group: LodgrpGroupV1 | null = null;
  private phase: LodgrpPhaseV1 = 'LOW';
  private ready = new Map<string,LodgrpAtlasResultV1>();
  private readonly cache = new Map<string,{atlas:LodgrpAtlasResultV1;bytes:number}>();
  private cacheBytes = 0;

  get status(): LodgrpStatusV1 {
    return {hostId:this.group?.hostId ?? null,phase:this.phase,
      generation:this.generation,ready:this.ready.size,
      total:this.group ? 1 + this.group.moonIds.length : 0,
      requestedBytes:this.group?.requestedBytes ?? 0};
  }
  get hostId(): string | null {return this.group?.hostId ?? null;}
  get memberIds(): readonly string[] {return this.group ? [this.group.hostId,...this.group.moonIds] : [];}
  get isHigh(): boolean {return this.phase === 'HIGH';}
  get preparing(): boolean {return this.phase === 'PREPARING';}
  get pendingIds(): readonly string[] {
    return this.memberIds.filter(id => !this.ready.has(id));
  }
  get prepared(): readonly LodgrpAtlasResultV1[] {
    return this.memberIds.map(id => this.ready.get(id)).filter((r): r is LodgrpAtlasResultV1 => !!r);
  }
  begin(group: LodgrpGroupV1): boolean {
    if (this.group?.hostId === group.hostId &&
        this.memberIds.length === 1+group.moonIds.length &&
        group.moonIds.every(id => this.memberIds.includes(id))) return false;
    this.generation++;
    this.group = group;
    this.ready.clear();
    if (group.requestedBytes > LODGRP_MAX_BYTES_V1) {
      this.phase = 'BUDGET_LIMITED';
      return true;
    }
    for (const id of this.memberIds) {
      const key = `${group.hostId}:${id}`;
      const stored = this.cache.get(key);
      if (stored) {
        this.cache.delete(key);this.cache.set(key,stored);
        this.ready.set(id,stored.atlas);
      }
    }
    this.phase = this.pendingIds.length ? 'PREPARING' : 'READY';
    return true;
  }
  accept(result: LodgrpAtlasResultV1): boolean {
    if (!this.group || this.phase !== 'PREPARING' ||
      result.generation !== this.generation || !this.memberIds.includes(result.bodyId)) return false;
    this.ready.set(result.bodyId,result);
    const key = `${this.group.hostId}:${result.bodyId}`;
    const old = this.cache.get(key);
    if (old) {this.cacheBytes -= old.bytes;this.cache.delete(key);}
    const size = lodgrpAtlasByteSizeV1(result);
    if (size <= LODGRP_CACHE_BYTES_V1) {
      this.cache.set(key,{atlas:result,bytes:size});this.cacheBytes += size;
      while (this.cacheBytes > LODGRP_CACHE_BYTES_V1 && this.cache.size) {
        const eldest = this.cache.keys().next().value;
        if (eldest === undefined) break;
        const removed = this.cache.get(eldest)!;
        this.cache.delete(eldest);this.cacheBytes -= removed.bytes;
      }
    }
    if (!this.pendingIds.length) this.phase = 'READY';
    return true;
  }
  activate(): boolean {
    if (this.phase !== 'READY') return false;
    this.phase = 'HIGH';return true;
  }
  fail(): void {if (this.group) this.phase = 'FAILED';}
  leave(): boolean {
    if (!this.group) return false;
    this.generation++;this.group=null;this.phase='LOW';this.ready.clear();return true;
  }
  reset(): void {
    this.leave();this.cache.clear();this.cacheBytes=0;
  }
  get cacheStats(): {entries:number;bytes:number;budget:number} {
    return {entries:this.cache.size,bytes:this.cacheBytes,budget:LODGRP_CACHE_BYTES_V1};
  }
}
