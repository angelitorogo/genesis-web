import {
  existsSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import {
  dirname,
  extname,
  join,
  relative,
  resolve,
  sep,
} from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');

const appRoot = resolve(projectRoot, 'src/app');

const layers = {
  domain: resolve(appRoot, 'domain'),
  simulation: resolve(appRoot, 'simulation'),
  observation: resolve(appRoot, 'observation'),
  'data/local': resolve(appRoot, 'data/local'),
  presentation: resolve(appRoot, 'presentation'),
  ui: resolve(appRoot, 'ui'),
};

const allowedProjectDependencies = {
  domain: new Set([
    'domain',
  ]),

  simulation: new Set([
    'domain',
    'simulation',
  ]),

  observation: new Set([
    'domain',
    'observation',
  ]),

  'data/local': new Set([
    'domain',
    'observation',
    'data/local',
  ]),

  presentation: new Set([
    'domain',
    'simulation',
    'observation',
    'data/local',
    'presentation',
    'ui',
  ]),

  ui: new Set([
    'ui',
  ]),
};

const angularForbiddenLayers = new Set([
  'domain',
  'simulation',
  'observation',
]);

const errors = [];

function normalizePath(path) {
  return resolve(path);
}

function isInside(path, directory) {
  const normalizedPath = normalizePath(path);
  const normalizedDirectory = normalizePath(directory);

  return (
    normalizedPath === normalizedDirectory ||
    normalizedPath.startsWith(`${normalizedDirectory}${sep}`)
  );
}

function getLayerForPath(path) {
  for (const [layer, directory] of Object.entries(layers)) {
    if (isInside(path, directory)) {
      return layer;
    }
  }

  return null;
}

function collectTypeScriptFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const result = [];

  for (const entry of readdirSync(directory, {
    withFileTypes: true,
  })) {
    const fullPath = join(directory, entry.name);

    if (entry.isDirectory()) {
      result.push(...collectTypeScriptFiles(fullPath));
      continue;
    }

    if (
      entry.isFile() &&
      extname(entry.name) === '.ts'
    ) {
      result.push(fullPath);
    }
  }

  return result;
}

function collectImports(source) {
  const imports = [];

  const pattern =
    /(?:from\s+|import\s*\()\s*['"]([^'"]+)['"]/g;

  let match;

  while ((match = pattern.exec(source)) !== null) {
    imports.push(match[1]);
  }

  return imports;
}

for (const [layer, directory] of Object.entries(layers)) {
  if (!existsSync(directory)) {
    errors.push(
      `Falta la capa obligatoria: ${layer}`,
    );
  }
}

let checkedFiles = 0;

for (const [sourceLayer, directory] of Object.entries(layers)) {
  const files = collectTypeScriptFiles(directory);

  for (const file of files) {
    checkedFiles += 1;

    const source = readFileSync(file, 'utf8');
    const imports = collectImports(source);

    for (const importPath of imports) {
      if (
        angularForbiddenLayers.has(sourceLayer) &&
        importPath.startsWith('@angular/')
      ) {
        errors.push(
          `${relative(projectRoot, file)}: ` +
          `${sourceLayer} no puede depender de Angular ` +
          `(${importPath}).`,
        );

        continue;
      }

      if (!importPath.startsWith('.')) {
        continue;
      }

      const targetPath = resolve(
        dirname(file),
        importPath,
      );

      const targetLayer = getLayerForPath(targetPath);

      if (targetLayer === null) {
        continue;
      }

      const allowed =
        allowedProjectDependencies[sourceLayer];

      if (!allowed.has(targetLayer)) {
        errors.push(
          `${relative(projectRoot, file)}: ` +
          `${sourceLayer} no puede depender de ` +
          `${targetLayer} (${importPath}).`,
        );
      }
    }
  }
}

if (errors.length > 0) {
  console.error('\nGENESIS architecture verification FAILED.\n');

  for (const error of errors) {
    console.error(`- ${error}`);
  }

  console.error('');

  process.exit(1);
}

console.log('');
console.log('GENESIS architecture verification PASSED.');
console.log(`Layers verified: ${Object.keys(layers).length}`);
console.log(`TypeScript files checked: ${checkedFiles}`);
console.log('');