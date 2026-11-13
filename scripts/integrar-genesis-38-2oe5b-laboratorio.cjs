'use strict';
/**
 * GENESIS 38.2o.e5b — integrador conservador del índice de Laboratorio.
 * El paquete no tiene el código original del índice del usuario. Este script
 * lo localiza y modifica únicamente si encuentra patrones inequívocos.
 * Sin scripts PowerShell ni modificaciones de package.json.
 */
const fs = require('node:fs');
const path = require('node:path');

const marker = 'VIDA38_2OE5B_LAB_INDEX';
const routePath = 'laboratorio/reptilianos-civilizados';
const page = 'src/app/presentation/life-species-visual/vida38-reptilian-gallery-laboratory-38-2oe5b.component.ts';
const componentName = 'Vida38ReptilianGalleryLaboratory38OE5BComponent';
const relativeToRoot = filename => path.relative(process.cwd(), filename).replaceAll('\\', '/');

function walk(directory, results) {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.angular') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, results);
    else if (/\.(ts|html)$/.test(entry.name) && !/\.spec\.ts$/.test(entry.name)) results.push(absolute);
  }
}

function discoverIndex(projectRoot) {
  const files = [];
  walk(path.join(projectRoot, 'src/app'), files);
  const candidates = files.filter(f => {
    const source = fs.readFileSync(f, 'utf8');
    return source.includes('Los laboratorios muestran únicamente sistemas ya implementados') &&
      source.includes('<') && (source.includes('</div>') || source.includes('</section>'));
  });
  if (candidates.length !== 1) {
    throw new Error(`No se ha identificado de forma única el índice de Laboratorio (candidatos: ${candidates.map(relativeToRoot).join(', ') || 'ninguno'}). No se ha modificado nada. Adjunta el componente que contiene las cinco tarjetas para una integración exacta.`);
  }
  return candidates[0];
}

