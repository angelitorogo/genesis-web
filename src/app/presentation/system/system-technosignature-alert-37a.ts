import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, inject, signal } from '@angular/core';
import type { ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { SystemTechnosignature37aDataSource } from './system-technosignature-37a.data-source';

/** Discreet scene notice. No planet identity in its text or DOM attributes. */
@Component({
  selector:'app-system-technosignature-alert-37a',
  standalone:true,
  changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    @if (alert(); as level) {
      <aside class="tech37a-notice" role="status" aria-live="polite"
        data-testid="system-37a-technology-alert">
        <span class="tech37a-notice__symbol" aria-hidden="true">◉</span>
        <div class="tech37a-notice__text">
          <strong>Actividad tecnológica identificada</strong>
          @if (level === 'VERY_ADVANCED') {
            <p>Este sistema confirmado alberga una civilización muy avanzada.</p>
          } @else {
            <p>Este sistema confirmado alberga una civilización avanzada.</p>
          }
          <small>Consulta las fichas planetarias para conocer su lugar de origen.</small>
        </div>
        <button type="button" (click)="dismiss()" aria-label="Cerrar aviso tecnológico"
          data-testid="system-37a-technology-dismiss">×</button>
      </aside>
    }
  `,
  styles:[`
    :host {position:absolute;top:.9rem;right:.9rem;z-index:6;max-width:min(27rem,calc(100% - 1.8rem));pointer-events:none;}
    .tech37a-notice {display:flex;gap:.7rem;align-items:flex-start;padding:.85rem .9rem;
      border:1px solid rgba(106,215,255,.40);border-left:3px solid rgba(106,215,255,.8);
      border-radius:.7rem;background:rgba(7,17,30,.95);color:#edfaff;
      box-shadow:0 .5rem 2rem rgba(0,0,0,.5);pointer-events:auto;}
    .tech37a-notice__symbol {font-size:1.1rem;color:#8bdfff;}
    .tech37a-notice__text {display:grid;gap:.3rem;min-width:0;}
    .tech37a-notice strong {font-size:.82rem;line-height:1.35;}
    .tech37a-notice p {margin:0;font-size:.78rem;line-height:1.4;}
    .tech37a-notice small {font-size:.7rem;color:#bbd4e5;line-height:1.4;}
    .tech37a-notice button {border:0;background:transparent;color:#bcd5e5;
      font-size:1.35rem;line-height:1;cursor:pointer;padding:.1rem .25rem;}
    .tech37a-notice button:focus-visible {outline:2px solid #8bdfff;outline-offset:2px;}
    @media(max-width:40rem){:host{top:.4rem;right:.4rem;max-width:calc(100% - .8rem);}}
  `],
})
export class SystemTechnosignatureAlert37a implements OnChanges,OnDestroy {
  @Input({required:true}) model!:ArchiveDiscoveryDetailModel;
  private readonly source=inject(SystemTechnosignature37aDataSource);
  readonly alert=signal<'ADVANCED'|'VERY_ADVANCED'|null>(null);
  private sequence=0;
  private lastIdentity='';

  ngOnChanges():void {
    const model=this.model;
    const id=[model.universeSeed,model.generatorVersionCode,model.galaxyIndex,
      model.sectorKey,model.galacticObjectIndex,model.discoveryState.code].join('/');
    if(this.lastIdentity===id)return;
    this.lastIdentity=id;
    const sequence=++this.sequence;
    this.alert.set(null);
    if(model.discoveryState.code!==DiscoveryState.CONFIRMED.code)return;
    void this.source.read({universeSeed:model.universeSeed,
      generatorVersionCode:model.generatorVersionCode,
      galaxyIndex:model.galaxyIndex,sectorKey:model.sectorKey,
      galacticObjectIndex:model.galacticObjectIndex,confirmed:true}).then(result=>{
        if(sequence===this.sequence)this.alert.set(result.alert);
      },error=>{
        // An unavailable/corrupt source is never evidence of a civilization.
        // Never show an invented alert or interrupt the scene renderer.
        if(sequence===this.sequence) console.warn('37.A: aviso tecnológico no evaluable',error);
      });
  }
  dismiss():void {this.alert.set(null);}
  ngOnDestroy():void {this.sequence++;}
}
