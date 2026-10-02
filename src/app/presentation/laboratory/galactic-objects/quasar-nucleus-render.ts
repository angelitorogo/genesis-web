import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';

import {
  BlackHoleLaboratoryRender,
} from './black-hole-laboratory-render';

import {
  type BlackHoleLaboratoryRenderModel,
} from './black-hole-laboratory-render-model';

import {
  type QuasarNucleusRenderModel,
} from './quasar-nucleus-render-model';

/**
 * 28.2F.4 — QUASAR laboratory presentation.
 *
 * The compact object remains the canonical 28.2F.3 SMBH used by AGN.
 * QUASAR is expressed as an activity regime around that same SMBH:
 * hyperluminous inner environment, corona/scattering halo and family-dependent
 * polar outflow/jet layers. No second black-hole silhouette or legacy quasar
 * object is rendered behind the canonical core.
 */
@Component({
  selector: 'app-quasar-nucleus-render',
  standalone: true,
  imports: [
    BlackHoleLaboratoryRender,
  ],
  templateUrl: './quasar-nucleus-render.html',
  styleUrl: './quasar-nucleus-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuasarNucleusRender {
  @Input({ required: true })
  model!: QuasarNucleusRenderModel;

  @Input()
  blackHoleCoreModel: BlackHoleLaboratoryRenderModel | null = null;
}
