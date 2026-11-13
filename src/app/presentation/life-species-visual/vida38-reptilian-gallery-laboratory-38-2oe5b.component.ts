import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import type { Vida38SpeciesVisualContract } from './vida38-species-visual-contract';
import { LifeSpeciesVisualPreviewComponent } from './life-species-visual-preview';
import { Vida38ReptilianGallery38OE5Component } from './vida38-reptilian-gallery-38-2oe5.component';
import { buildVida38ReptilianGallery38OE5 } from './vida38-reptilian-gallery-fixtures-38-2oe5';
import { Vida38CivilizedInsectoidGallery38QComponent } from './vida38-civilized-insectoid-gallery-38-2q.component';
import { buildVida38InsectoidGallery38Q } from './vida38-civilized-insectoid-fixtures-38-2q';
import { Vida38CivilizedHumanoidGallery38RComponent } from './vida38-civilized-humanoid-gallery-38-2r.component';
import { buildVida38HumanoidGallery38R } from './vida38-civilized-humanoid-fixtures-38-2r';
import { Vida38AdvancedHumanoidGallery38WComponent } from './vida38-advanced-humanoid-gallery-38-2w.component';
import { buildVida38AdvancedHumanoidGallery38W } from './vida38-advanced-humanoid-fixtures-38-2w';
import { Vida38PrimitiveHumanoidGallery38XComponent } from './vida38-primitive-humanoid-gallery-38-2x.component';
import { buildVida38PrimitiveHumanoidGallery38X } from './vida38-primitive-humanoid-fixtures-38-2x';
import { Vida38AdvancedReptilianGallery38SComponent } from './vida38-advanced-reptilian-gallery-38-2s.component';
import { buildVida38AdvancedReptilianGallery38S } from './vida38-advanced-reptilian-fixtures-38-2s';
import { Vida38AdvancedInsectoidGallery38TComponent } from './vida38-advanced-insectoid-gallery-38-2t.component';
import { buildVida38AdvancedInsectoidGallery38T } from './vida38-advanced-insectoid-fixtures-38-2t';
import { Vida38PrimitiveInsectoidGallery38VComponent } from './vida38-primitive-insectoid-gallery-38-2v.component';
import { buildVida38PrimitiveInsectoidGallery38V } from './vida38-primitive-insectoid-fixtures-38-2v';
import { Vida38PrimitiveReptilianGallery38UComponent } from './vida38-primitive-reptilian-gallery-38-2u.component';
import { buildVida38PrimitiveReptilianGallery38U } from './vida38-primitive-reptilian-fixtures-38-2u';

