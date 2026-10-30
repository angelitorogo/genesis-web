const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
function requireTokens(file, tokens) {
  const name = path.join(root, file);
  if (!fs.existsSync(name)) throw Error(`Falta archivo: ${file}`);
  const source = fs.readFileSync(name, 'utf8');
  for (const token of tokens) {
    if (!source.includes(token)) throw Error(`Falta '${token}' en ${file}`);
  }
}
requireTokens('src/app/presentation/system/system-scene.ts', [
  'systemScenePlanetTextureCacheKeyVISCIV1b(systemIdentity, planet.id, textureWidth, planet.visualCivilizationTier)',
  'downsampleSystemScenePlanetNightLightsV1(',
  'buildSystemScenePlanetNightLightsV1({',
  'textureResource.nightLightsTexture',
]);
requireTokens('src/app/presentation/system/system-scene-planet-civilization-cache-visciv1b.ts', [
  "tier ?? 'NONE'",
  'VISCIV1b:',
]);
requireTokens('src/app/presentation/system/system-scene-planet-night-lights-visciv1.ts', [
  'downsampleSystemScenePlanetNightLightsV1(',
  'bestBrightness',
  'source.cityCount',
]);
requireTokens('src/app/presentation/system/system-scene-civilization-cache-visciv1b.spec.ts', [
  'does not reuse the already-cached uninhabited atlas',
  'preserves the canonical planet night-light geography',
  'primitive settlements',
]);
requireTokens('src/app/presentation/system/system-scene-civilization-visuals.data-source.ts', [
  'extractConfirmedCivilization',
]);
console.log('VISCIV.1b SYSTEM SCENE CACHE AND PARITY AUDIT PASSED');
