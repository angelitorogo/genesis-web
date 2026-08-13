import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  OnInit,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';

import {
  GenesisCard,
} from '../../ui/components/genesis-card/genesis-card';

import {
  GenesisSectionTitle,
} from '../../ui/components/genesis-section-title/genesis-section-title';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  HomeFacade,
} from './home.facade';

@Component({
  selector:
    'app-home',

  standalone:
    true,

  imports: [
    GenesisCard,
    GenesisScreen,
    GenesisSectionTitle,
    RouterLink,
  ],

  templateUrl:
    './home.html',

  styleUrl:
    './home.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Home
  implements OnInit {

  readonly facade =
    inject(
      HomeFacade,
    );

  ngOnInit():
    void {

    void this
      .facade
      .refresh();
  }

  @HostListener(
    'window:focus',
  )
  onWindowFocus():
    void {

    void this
      .facade
      .refresh();
  }

  isOriginGalaxy(
    galaxyIndex:
      bigint,
  ): boolean {

    return galaxyIndex ===
      0n;
  }

  discoveryStateLabel(
    state:
      DiscoveryStateValue,
  ): string {

    switch (
      state.code
    ) {
      case 1:
        return 'Detectada';

      case 2:
        return 'Descubierta';

      case 3:
        return 'Visitada';

      case 4:
        return 'Catalogada';

      case 5:
        return 'Confirmada';

      default:
        return 'Estado no válido';
    }
  }
}
