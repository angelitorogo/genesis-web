import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { Vida9aAuditResult } from './vida9a-physical-biology-coherence';

/** UI de diagnóstico de solo lectura, solo dentro de fichas CONFIRMED. */
@Component({
  selector:'app-vida9a-physical-biology-audit-panel',standalone:true,
  changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`:host{display:block;margin:1rem 0}section{border:1px solid var(--border-color,#576276);border-radius:12px;padding:1rem}
    h2{font-size:1.1rem;margin:.35rem 0 .65rem} p{margin:.5rem 0}ul{padding-left:1.3rem}
    li{margin:.5rem 0}small{opacity:.8}strong{font-weight:650} .error{font-weight:650}`],
  template:`
    <section data-testid="vida9a-physical-biology-audit" aria-label="Auditoría de coherencia físico-biológica">
      <small>VIDA.9a · AUDITORÍA CT-0 · SOLO LECTURA</small>
      <h2>Coherencia física, ambiental y biológica</h2>
      <p>Resultado: <strong>{{audit.status === 'COHERENT' ?
        'Sin contradicciones directas detectadas' : 'Revisión necesaria'}}</strong>.</p>
      @if (audit.kind === 'PLANET') {
        <p>Temperatura PRE-VIDA.5: <strong>{{format(audit.preBiologyTemperatureKelvin,' K')}}</strong> ·
          temperatura efectiva: <strong>{{format(audit.effectiveTemperatureKelvin,' K')}}</strong> ·
          diferencia: <strong>{{format(audit.temperatureDifferenceKelvin,' K')}}</strong>.</p>
        <p>Presión PRE-VIDA.5: <strong>{{format(audit.preBiologyPressurePascal,' Pa')}}</strong> ·
          presión efectiva: <strong>{{format(audit.effectivePressurePascal,' Pa')}}</strong> ·
          diferencia: <strong>{{format(audit.pressureDifferencePascal,' Pa')}}</strong>.</p>
        <p><small>Los hechos físicos 31.12 se calculan sobre el estado PRE-VIDA.5;
          Atmósfera y Clima muestran el estado efectivo. No son dos mediciones.</small></p>
      }
      @if (!audit.findings.length) { <p>No se han encontrado discrepancias en los invariantes comprobados.
        No equivale a una certificación de toda la física o la química.</p> }
      <ul>
        @for (item of audit.findings; track item.id) {
          <li [class.error]="item.severity === 'ERROR'">
            <strong>{{item.severity === 'ERROR'?'Contradicción':item.severity === 'LIMITATION'?'Límite del modelo':'Transición coherente'}}:
              {{item.title}}</strong>. {{item.explanation}}
          </li>
        }
      </ul>
      <small>Revisión {{audit.revision}}. Auditoría independiente de las semillas, especies,
        poblaciones e identidades; no modifica IndexedDB ni la realidad generada.</small>
    </section>
  `,
})
export class Vida9aPhysicalBiologyAuditPanel {
  @Input({required:true}) audit!:Vida9aAuditResult;
  readonly format=(value:number|null,unit:string):string=>value===null?'No resuelto':
    `${new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(value)}${unit}`;
}
