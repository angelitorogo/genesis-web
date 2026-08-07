import {
  inject,
  Injectable,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
} from '@angular/router';
import {
  distinctUntilChanged,
  filter,
  map,
  startWith,
} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NavigationFacade {
  private readonly router = inject(Router);

  private readonly currentUrl$ =
    this.router.events.pipe(
      filter(
        (event): event is NavigationEnd =>
          event instanceof NavigationEnd,
      ),
      map(
        (event) => event.urlAfterRedirects,
      ),
      startWith(this.router.url),
      distinctUntilChanged(),
    );

  readonly currentUrl = toSignal(
    this.currentUrl$,
    {
      requireSync: true,
    },
  );
}