import {
  ChangeDetectionStrategy,
  Component,
} from '@angular/core';

import {
  RouterLink,
} from '@angular/router';

import {
  buildPostSupernovaAuditCases,
  type PostSupernovaAuditCase,
} from './post-supernova-audit-fixtures';

@Component({
  selector: 'app-post-supernova-audit',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './post-supernova-audit.html',
  styleUrl: './post-supernova-audit.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostSupernovaAuditPage {
  readonly cases = buildPostSupernovaAuditCases();

  readonly boundCase = this.requireCase('A');
  readonly ejectedCase = this.requireCase('B');
  readonly tripleCase = this.requireCase('C');
  readonly controlCase = this.requireCase('D');

  private requireCase(id: PostSupernovaAuditCase['id']): PostSupernovaAuditCase {
    const match = this.cases.find(candidate => candidate.id === id);
    if (match === undefined) throw new Error(`Missing post-supernova audit case ${id}.`);
    return match;
  }
}