function discoverRoutes(projectRoot) {
  const best = path.join(projectRoot, 'src/app/app.routes.ts');
  const files = [];
  walk(path.join(projectRoot, 'src/app'), files);
  const possible = files.filter(f => /(?:^|[\\/])[^\\/]*routes\.ts$/.test(f) &&
    /\b(?:export\s+)?const\s+\w+\s*:\s*Routes\s*=\s*\[/.test(fs.readFileSync(f, 'utf8')));
  if (fs.existsSync(best) && possible.includes(best)) return best;
  if (possible.length === 1) return possible[0];
  throw new Error(`No puedo identificar una configuración de rutas Angular segura (candidatos: ${possible.map(relativeToRoot).join(', ') || 'ninguno'}). No se ha modificado nada.`);
}

function insertRoute(source, routesFile, projectRoot) {
  if (source.includes(routePath)) return source;
  const routesRx = /\b(?:export\s+)?const\s+\w+\s*:\s*Routes\s*=\s*\[/;
  const match = routesRx.exec(source);
  if (!match) throw new Error('No se encontró un array de rutas Angular compatible.');
  const relative = path.relative(path.dirname(routesFile), path.join(projectRoot, page))
    .replaceAll('\\', '/').replace(/\.ts$/, '');
  const importPath = relative.startsWith('.') ? relative : `./${relative}`;
  const block = `\n  // ${marker}: acceso directo desde el índice de Laboratorio.\n  {\n    path: '${routePath}',\n    loadComponent: () => import('${importPath}').then(m => m.${componentName}),\n  },`;
  const index = match.index + match[0].length;
  return `${source.slice(0, index)}${block}${source.slice(index)}`;
}

function insertCard(source) {
  if (source.includes(marker)) return source;
  const anchor = source.indexOf('Los laboratorios muestran únicamente sistemas ya implementados');
  if (anchor < 0) throw new Error('El índice no contiene el texto de referencia.');
  // Colocación dentro del último contenedor antes de la nota final, donde
  // suelen vivir las tarjetas. Si el DOM no es reconocible, fallar cerrado.
  const left = source.slice(0, anchor);
  const closings = [...left.matchAll(/<\/(?:div|section)\s*>/g)];
  const last = closings.at(-1);
  if (!last || anchor - last.index > 4000) throw new Error('Estructura HTML del índice no reconocida.');
  const insertionPoint = last.index;
  const card = `\n        <!-- ${marker}: sexta entrada del laboratorio -->\n        <a href="/${routePath}" data-testid="vida38-oe5b-laboratory-entry"\n          style="display:flex;flex-direction:column;gap:1rem;justify-content:space-between;min-height:205px;padding:1.25rem 1.45rem;border:1px solid rgba(76,182,232,.28);border-radius:16px;background:#0c1320;color:#eef8ff;text-decoration:none;">\n          <div>\n            <small style="color:#55ccff;letter-spacing:.11em;font-size:.68rem;font-weight:700;">FASE 38 · VIDA / THREE.JS</small>\n            <h3 style="margin:.65rem 0 .45rem;color:#f4faff;font-size:1.3rem;">Reptilianos civilizados</h3>\n            <p style="line-height:1.6;color:#98b0ca;margin:.25rem 0;">Galería comparativa de 12 o 24 especies muy avanzadas, con anatomía, trajes y accesorios deterministas. Abre cada ejemplar en el visor 3D.</p>\n          </div>\n          <span style="color:#53d1fb;font-size:.78rem;font-weight:700;">Abrir laboratorio →</span>\n        </a>\n`;
  return `${source.slice(0, insertionPoint)}${card}${source.slice(insertionPoint)}`;
}

function integrate(projectRoot, { checkOnly = false } = {}) {
  const abs = path.join(projectRoot, page);
  if (!fs.existsSync(abs)) throw new Error('Falta la página independiente 38.2o.e5b. Extrae primero el ZIP en la raíz del proyecto.');
  const preview = path.join(projectRoot, 'src/app/presentation/life-species-visual/life-species-visual-preview.ts');
  const gal = path.join(projectRoot, 'src/app/presentation/life-species-visual/vida38-reptilian-gallery-38-2oe5.component.ts');
  if (!fs.existsSync(preview) || !fs.existsSync(gal)) throw new Error('Falta la galería 38.2o.e5 original. Instálala antes de este hotfix.');
  const routesFile = discoverRoutes(projectRoot);
  const indexFile = discoverIndex(projectRoot);
  const beforeRoutes = fs.readFileSync(routesFile, 'utf8');
  const beforeIndex = fs.readFileSync(indexFile, 'utf8');
  const newRoutes = insertRoute(beforeRoutes, routesFile, projectRoot);
  const newIndex = insertCard(beforeIndex);
  if (checkOnly) return { routesFile: relativeToRoot(routesFile), indexFile: relativeToRoot(indexFile), unchanged: true };
  const backupRoot = path.join(projectRoot, 'docs/audits/38-2oe5b/backups');
  fs.mkdirSync(backupRoot, { recursive: true });
  if (beforeRoutes !== newRoutes) {
    const backup = path.join(backupRoot, relativeToRoot(routesFile).replaceAll('/', '__') + '.before.txt');
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, beforeRoutes);
    fs.writeFileSync(routesFile, newRoutes);
  }
  if (beforeIndex !== newIndex) {
    const backup = path.join(backupRoot, relativeToRoot(indexFile).replaceAll('/', '__') + '.before.txt');
    if (!fs.existsSync(backup)) fs.writeFileSync(backup, beforeIndex);
    fs.writeFileSync(indexFile, newIndex);
  }
  return { routesFile: relativeToRoot(routesFile), indexFile: relativeToRoot(indexFile), unchanged: beforeRoutes === newRoutes && beforeIndex === newIndex };
}

if (require.main === module) {
  try {
    const result = integrate(process.cwd(), { checkOnly: process.argv.includes('--check') });
    console.log('GENESIS_38_2OE5B_LAB_INDEX_OK', JSON.stringify(result));
    if (process.argv.includes('--check')) console.log('Comprobación: sin cambios de archivos.');
    else console.log('Acceso registrado: /' + routePath);
  } catch (err) {
    console.error('GENESIS_38_2OE5B_NO_APLICADO:', err.message);
    process.exitCode = 1;
  }
}
module.exports = { integrate, insertCard, insertRoute };
