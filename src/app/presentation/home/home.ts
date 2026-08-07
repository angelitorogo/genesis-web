import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  GenesisCard,
} from '../../ui/components/genesis-card/genesis-card';
import {
  GenesisSectionTitle,
} from '../../ui/components/genesis-section-title/genesis-section-title';
import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import { HomeFacade } from './home.facade';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    GenesisCard,
    GenesisScreen,
    GenesisSectionTitle,
    RouterLink,
  ],
  providers: [
    HomeFacade,
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit {
  readonly facade =
    inject(HomeFacade);

  ngOnInit(): void {
    this.facade.initialize();
  }
}