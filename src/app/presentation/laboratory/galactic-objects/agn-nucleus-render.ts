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
  type AgnNucleusRenderModel,
} from './agn-nucleus-render-model';

/**
 * 28.2F.4 — AGN laboratory presentation.
 *
 * AGN is a nuclear activity regime around an SMBH, not a second visual object.
 * For this stage the laboratory intentionally renders ONLY the canonical
 * 28.2F.3 SMBH visual, with no legacy AGN canvas/background layered behind it.
 * The A-H selector still changes the deterministic SMBH sample through the
 * blackHoleCoreModel supplied by GalacticNucleusLaboratoryFixtures.
 */
@Component({
  selector: 'app-agn-nucleus-render',
  standalone: true,
  imports: [
    BlackHoleLaboratoryRender,
  ],
  templateUrl: './agn-nucleus-render.html',
  styleUrl: './agn-nucleus-render.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgnNucleusRender {
  @Input({ required: true })
  model!: AgnNucleusRenderModel;

  @Input()
  blackHoleCoreModel: BlackHoleLaboratoryRenderModel | null = null;
}
