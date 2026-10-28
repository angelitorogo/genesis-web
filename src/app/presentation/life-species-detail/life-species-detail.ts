import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { ArchiveDiscoveryDetailFacade, ArchiveDiscoveryLocatorKind } from '../genesis-archive/archive-discovery-detail.facade';
import { scientificRouteUniverseRef } from '../scientific/scientific-route-identity';
import { SystemMultihostGameCutover } from '../system/system-multihost-game-cutover';
import { SystemCompactHostScientificSession } from '../system/system-compact-host-scientific-session';
import { SystemV2SingleScientificSession } from '../system/system-v2-single-scientific-session';
import { PlanetScientificCardAssembler } from '../planet-detail/planet-scientific-card';
import { MoonScientificCardAssembler } from '../moon-detail/moon-scientific-card';
import type { Vida9BiologyRecord } from '../../domain/life/vida9-biology-exploration';
import type { Vida6Species } from '../../domain/life/vida6-ecosystems-species';
import { etiquetaNichoVidaEs, etiquetaVidaEs } from '../scientific/vida9-etiquetas-es';

function indiceNatural(valor:string|null):bigint|null {
  if (valor===null || !/^\d+$/.test(valor)) return null;
  try {return BigInt(valor);} catch {return null;}
}

/** Ficha independiente de especie: consulta la misma realidad CONFIRMED que la ficha anfitriona. */
@Component({
  selector:'app-life-species-detail-page', standalone:true,
  imports:[GenesisScreen,RouterLink],changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host{display:block;min-height:100dvh}
    main{width:min(100% - 2rem,68rem);margin:2rem auto;display:grid;gap:1rem;color:var(--genesis-color-text,#edf5fd)}
    .ceja{font-size:.7rem;letter-spacing:.08em;text-transform:uppercase;color:var(--genesis-color-primary,#72dbf7)}
    h1{font-size:clamp(1.7rem,4vw,2.7rem);margin:0}h2{font-size:1.2rem;margin:.1rem 0 .65rem}
    section{padding:1rem;border:1px solid rgba(106,215,255,.2);border-radius:14px;background:rgba(9,13,22,.8)}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,15rem),1fr));gap:.65rem}
    .dato{padding:.65rem;border:1px solid rgba(106,215,255,.12);border-radius:9px;overflow-wrap:anywhere}
    .dato span{display:block;color:var(--genesis-color-text-muted,#acbccc);font-size:.75rem;margin-bottom:.3rem}
    .dato strong{font-size:.95rem} .lista{margin:.4rem 0;padding-left:1.3rem;line-height:1.7}
    .volver{color:var(--genesis-color-primary,#8adfff);text-decoration:none;font-weight:600}
    .colores{display:flex;gap:.65rem;margin-top:.5rem}.color{height:2rem;width:3rem;border:1px solid #728a9e;border-radius:6px}
    .info{color:var(--genesis-color-text-muted,#b4c1cd);line-height:1.6;margin:.4rem 0}
  `],
  template:`
    <genesis-screen>
      <main data-testid="vida9-ficha-especie">
        <header>
          <small class="ceja">FICHA BIOLÓGICA · ESPECIE</small>
          <h1>{{especie()?.proceduralName ?? 'Especie'}}</h1>
          <p class="info">Información generada del sistema confirmado, correspondiente al estado CT-0.</p>
          <a class="volver" [routerLink]="rutaRegreso()" [queryParams]="parametrosOrigen()" [fragment]="esLuna ? undefined : 'planet-section-vida'">← Volver a la ficha del cuerpo</a>
        </header>
        @if (facade.state().kind === 'loading') {
          <section role="status">Cargando los datos de la especie…</section>
        } @else if (facade.state().kind === 'error') {
          <section role="alert">No se pudo cargar la ficha del cuerpo anfitrión.</section>
        } @else if (registro(); as r) {
          @if (especie(); as e) {
            <section>
              <h2>Clasificación y hábitat</h2>
              <div class="grid">
                <div class="dato"><span>Nombre</span><strong>{{e.proceduralName}}</strong></div>
                <div class="dato"><span>Grupo</span><strong>{{etiqueta(e.group)}}</strong></div>
                <div class="dato"><span>Hábitat</span><strong>{{etiqueta(e.habitat)}}</strong></div>
                <div class="dato"><span>Alimentación</span><strong>{{etiqueta(e.nutrition)}}</strong></div>
                <div class="dato"><span>Nicho ecológico</span><strong>{{nicho(e.niche)}}</strong></div>
              </div>
            </section>
            <section>
              <h2>Adaptaciones</h2>
              <ul class="lista">@for (adaptacion of e.adaptations; track adaptacion) {<li>{{etiqueta(adaptacion)}}</li>}</ul>
            </section>
            <section>
              <h2>Características físicas y aspecto</h2>
              <div class="grid">
                <div class="dato"><span>Plan corporal</span><strong>{{etiqueta(e.phenotype.bodyPlan)}}</strong></div>
                <div class="dato"><span>Cobertura corporal</span><strong>{{etiqueta(e.phenotype.covering)}}</strong></div>
                <div class="dato"><span>Locomoción</span><strong>{{etiqueta(e.phenotype.locomotion)}}</strong></div>
                <div class="dato"><span>Longitud corporal</span><strong>{{e.phenotype.bodyLengthMeters}} m</strong></div>
                <div class="dato"><span>Patrón de pigmentación</span><strong>{{etiqueta(e.phenotype.pattern)}}</strong></div>
                <div class="dato"><span>Pares de apéndices</span><strong>{{e.phenotype.appendagePairs}}</strong></div>
                <div class="dato"><span>Bioluminiscencia</span><strong>{{e.phenotype.bioluminescent?'Sí':'No'}}</strong></div>
                <div class="dato"><span>Pigmentos procedurales</span>
                  <div class="colores"><span class="color" [style.backgroundColor]="e.phenotype.primaryColorHex" aria-label="Pigmento principal"></span>
                  <span class="color" [style.backgroundColor]="e.phenotype.secondaryColorHex" aria-label="Pigmento secundario"></span></div>
                </div>
              </div>
            </section>
            <section>
              <h2>Relaciones ecológicas</h2>
              @if (relaciones().length===0) {<p class="info">Sin relaciones interespecíficas registradas.</p>}
              <ul class="lista">
                @for (relacion of relaciones(); track relacion.sourceSpeciesId+'|'+relacion.targetSpeciesId+'|'+relacion.kind) {
                  <li>{{etiqueta(relacion.kind)}} · {{nombreEspecie(relacion.sourceSpeciesId)}} y {{nombreEspecie(relacion.targetSpeciesId)}}
                    · intensidad {{relacion.intensity01}}</li>
                }
              </ul>
            </section>
            @if (r.intelligence.intelligentSpecies?.speciesId === e.id) {
              <section>
                <h2>Inteligencia y civilización</h2>
                @if (r.intelligence.intelligentSpecies; as inteligencia) {
                  <div class="grid">
                    <div class="dato"><span>Linaje</span><strong>{{etiqueta(inteligencia.lineage)}}</strong></div>
                    <div class="dato"><span>Comunicación</span><strong>{{etiqueta(inteligencia.communication)}}</strong></div>
                    <div class="dato"><span>Organización social</span><strong>{{etiqueta(inteligencia.socialStructure)}}</strong></div>
                  </div>
                  <h2>Capacidades cognitivas</h2>
                  <ul class="lista">@for (rasgo of inteligencia.cognitionTraits; track rasgo) {<li>{{etiqueta(rasgo)}}</li>}</ul>
                }
                @if (r.intelligence.civilization; as civ) {
                  <p><strong>Civilización: {{etiqueta(civ.tier)}}</strong></p>
                  <div class="grid">
                    <div class="dato"><span>Tradición de gobierno</span><strong>{{etiqueta(civ.culture.governingTradition)}}</strong></div>
                    <div class="dato"><span>Enfoque cultural</span><strong>{{etiqueta(civ.culture.culturalFocus)}}</strong></div>
                    <div class="dato"><span>Organización</span><strong>{{etiqueta(civ.culture.socialOrganization)}}</strong></div>
                  </div>
                  <h2>Tecnologías</h2><ul class="lista">@for (tecnologia of civ.technology; track tecnologia) {<li>{{etiqueta(tecnologia)}}</li>}</ul>
                  <h2>Asentamientos</h2><ul class="lista">@for (sitio of civ.settlementPatterns; track sitio.id) {
                    <li>{{etiqueta(sitio.builtForm)}} · {{etiqueta(sitio.habitat)}} · {{etiqueta(sitio.purpose)}} · escala {{etiqueta(sitio.scale).toLocaleLowerCase('es-ES')}}</li>
                  }</ul>
                } @else {<p class="info">Esta especie es inteligente, pero no ha desarrollado una civilización.</p>}
              </section>
            }
            <section><h2>Identidad científica</h2>
              <p class="info">Identificador procedural: <code>{{e.id}}</code></p>
              <p class="info">Los datos pertenecen al universo simulado. No se ha generado una fecha histórica certificada de origen.</p>
            </section>
          } @else {
            <section role="status">No existe una especie con esta identidad en la biosfera del cuerpo indicado.</section>
          }
        } @else {
          <section role="status">La ficha de esta especie no está disponible. El sistema debe estar confirmado.</section>
        }
      </main>
    </genesis-screen>
  `,
})
export class LifeSpeciesDetailPage implements OnInit {
  readonly facade=inject(ArchiveDiscoveryDetailFacade);
  private readonly route=inject(ActivatedRoute);
  private readonly cuerpo=indiceNatural(this.route.snapshot.paramMap.get('bodyIndex'));
  private readonly luna=indiceNatural(this.route.snapshot.paramMap.get('moonIndex'));
  readonly esLuna=this.route.snapshot.paramMap.has('moonIndex');
  private readonly especieId=this.route.snapshot.paramMap.get('speciesId');
  readonly etiqueta=etiquetaVidaEs;
  readonly nicho=etiquetaNichoVidaEs;
  private readonly sesionMultiple=computed(()=>{
    const model=this.facade.model();return model===null?null:SystemMultihostGameCutover.sessionOrNull(model);
  });
  private readonly sesionCompacta=computed(()=>{
    const model=this.facade.model();return model===null?null:SystemCompactHostScientificSession.buildOrNull(model);
  });
  private readonly sesionSimple=computed(()=>{
    const model=this.facade.model();return model===null || this.sesionCompacta()!==null?null:SystemV2SingleScientificSession.buildOrNull(model);
  });
  readonly registro=computed(():Vida9BiologyRecord|null=>{
    const model=this.facade.model();
    if (!model || this.cuerpo===null || (this.esLuna && this.luna===null))return null;
    if (this.esLuna && this.luna!==null) {
      const resultado=this.sesionCompacta()?.moonFiche(this.cuerpo,this.luna) ??
        this.sesionMultiple()?.moonFiche(this.cuerpo,this.luna) ??
        this.sesionSimple()?.moonFiche(this.cuerpo,this.luna) ??
        MoonScientificCardAssembler.build(model,this.cuerpo,this.luna,
          (model.generatorVersionCode===2 || model.generatorVersionCode===3) ? {resolveDetailed:()=>null}:undefined);
      return resultado?.kind==='AVAILABLE'?resultado.card.confirmedBiologyVIDA9??null:null;
    }
    const resultado=this.sesionCompacta()?.planetFiche(this.cuerpo) ??
      this.sesionMultiple()?.planetFiche(this.cuerpo) ??
      this.sesionSimple()?.planetFiche(this.cuerpo) ??
      PlanetScientificCardAssembler.build(model,this.cuerpo,
        (model.generatorVersionCode===2 || model.generatorVersionCode===3) ? {resolveDetailed:()=>null}:undefined);
    return resultado?.kind==='AVAILABLE'?resultado.card.confirmedBiologyVIDA9??null:null;
  });
  readonly especie=computed(():Vida6Species|null=>this.registro()?.ecosystem.species.find(e=>e.id===this.especieId)??null);
  readonly relaciones=computed(()=>this.registro()?.ecosystem.relations.filter(r=>r.sourceSpeciesId===this.especieId || r.targetSpeciesId===this.especieId)??[]);
  nombreEspecie(id:string):string {return this.registro()?.ecosystem.species.find(e=>e.id===id)?.proceduralName??'Especie no disponible';}
  readonly rutaRegreso=computed(():readonly string[]=>{
    const m=this.facade.model();
    if (!m || this.cuerpo===null) return ['/galaxies'];
    const base=['/system',m.galaxyIndex.toString(),m.sectorKey.toString(),m.galacticObjectIndex.toString(),'planet',this.cuerpo.toString()];
    return this.esLuna&&this.luna!==null?[...base,'moon',this.luna.toString()]:base;
  });
  readonly parametrosOrigen=computed(()=>{
    const m=this.facade.model();return m===null?null:{u:m.routeUniverseRef??scientificRouteUniverseRef(m.universeSeed,m.generatorVersionCode)};
  });
  ngOnInit():void {
    void this.facade.load({
      locatorKind:ArchiveDiscoveryLocatorKind.SYSTEM,
      galaxyIndex:this.route.snapshot.paramMap.get('galaxyIndex'),
      sectorKey:this.route.snapshot.paramMap.get('sectorKey'),
      galacticObjectIndex:this.route.snapshot.paramMap.get('galacticObjectIndex'),
      universeRef:this.route.snapshot.queryParamMap.get('u'),
      universeSeed:this.route.snapshot.queryParamMap.get('seed'),
      generatorVersionCode:this.route.snapshot.queryParamMap.get('version'),
      includeStellarSystemScientificProgression:false,
      stellarSystemEntryKind:null,
    });
  }
}
