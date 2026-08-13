import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

/**
 * Point 9.6: real navigation destination for Statistics.
 *
 * This screen intentionally exposes no statistical computation yet. The
 * complete statistics, milestones and Great Filter functionality belongs to
 * its later roadmap phase. Point 9.6 only makes the module a real, reachable
 * application destination without inventing derived data or Ground Truth.
 */
@Component({
  selector:
    'app-statistics',

  standalone:
    true,

  imports: [
    GenesisScreen,
    RouterLink,
  ],

  templateUrl:
    './statistics.html',

  styleUrl:
    './statistics.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Statistics {}
