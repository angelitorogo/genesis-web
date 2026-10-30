const fs = require('node:fs');
const path = require('node:path');
const root = process.cwd();
const expected = {
  'src/app/presentation/planet-detail/planet-scientific-card.ts': ['resolveConfirmedPlanetCivilizationTierV1', 'confirmedBiologyVIDA9'],
  'src/app/presentation/scientific/scientific-body-preview.ts': ['civilizationStarSources', 'resolvePreviewCivilizationStarSourcesV1', 'nightCivilizationTier'],
  'src/app/presentation/scientific-body-preview/scientific-body-preview.ts': ['visualCivilizationTier', 'updateCivilizationLightBinding'],
  'src/app/presentation/system/system-scene.ts': ['buildSystemScenePlanetNightLightsV1', 'nightLightsTexture', 'nightCivilizationTier'],
  'src/app/presentation/system/system-scene-atmosphere-material.ts': ['uGenesisCivilizationLights', 'genesisDeepNight'],
  'src/app/presentation/system/system-scene-planet-surface-texture.ts': ['nightLandMask', 'nightCivilizationTier'],
  'src/app/presentation/system/system-scene-planet-night-lights-visciv1.ts': ['connectionCount', 'buildSystemScenePlanetNightLightsV1'],
};
for (const [file, markers] of Object.entries(expected)) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  for (const marker of markers) if (!content.includes(marker)) throw new Error(`${file}: missing ${marker}`);
}
console.log('VISCIV.1: contracts, isolation, shader integration and deterministic atlas PASS');
