'use strict';
/** GENESIS 38.8 — audit portable, sin Angular ni dependencias nuevas. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let checks = 0;
const verify = (condition, message) => { assert.ok(condition, message); checks++; };

const contract = read('src/app/presentation/visual-provenance/genesis-visual-provenance-38-8.ts');
const scene = read('src/app/presentation/system/system-scene.ts');
const preview = read('src/app/presentation/scientific-body-preview/scientific-body-preview.ts');
const species = read('src/app/presentation/life-species-visual/vida38-species-visual-preview-scene.ts');
const infra = read('src/app/presentation/infrastructure/vida38-infrastructure-render-38-6.ts');
const speciesGrant = read('src/app/presentation/life-species-detail/vida38-ficha-conocimiento-38-5.ts');
const sceneGrant = read('src/app/presentation/system/system-scene-civilization-visuals.ts');
const speciesContract = read('src/app/presentation/life-species-visual/vida38-species-visual-contract.ts');

verify(contract.includes('INHERIT_EXISTING_DISCOVERY_AND_CONFIRMATION'), 'La trazabilidad no puede sustituir el permiso');
verify(contract.includes("generation: 'CODE_PROCEDURAL'"), 'Debe seguir la generación procedural');
verify(!contract.includes('fetch(') && !contract.includes('Math.random('), 'No nuevos recursos/aleatoriedad');
for (const kind of ['STAR','PLANET','MOON','ASTEROID','COMET','TRANS_NEPTUNIAN_OBJECT',
  'CAPTURED_EXTRASOLAR_OBJECT','SPECIES','CIVILIZATION','COLONIAL_INFRASTRUCTURE']) {
  verify(contract.includes(`${kind}: fields(`), `Cobertura ausente: ${kind}`);
}
verify(scene.includes("this.scene.userData['genesisVisualTrace38_8']"), 'SystemScene no traza procedencia');
verify(preview.includes("root.userData['genesisVisualTrace38_8']"), 'La ficha científica no traza procedencia');
verify(species.includes("root.userData['genesisVisualTrace38_8']"), 'La especie no traza procedencia');
verify(infra.includes("group.userData['genesisVisualTrace38_8']"), 'La infraestructura no traza procedencia');
verify(infra.includes("plan.provenance === 'VIDA8_COLONIAL_SETTLEMENT'"), 'La infraestructura nativa/colonial debe distinguirse');
verify(speciesGrant.includes('!grant.confirmedSystem'), '38.5 debe continuar exigiendo CONFIRMED');
verify(speciesGrant.includes("FULL_SYSTEM_REVEAL_ON_CONFIRMED"), '38.5 debe conservar revelación total al confirmar');
verify(sceneGrant.includes('ArchiveStellarSystemKnowledgeLevel.CONFIRMED') &&
  sceneGrant.includes('DiscoveryState.CONFIRMED.code'), '38.7x debe conservar la autorización del sistema');
verify(speciesContract.includes("representation: 'SCIENTIFIC_PROCEDURAL_RECONSTRUCTION'"),
  'No sustituir contrato previo VIDA 38.1');
verify(!scene.includes('genesisVisualTrace388(snapshot.proceduralIdentity, snapshot.') &&
  !preview.includes('genesisVisualTrace388(this.model, '), 'No transmitir Ground Truth al motor de procedencia');
console.log(`GENESIS 38.8: ${checks} comprobaciones estáticas superadas.`);
