/** Orquestación de 37.B. Sin lectura IndexedDB, progreso científico ni PD.
 * Un único Worker activo; cancelación al cambiar foco o región. Caché acotada
 * a resultados completos para evitar recalcular la misma región en una sesión.
 */
import { Injectable } from '@angular/core';
import type { RegionalSignalRequest37b, RegionalSignalStatus37b,
  RegionalSignalWorkerReply37b } from './regional-technosignature-37b';

@Injectable({providedIn: 'root'})
export class RegionalTechnosignature37bScanner {
  private current: Worker | null = null;
  private rejectCurrent: ((reason: Error) => void) | null = null;
  private readonly cache = new Map<string, RegionalSignalStatus37b>();

  cancel(): void {
    this.current?.terminate();
    this.current = null;
    const reject = this.rejectCurrent;
    this.rejectCurrent = null;
    reject?.(new Error('Análisis regional cancelado'));
  }

  async scan(request: RegionalSignalRequest37b): Promise<RegionalSignalStatus37b> {
    this.cancel();
    const id = [request.seed,request.version,request.galaxyIndex,
      Math.floor(request.centerX/10),Math.floor(request.centerY/10)].join('|');
    const cached = this.cache.get(id);
    if (cached) {
      // Acceso reciente: mantener una LRU real, no un orden FIFO.
      this.cache.delete(id);
      this.cache.set(id, cached);
      return cached;
    }
    if (typeof Worker === 'undefined') throw Error('Este navegador no admite la escucha regional');
    const worker = new Worker(new URL('./regional-technosignature-37b.worker', import.meta.url),
      {name:'genesis-37b-regional',type:'module'});
    this.current = worker;
    const result = await new Promise<RegionalSignalStatus37b>((resolve,reject) => {
      this.rejectCurrent = reject;
      worker.onmessage = (event: MessageEvent<RegionalSignalWorkerReply37b>) => {
        if (this.current !== worker) return;
        this.current = null;
        this.rejectCurrent = null;
        worker.terminate();
        if (event.data.kind === 'error') reject(new Error(event.data.message));
        else resolve(event.data.status);
      };
      worker.onerror = (event: ErrorEvent) => {
        if (this.current !== worker) return;
        this.current = null;
        this.rejectCurrent = null;
        worker.terminate();
        reject(new Error(event.message || 'El módulo de escucha no pudo ejecutarse'));
      };
      worker.postMessage(request);
    });
    if (result !== 'INCOMPLETE') {
      this.cache.delete(id);this.cache.set(id,result);
      if (this.cache.size > 16) this.cache.delete(this.cache.keys().next().value!);
    }
    return result;
  }
}
