import {
  env,
} from 'node:process';

import {
  defineConfig,
  devices,
} from '@playwright/test';

const baseURL =
  'http://localhost:4200';

const isCI =
  Boolean(
    env['CI'],
  );

export default defineConfig({
  testDir: './e2e',

  fullyParallel: true,

  forbidOnly:
    isCI,

  retries:
    isCI
      ? 2
      : 0,

  workers:
    isCI
      ? 1
      : undefined,

  reporter: [
    [
      'list',
    ],
    [
      'html',
      {
        outputFolder:
          'playwright-report',

        open:
          'never',
      },
    ],
  ],

  outputDir:
    'test-results',

  use: {
    baseURL,

    trace:
      'on-first-retry',

    screenshot:
      'only-on-failure',

    video:
      'retain-on-failure',
  },

  projects: [
    {
      name:
        'chromium',

      use: {
        ...devices[
          'Desktop Chrome'
        ],
      },
    },
  ],

  webServer: {
    command:
      'npm start -- --port 4200',

    url:
      baseURL,

    reuseExistingServer:
      !isCI,

    timeout:
      120_000,

    stdout:
      'ignore',

    stderr:
      'pipe',
  },
});