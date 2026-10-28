import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import { etiquetaVidaEs } from './vida9-etiquetas-es';

/** Vista resumida de VIDA.9: información ya revelada únicamente en sistemas CONFIRMED. */
@Component({
  selector:'app-vida9-full-system-biology-panel', standalone:true,
  imports:[RouterLink], changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host { display:block; min-width:0; }
    .vida9-acordeon {display:grid;gap:.65rem;}
    details {border:1px solid rgba(106,215,255,.22);border-radius:12px;overflow:hidden;background:rgba(106,215,255,.025)}
    details[open] {border-color:rgba(106,215,255,.4)}
    summary {cursor:pointer;display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;font-weight:650;list-style:none;}
    summary::-webkit-details-marker {display:none} summary::before {content:'▸';color:#77cfe9;}
    details[open]>summary::before {content:'▾'} summary:focus-visible,a:focus-visible{outline:2px solid #77cfe9;outline-offset:2px}
    .contenido {padding:0 1rem 1rem} ul {list-style:none;padding:0;margin:.4rem 0;display:grid;gap:.3rem}
    li {padding:.45rem .65rem;border:1px solid rgba(106,215,255,.10);border-radius:8px}
    a {color:#8edaf1;font-weight:650;text-decoration:none} a:hover{text-decoration:underline}
    p {margin:.4rem 0;color:var(--genesis-color-text-muted,#b4becb)} strong {color:var(--genesis-color-text,#fff)}
  `],
  template:`
    <div class="vida9-acordeon" data-testid="vida9-full-confirmed-reveal" aria-label="Datos biológicos del sistema confirmado">
      <details data-testid="vida9-especies">
        <summary>Ecosistemas, especies y relaciones ({{record.ecosystem.species.length}} especies)</summary>
        <div class="contenido">
          @if (!record.ecosystem.species.length) {
            <p>No existen especies nativas generadas.</p>
          } @else {
            <ul>
              @for (especie of record.ecosystem.species; track especie.id) {
                <li>
                  @if (rutaEspecie(especie.id); as ruta) {
                    <a [routerLink]="ruta" [queryParams]="parametrosOrigen"><strong>{{especie.proceduralName}}</strong></a>
                  } @else { <strong>{{especie.proceduralName}}</strong> }
                  ({{etiqueta(especie.group)}})
                </li>
              }
            </ul>
          }
          @if (record.ecosystem.relations.length) {
            <p>{{record.ecosystem.relations.length}} relaciones ecológicas registradas. Su detalle aparece en la ficha de cada especie.</p>
          }
        </div>
      </details>
      <details data-testid="vida9-civilizaciones">
        <summary>Inteligencia y civilizaciones ({{record.intelligence.civilization ? 1 : 0}})</summary>
        <div class="contenido">
          @if (record.intelligence.intelligentSpecies; as inteligente) {
            <p>Especie inteligente:
              @if (nombreEspecie(inteligente.speciesId); as nombre) {
                @if (rutaEspecie(inteligente.speciesId); as ruta) {
                  <a [routerLink]="ruta" [queryParams]="parametrosOrigen">{{nombre}}</a>
                } @else { <strong>{{nombre}}</strong> }
              } @else { <strong>Identidad no resuelta</strong> }
            </p>
            <p>Civilización: <strong>{{record.intelligence.civilization ? etiqueta(record.intelligence.civilization.tier) : 'Sin civilización'}}</strong></p>
          } @else { <p>No se ha generado inteligencia nativa.</p> }
        </div>
      </details>
      <details data-testid="vida9-colonias">
        <summary>Colonias, población y terraformación ({{record.colonization.colonies.length}})</summary>
        <div class="contenido">
          @if (!record.colonization.colonies.length) {<p>Sin colonias tecnológicas generadas.</p>}
          @for (colonia of record.colonization.colonies; track colonia.id) {
            <p><strong>Colonia {{ $index + 1 }}</strong> · {{etiqueta(colonia.settlement.habitatTechnology)}} · {{etiqueta(colonia.settlement.populationBand)}}</p>
            <p>Población colonial: {{colonia.settlement.colonialPopulationRange[0]}}–{{colonia.settlement.colonialPopulationRange[1]}} habitantes.</p>
            <p>Procedencia: {{etiqueta(colonia.origin.lineage)}} · Civilización {{etiqueta(colonia.origin.tier).toLocaleLowerCase('es-ES')}}.</p>
            @if (colonia.terraform; as proyecto) {
              <p>Terraformación: {{etiqueta(proyecto.stage)}}. El entorno físico todavía no se ha modificado.</p>
            }
          }
        </div>
      </details>
    </div>
  `,
})
export class Vida9FullSystemBiologyPanel {
  @Input({required:true}) record!:Vida9BiologyRecord;
  @Input() rutaBaseEspecies: readonly string[] | null = null;
  @Input() parametrosOrigen: { readonly u: string } | null = null;
  readonly etiqueta=etiquetaVidaEs;
  nombreEspecie(id:string):string | null {
    return this.record.ecosystem.species.find(especie=>especie.id===id)?.proceduralName ?? null;
  }
  rutaEspecie(id:string): readonly string[] | null {
    return this.rutaBaseEspecies === null ? null : [...this.rutaBaseEspecies,id];
  }
}
