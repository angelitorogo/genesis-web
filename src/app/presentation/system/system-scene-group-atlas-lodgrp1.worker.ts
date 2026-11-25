/// <reference lib="webworker" />
import { buildLodgrpAtlasV1, type LodgrpAtlasRequestV1 } from './system-scene-group-atlas-lodgrp1';

/** A dedicated worker processes ONE body per message. The renderer queues the
 * next body only after receiving the result, so preparation can be canceled
 * and prioritised without loading the entire system in one main-thread task. */
addEventListener('message', ({data}: MessageEvent<LodgrpAtlasRequestV1>) => {
  try {
    const started = performance.now();
    const atlas = buildLodgrpAtlasV1(data);
    const result = {...atlas, cpuMs:performance.now() - started};
    const buffers = Object.values(result.maps).map(rgba => rgba?.buffer)
      .filter((buffer): buffer is ArrayBuffer => buffer instanceof ArrayBuffer);
    postMessage({ok:true,result}, {transfer:buffers});
  } catch (error) {
    postMessage({ok:false, generation:data.generation, bodyId:data.bodyId,
      error:error instanceof Error ? error.message : String(error)});
  }
});