@Component({
  selector:'app-vida38-reptilian-gallery-laboratory-38-2oe5b',standalone:true,
  imports:[
    LifeSpeciesVisualPreviewComponent,Vida38ReptilianGallery38OE5Component,Vida38CivilizedInsectoidGallery38QComponent,
    Vida38CivilizedHumanoidGallery38RComponent,Vida38AdvancedReptilianGallery38SComponent,
    Vida38AdvancedInsectoidGallery38TComponent,Vida38PrimitiveReptilianGallery38UComponent,
    Vida38PrimitiveInsectoidGallery38VComponent,Vida38AdvancedHumanoidGallery38WComponent,Vida38PrimitiveHumanoidGallery38XComponent,
  ],
  changeDetection:ChangeDetectionStrategy.OnPush,
  styles:[`
    :host{display:block}
    .lab{width:min(1550px,calc(100% - 36px));margin:1.5rem auto 4rem;color:#dbeefe}
    .head{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:1.2rem}
    .eyebrow{color:#55d8ff;text-transform:uppercase;font-size:.73rem;letter-spacing:.12em;font-weight:750}
    h1{margin:.35rem 0;font-size:clamp(1.45rem,2.4vw,2.2rem);color:#f5fbff}
    .intro{max-width:820px;line-height:1.65;color:#b1c4d7;margin:.5rem 0 0}
    button{background:transparent;color:#b9ecff;border:1px solid #30627c;border-radius:9px;padding:.6rem .85rem;font:inherit;cursor:pointer}
    button:hover{background:rgba(58,148,176,.13)}
    button[aria-pressed=true]{border-color:#64e2c6;background:#124650;color:#eafff9}
    .lineages{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1rem;margin:1rem 0}
    .lineage-col{border:1px solid #1c3849;background:#0b1621;padding:.85rem;border-radius:12px;display:flex;flex-direction:column;gap:.55rem}
    .lineage-title{font-size:.8rem;text-transform:uppercase;letter-spacing:.11em;color:#7fe0ff;font-weight:750;margin-bottom:.15rem}
    .lineage-buttons{display:flex;flex-direction:column;gap:.5rem}
    button[disabled]{opacity:.45;cursor:default;border-color:#264252;color:#7d9aa8}
    @media (max-width: 980px){.lineages{grid-template-columns:1fr}}
    .roadmap{border:1px solid #1c3849;background:#0b1621;padding:.75rem 1rem;border-radius:10px;color:#a7c2d1;font-size:.81rem;margin:1rem 0;line-height:1.6}
    .roadmap strong{color:#d5f2ff}
    .viewer{scroll-margin-top:1rem;margin-top:1.1rem}
    .caption{color:#9fb6c5;font-size:.84rem;margin:0 0 .75rem}
  `],
  template:`
    <main class="lab" data-testid="vida38-civilizations-laboratory-38s">
      <header class="head">
        <div>
          <div class="eyebrow">FASE 38 · VIDA / THREE.JS</div>
          <h1>Civilizaciones</h1>
          <p class="intro">Galerías comparativas de especies inteligentes con indumentaria, anatomía y accesorios procedurales deterministas. Las muestras son de laboratorio y no modifican el universo.</p>
        </div>
        <button type="button" (click)="goBack()">Volver a Laboratorio</button>
      </header>
      <nav class="lineages" aria-label="Linajes y niveles de civilización">
        <section class="lineage-col" aria-label="Humanoides">
          <div class="lineage-title">Humanoides</div>
          <div class="lineage-buttons">
            <button type="button" (click)="setSection('HUMANOID_VERY_ADVANCED')" [attr.aria-pressed]="section==='HUMANOID_VERY_ADVANCED'">Humanoides · Muy avanzados</button>
            <button type="button" (click)="setSection('HUMANOID_ADVANCED')" [attr.aria-pressed]="section==='HUMANOID_ADVANCED'">Humanoides · Avanzados</button>
            <button type="button" (click)="setSection('HUMANOID_PRIMITIVE')" [attr.aria-pressed]="section==='HUMANOID_PRIMITIVE'">Humanoides · Primitivos</button>
          </div>
        </section>
        <section class="lineage-col" aria-label="Reptilianos">
          <div class="lineage-title">Reptilianos</div>
          <div class="lineage-buttons">
            <button type="button" (click)="setSection('REPTILIAN_VERY_ADVANCED')" [attr.aria-pressed]="section==='REPTILIAN_VERY_ADVANCED'">Reptilianos · Muy avanzados</button>
            <button type="button" (click)="setSection('REPTILIAN_ADVANCED')" [attr.aria-pressed]="section==='REPTILIAN_ADVANCED'">Reptilianos · Avanzados</button>
            <button type="button" (click)="setSection('REPTILIAN_PRIMITIVE')" [attr.aria-pressed]="section==='REPTILIAN_PRIMITIVE'">Reptilianos · Primitivos</button>
          </div>
        </section>
        <section class="lineage-col" aria-label="Insectoides">
          <div class="lineage-title">Insectoides</div>
          <div class="lineage-buttons">
            <button type="button" (click)="setSection('INSECTOID_VERY_ADVANCED')" [attr.aria-pressed]="section==='INSECTOID_VERY_ADVANCED'">Insectoides · Muy avanzados</button>
            <button type="button" (click)="setSection('INSECTOID_ADVANCED')" [attr.aria-pressed]="section==='INSECTOID_ADVANCED'">Insectoides · Avanzados</button>
            <button type="button" (click)="setSection('INSECTOID_PRIMITIVE')" [attr.aria-pressed]="section==='INSECTOID_PRIMITIVE'">Insectoides · Primitivos</button>
          </div>
        </section>
      </nav>
      <p class="roadmap"><strong>Estructura preparada:</strong> cada linaje tendrá sus variantes <strong>muy avanzada</strong>, <strong>avanzada</strong> y <strong>primitiva</strong>. Ahora se muestran nueve galerías operativas y la navegación ya queda ordenada por tres columnas: humanoides (muy avanzados, avanzados y primitivos), reptilianos (muy avanzados, avanzados y primitivos) e insectoides (muy avanzados, avanzados y primitivos).</p>
      @if(section==='REPTILIAN_VERY_ADVANCED'){
        <app-vida38-reptilian-gallery-38-2oe5 [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='REPTILIAN_ADVANCED'){
        <app-vida38-advanced-reptilian-gallery-38s [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='REPTILIAN_PRIMITIVE'){
        <app-vida38-primitive-reptilian-gallery-38u [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='INSECTOID_VERY_ADVANCED'){
        <app-vida38-civilized-insectoid-gallery-38q [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='INSECTOID_ADVANCED'){
        <app-vida38-advanced-insectoid-gallery-38t [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='INSECTOID_PRIMITIVE'){
        <app-vida38-primitive-insectoid-gallery-38v [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='HUMANOID_PRIMITIVE'){
        <app-vida38-primitive-humanoid-gallery-38x [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else if(section==='HUMANOID_ADVANCED'){
        <app-vida38-advanced-humanoid-gallery-38w [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }@else{
        <app-vida38-civilized-humanoid-gallery-38r [selectedSpeciesId]="selected.speciesId" (open)="openSpecimen($event)" />
      }
      <section class="viewer" #viewerAnchor>
        <p class="caption">Ejemplar seleccionado: <strong>{{selected.speciesName}}</strong> · Gira, amplía y desplaza el espécimen con los controles habituales.</p>
        <app-life-species-visual-preview [contract]="selected" [showReptilianGalleryToggle]="false" />
      </section>
    </main>
  `,
})
export class Vida38ReptilianGalleryLaboratory38OE5BComponent {
  private readonly reptiles=buildVida38ReptilianGallery38OE5(24);
  private readonly reptilesAdvanced=buildVida38AdvancedReptilianGallery38S(24);
  private readonly reptilesPrimitive=buildVida38PrimitiveReptilianGallery38U(24);
  private readonly insects=buildVida38InsectoidGallery38Q(24);
  private readonly insectsAdvanced=buildVida38AdvancedInsectoidGallery38T(24);
  private readonly insectsPrimitive=buildVida38PrimitiveInsectoidGallery38V(24);
  private readonly humanoids=buildVida38HumanoidGallery38R(24);
  private readonly humanoidsAdvanced=buildVida38AdvancedHumanoidGallery38W(24);
  private readonly humanoidsPrimitive=buildVida38PrimitiveHumanoidGallery38X(24);
  section:'REPTILIAN_VERY_ADVANCED'|'REPTILIAN_ADVANCED'|'REPTILIAN_PRIMITIVE'|'INSECTOID_VERY_ADVANCED'|'INSECTOID_ADVANCED'|'INSECTOID_PRIMITIVE'|'HUMANOID_VERY_ADVANCED'|'HUMANOID_ADVANCED'|'HUMANOID_PRIMITIVE'='REPTILIAN_VERY_ADVANCED';
  selected:Vida38SpeciesVisualContract=this.reptiles[0]!.contract;
  @ViewChild('viewerAnchor') private readonly viewerAnchor?:ElementRef<HTMLDivElement>;
  goBack():void{window.history.back();}
  setSection(section:'REPTILIAN_VERY_ADVANCED'|'REPTILIAN_ADVANCED'|'REPTILIAN_PRIMITIVE'|'INSECTOID_VERY_ADVANCED'|'INSECTOID_ADVANCED'|'INSECTOID_PRIMITIVE'|'HUMANOID_VERY_ADVANCED'|'HUMANOID_ADVANCED'|'HUMANOID_PRIMITIVE'):void{
    this.section=section;
    this.selected=section==='REPTILIAN_VERY_ADVANCED'?this.reptiles[0]!.contract:
      section==='REPTILIAN_ADVANCED'?this.reptilesAdvanced[0]!.contract:
      section==='REPTILIAN_PRIMITIVE'?this.reptilesPrimitive[0]!.contract:
      section==='INSECTOID_VERY_ADVANCED'?this.insects[0]!.contract:
      section==='INSECTOID_ADVANCED'?this.insectsAdvanced[0]!.contract:
      section==='INSECTOID_PRIMITIVE'?this.insectsPrimitive[0]!.contract:
      section==='HUMANOID_ADVANCED'?this.humanoidsAdvanced[0]!.contract:
      section==='HUMANOID_PRIMITIVE'?this.humanoidsPrimitive[0]!.contract:this.humanoids[0]!.contract;
  }
  openSpecimen(contract:Vida38SpeciesVisualContract):void{
    this.selected=contract;
    this.viewerAnchor?.nativeElement.scrollIntoView({behavior:'smooth',block:'start'});
  }
}
