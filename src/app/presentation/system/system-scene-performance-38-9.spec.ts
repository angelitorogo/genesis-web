import { describe, expect, it } from 'vitest';
import {
  PlanetaryLodGroupControllerV1, LODGRP_MAX_BYTES_V1,
  LODGRP_CACHE_BYTES_V1, lodgrpEstimateBytesV1,
} from './system-scene-planetary-lod-group-lodgrp1';
import { SystemSceneBoundedResourceCacheV1 } from './system-scene-resource-cache';
import type { LodgrpAtlasResultV1 } from './system-scene-group-atlas-lodgrp1';

// Virtual byte-length describes atlas size without allocating hundreds of MB
// during CI. It exercises the actual byte-accounting path in LODGRP.
function atlas(id: string, generation: number, bytes: number): LodgrpAtlasResultV1 {
  return { type: id.startsWith('planet') ? 'planet' : 'moon',
    generation, bodyId: id, width: 512, height: 256, solid: false,
    maps: {albedo: {byteLength: bytes} as Uint8Array} };
}

describe('GENESIS 38.9 · escritorio, instanciación, LOD y memoria', () => {
  it('reutiliza la misma lista de miembros mientras no cambia el grupo', () => {
    const controller = new PlanetaryLodGroupControllerV1();
    const group = {hostId: 'planet-A', moonIds: ['moon-A1','moon-A2'],
      requestedBytes: lodgrpEstimateBytesV1(2)};
    expect(controller.begin(group)).toBe(true);
    const members = controller.memberIds;
    expect(controller.hasMember('moon-A1')).toBe(true);
    expect(controller.hasMember('not-a-moon')).toBe(false);
    expect(controller.begin(group)).toBe(false);
    expect(controller.memberIds).toBe(members);
    controller.leave();
    expect(controller.memberIds).toHaveLength(0);
    expect(controller.hasMember('moon-A1')).toBe(false);
    expect(controller.begin({hostId:'planet-B',moonIds:[],
      requestedBytes:lodgrpEstimateBytesV1(0)})).toBe(true);
    expect(controller.hasMember('moon-A1')).toBe(false);
  });

  it('evita sobrepasar 128 MiB reales al preparar un grupo, sin entrar en HIGH', () => {
    const c = new PlanetaryLodGroupControllerV1();
    c.begin({hostId:'planet-A',moonIds:['moon-A1'],
      requestedBytes:lodgrpEstimateBytesV1(1)});
    const generation = c.status.generation;
    expect(c.accept(atlas('planet-A',generation,80*1024*1024))).toBe(true);
    expect(c.cacheStats.activeBytes).toBe(80*1024*1024);
    expect(c.accept(atlas('moon-A1',generation,60*1024*1024))).toBe(true);
    expect(c.status.phase).toBe('BUDGET_LIMITED');
    expect(c.cacheStats.activeBytes).toBe(0);
    expect(c.activate()).toBe(false);
    expect(c.cacheStats.bytes).toBeLessThanOrEqual(LODGRP_CACHE_BYTES_V1);
    expect(c.accept(atlas('moon-A1',generation,1))).toBe(false);
    c.leave();
    expect(c.cacheStats.activeBytes).toBe(0);
    c.reset();
    expect(c.cacheStats.entries).toBe(0);
    expect(c.cacheStats.bytes).toBe(0);
  });

  it('evita superar el presupuesto al reentrar con atlas previamente cacheados', () => {
    const c = new PlanetaryLodGroupControllerV1();
    const first = {hostId:'planet-A',moonIds:[],
      requestedBytes:lodgrpEstimateBytesV1(0)};
    c.begin(first);
    expect(c.accept(atlas('planet-A',c.status.generation,125*1024*1024))).toBe(true);
    expect(c.status.phase).toBe('READY');
    expect(c.activate()).toBe(true);
    c.leave();
    expect(c.begin(first)).toBe(true);
    expect(c.status.phase).toBe('READY');
    expect(c.cacheStats.activeBytes).toBe(125*1024*1024);
    expect(c.cacheStats.activeBytes).toBeLessThanOrEqual(LODGRP_MAX_BYTES_V1);
    c.reset();
  });

  it('no duplica memoria en las cesiones y libera una sola vez al destruir', () => {
    let disposed = 0;
    const cache = new SystemSceneBoundedResourceCacheV1(2, 256);
    const a = cache.acquire('texture',128,()=>({dispose:()=>{disposed++;}}));
    const b = cache.acquire('texture',128,()=>({dispose:()=>{disposed++;}}));
    expect(a.resource).toBe(b.resource);
    expect(cache.stats().cachedEntryCount).toBe(1);
    expect(cache.stats().leasedEntryCount).toBe(1);
    a.dispose();a.dispose();b.dispose();b.dispose();
    expect(cache.stats().leasedEntryCount).toBe(0);
    cache.dispose();cache.dispose();
    expect(disposed).toBe(1);
  });
});
