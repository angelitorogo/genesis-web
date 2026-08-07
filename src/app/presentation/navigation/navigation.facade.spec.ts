import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  Routes,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { NavigationFacade } from './navigation.facade';

@Component({
  standalone: true,
  template: '',
})
class TestPage {}

const testRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: TestPage,
  },
  {
    path: 'test',
    component: TestPage,
  },
];

describe('NavigationFacade', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(testRoutes),
      ],
    });
  });

  it('should expose the current route as a signal', async () => {
    await RouterTestingHarness.create('/');

    const facade =
      TestBed.inject(NavigationFacade);

    expect(facade.currentUrl()).toBe('/');
  });

  it('should react to successful navigation', async () => {
    await RouterTestingHarness.create('/');

    const facade =
      TestBed.inject(NavigationFacade);

    const router =
      TestBed.inject(Router);

    await router.navigateByUrl('/test');

    expect(facade.currentUrl()).toBe('/test');
  });
});