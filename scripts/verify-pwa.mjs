import {
  existsSync,
  readFileSync,
} from 'node:fs';
import {
  resolve,
} from 'node:path';

const root =
  resolve(import.meta.dirname, '..');

const manifestPath =
  resolve(
    root,
    'public/manifest.webmanifest',
  );

const ngswConfigPath =
  resolve(
    root,
    'ngsw-config.json',
  );

const indexPath =
  resolve(
    root,
    'src/index.html',
  );

const appConfigPath =
  resolve(
    root,
    'src/app/app.config.ts',
  );

const angularJsonPath =
  resolve(
    root,
    'angular.json',
  );

const buildPath =
  resolve(
    root,
    'dist/genesis-web/browser',
  );

const errors = [];

function check(
  condition,
  message,
) {
  if (!condition) {
    errors.push(message);
  }
}

function readJson(path) {
  return JSON.parse(
    readFileSync(path, 'utf8'),
  );
}

check(
  existsSync(manifestPath),
  'Falta public/manifest.webmanifest.',
);

check(
  existsSync(ngswConfigPath),
  'Falta ngsw-config.json.',
);

check(
  existsSync(indexPath),
  'Falta src/index.html.',
);

check(
  existsSync(appConfigPath),
  'Falta app.config.ts.',
);

check(
  existsSync(angularJsonPath),
  'Falta angular.json.',
);

if (existsSync(manifestPath)) {
  const manifest =
    readJson(manifestPath);

  check(
    manifest.name === 'GENESIS Web',
    'El nombre PWA debe ser GENESIS Web.',
  );

  check(
    manifest.short_name === 'GENESIS',
    'short_name debe ser GENESIS.',
  );

  check(
    manifest.display === 'standalone',
    'La PWA debe usar display=standalone.',
  );

  check(
    manifest.start_url === '/',
    'start_url debe ser "/".',
  );

  check(
    manifest.scope === '/',
    'scope debe ser "/".',
  );

  check(
    manifest.theme_color === '#05070d',
    'theme_color no coincide con GENESIS.',
  );

  check(
    manifest.background_color ===
      '#05070d',
    'background_color no coincide con GENESIS.',
  );

  check(
    Array.isArray(manifest.icons) &&
      manifest.icons.length >= 2,
    'El manifest debe declarar iconos PWA.',
  );

  for (const icon of manifest.icons ?? []) {
    const iconPath =
      resolve(
        root,
        'public',
        icon.src,
      );

    check(
      existsSync(iconPath),
      `No existe el icono ${icon.src}.`,
    );
  }
}

if (existsSync(ngswConfigPath)) {
  const ngswConfig =
    readJson(ngswConfigPath);

  check(
    ngswConfig.index === '/index.html',
    'ngsw-config debe usar /index.html.',
  );

  const appShell =
    ngswConfig.assetGroups?.find(
      (group) =>
        group.name ===
        'genesis-app-shell',
    );

  check(
    Boolean(appShell),
    'Falta genesis-app-shell.',
  );

  if (appShell) {
    check(
      appShell.installMode === 'prefetch',
      'El app shell debe usar prefetch.',
    );

    check(
      appShell.resources?.files?.includes(
        '/*.js',
      ),
      'El app shell debe cachear JavaScript.',
    );

    check(
      appShell.resources?.files?.includes(
        '/*.css',
      ),
      'El app shell debe cachear CSS.',
    );
  }
}

if (existsSync(indexPath)) {
  const index =
    readFileSync(
      indexPath,
      'utf8',
    );

  check(
    index.includes(
      'rel="manifest"',
    ),
    'index.html no referencia el manifest.',
  );

  check(
    index.includes(
      'name="theme-color"',
    ),
    'index.html no declara theme-color.',
  );
}

if (existsSync(appConfigPath)) {
  const appConfig =
    readFileSync(
      appConfigPath,
      'utf8',
    );

  check(
    appConfig.includes(
      'provideServiceWorker',
    ),
    'El service worker no está registrado.',
  );

  check(
    appConfig.includes(
      'enabled: !isDevMode()',
    ),
    'El service worker debe desactivarse en desarrollo.',
  );
}

if (existsSync(angularJsonPath)) {
  const angularJson =
    readJson(angularJsonPath);

  const serviceWorker =
    angularJson
      .projects
      ?.['genesis-web']
      ?.architect
      ?.build
      ?.options
      ?.serviceWorker;

  check(
    serviceWorker ===
      'ngsw-config.json',
    'angular.json no apunta a ngsw-config.json.',
  );
}

if (existsSync(buildPath)) {
  const ngswWorker =
    resolve(
      buildPath,
      'ngsw-worker.js',
    );

  const ngswManifest =
    resolve(
      buildPath,
      'ngsw.json',
    );

  const builtManifest =
    resolve(
      buildPath,
      'manifest.webmanifest',
    );

  check(
    existsSync(ngswWorker),
    'El build no contiene ngsw-worker.js.',
  );

  check(
    existsSync(ngswManifest),
    'El build no contiene ngsw.json.',
  );

  check(
    existsSync(builtManifest),
    'El build no contiene manifest.webmanifest.',
  );

  if (existsSync(ngswManifest)) {
    const generated =
      readJson(ngswManifest);

    const hashedFiles =
      Object.keys(
        generated.hashTable ?? {},
      );

    check(
      hashedFiles.includes(
        '/index.html',
      ),
      'ngsw.json no contiene index.html.',
    );

    check(
      hashedFiles.some(
        (path) =>
          path.endsWith('.js'),
      ),
      'ngsw.json no contiene bundles JS.',
    );

    check(
      hashedFiles.some(
        (path) =>
          path.endsWith('.css'),
      ),
      'ngsw.json no contiene bundles CSS.',
    );
  }
}

if (errors.length > 0) {
  console.error(
    '\nGENESIS PWA verification FAILED.\n',
  );

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  console.error('');

  process.exit(1);
}

console.log('');
console.log(
  'GENESIS PWA verification PASSED.',
);
console.log(
  'Manifest: OK',
);
console.log(
  'Service worker config: OK',
);
console.log(
  'App shell: OK',
);

if (existsSync(buildPath)) {
  console.log(
    'Production service worker: OK',
  );
} else {
  console.log(
    'Production build not found yet.',
  );
}

console.log('');