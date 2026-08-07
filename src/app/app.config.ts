import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideServiceWorker,
} from '@angular/service-worker';

import { genesisRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(genesisRoutes),

    provideServiceWorker(
      'ngsw-worker.js',
      {
        enabled: !isDevMode(),

        registrationStrategy:
          'registerWhenStable:30000',
      },
    ),
  ],
};