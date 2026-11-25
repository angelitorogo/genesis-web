import type { LodgrpAtlasResultV1 } from './system-scene-group-atlas-lodgrp1';

/** GENESIS LODGRP.2 — pure scheduling and diagnostic policy. This module does
 * not own WebGL resources, orbital data or scientific state. */
export type LodgrpApproachV2 = 'OUT' | 'PREPARING' | 'IN';

/** Preparation begins earlier than LODGRP.1 (112 vs 62 projected pixels).
 * Exit hysteresis keeps one group active while visiting its moons. */
export function lodgrpProximityV2(
  projectedEnvelopePixels: number,
  followed: boolean,
  previous: LodgrpApproachV2,
): LodgrpApproachV2 {
  if (followed) return 'IN';
  if (!Number.isFinite(projectedEnvelopePixels) || projectedEnvelopePixels < 0) return 'OUT';
  if (previous === 'IN' && projectedEnvelopePixels >= 82) return 'IN';
  if (projectedEnvelopePixels >= 160) return 'IN';
  if (previous !== 'OUT' && projectedEnvelopePixels >= 65) return 'PREPARING';
  return projectedEnvelopePixels >= 112 ? 'PREPARING' : 'OUT';
}

/** The order is fixed when the group starts. Re-focusing on another moon must
 * never restart its group just because priorities changed. */
export function lodgrpPrioritiseMoonsV2(
  moonIds: readonly string[], focusedBodyId: string | null,
  proximityScores: ReadonlyMap<string, number>,
): readonly string[] {
  return moonIds.map((id, index) => ({id,index,score:proximityScores.get(id) ?? -Infinity}))
    .sort((a,b) => (a.id === focusedBodyId ? -1 : 0) - (b.id === focusedBodyId ? -1 : 0) ||
      b.score-a.score || a.index-b.index)
    .map(({id}) => id);
}

/** A new worker result is GPU-eligible immediately, even if more moons are
 * being generated. Already queued/installed maps must never be duplicated. */
export function lodgrpUnstagedAtlasesV2(
  prepared: readonly LodgrpAtlasResultV1[], stagedBodyIds: ReadonlySet<string>,
): readonly LodgrpAtlasResultV1[] {
  return prepared.filter(atlas => !stagedBodyIds.has(atlas.bodyId));
}

/** Leave an idle worker alive for the next visit. An obsolete in-flight job
 * must be terminated to prevent blocking the next group behind it. */
export function lodgrpTerminateWorkerV2(busy: boolean, force: boolean): boolean {
  return busy || force;
}

export interface LodgrpTimingsSnapshotV2 {
  readonly sinceStartMs: number;
  readonly firstAtlasMs: number | null;
  readonly generatedAtlases: number;
  readonly totalCpuMs: number;
  readonly totalWorkerRoundtripMs: number;
  readonly totalGpuUploadMs: number;
  readonly maxGpuUploadMs: number;
  readonly uploadedMaps: number;
  readonly cpuFinishedAtMs: number | null;
  readonly gpuFinishedAtMs: number | null;
  readonly activatedAtMs: number | null;
}
/** Measured per group, without persistent timers or per-frame allocations. */
export class LodgrpTimingsV2 {
  private startAt = 0;
  private firstAtlasAt: number | null = null;
  private cpuFinishedAt: number | null = null;
  private gpuFinishedAt: number | null = null;
  private activatedAt: number | null = null;
  private cpuTotal = 0;
  private workerRoundtripTotal = 0;
  private gpuTotal = 0;
  private gpuMax = 0;
  private atlases = 0;
  private maps = 0;
  begin(nowMs: number): void {
    this.startAt=nowMs;
    this.firstAtlasAt=null;
    this.cpuFinishedAt=null;
    this.gpuFinishedAt=null;
    this.activatedAt=null;
    this.cpuTotal=0;
    this.workerRoundtripTotal=0;
    this.gpuTotal=0;
    this.gpuMax=0;
    this.atlases=0;
    this.maps=0;
  }
  generated(cpuMs: number, roundtripMs: number, nowMs: number): void {
    if (this.firstAtlasAt === null) this.firstAtlasAt=nowMs;
    this.atlases++;
    this.cpuTotal+=Math.max(0,cpuMs);
    this.workerRoundtripTotal+=Math.max(0,roundtripMs);
  }
  cpuCompleted(nowMs:number):void {this.cpuFinishedAt=nowMs;}
  uploaded(durationMs:number):void {
    const safe=Math.max(0,durationMs);
    this.gpuTotal+=safe;this.gpuMax=Math.max(this.gpuMax,safe);this.maps++;
  }
  gpuCompleted(nowMs:number):void {this.gpuFinishedAt=nowMs;}
  activated(nowMs:number):void {this.activatedAt=nowMs;}
  snapshot(nowMs:number):LodgrpTimingsSnapshotV2 {
    const elapsed=(time:number|null)=>time===null?null:Math.max(0,time-this.startAt);
    return {
      sinceStartMs:Math.max(0,nowMs-this.startAt),
      firstAtlasMs:elapsed(this.firstAtlasAt),
      generatedAtlases:this.atlases,
      totalCpuMs:this.cpuTotal,
      totalWorkerRoundtripMs:this.workerRoundtripTotal,
      totalGpuUploadMs:this.gpuTotal,
      maxGpuUploadMs:this.gpuMax,
      uploadedMaps:this.maps,
      cpuFinishedAtMs:elapsed(this.cpuFinishedAt),
      gpuFinishedAtMs:elapsed(this.gpuFinishedAt),
      activatedAtMs:elapsed(this.activatedAt),
    };
  }
}
