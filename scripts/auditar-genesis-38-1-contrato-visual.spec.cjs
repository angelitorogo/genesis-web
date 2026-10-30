#!/usr/bin/env node
'use strict';
/** Auditoría autocontenida del contrato 38.1, sin tocar IndexedDB ni VIDA. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');

const sourcePath = path.resolve('src/app/presentation/life-species-visual/vida38-species-visual-contract.ts');
const fichePath = path.resolve('src/app/presentation/life-species-detail/life-species-detail.ts');
const specPath = path.resolve('src/app/presentation/life-species-visual/vida38-species-visual-contract.spec.ts');
for (const file of [sourcePath, fichePath, specPath]) {
  assert.ok(fs.existsSync(file), `Falta archivo: ${file}`);
}
const ts = require('typescript'); // dependencia de desarrollo ya instalada en GENESIS
const oldTsLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => {
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
    reportDiagnostics: true,
  });
  const errors = (compiled.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error);
  assert.equal(errors.length, 0, `Errores de sintaxis TypeScript en ${filename}`);
  module._compile(compiled.outputText, filename);
};

try {
  const {
    VIDA38_SPECIES_VISUAL_REVISION,
    vida38SpeciesVisualContractFromConfirmedV1: resolve,
  } = require(sourcePath);
  const { VIDA6_REVISION } = require(path.resolve('src/app/domain/life/vida6-ecosystems-species.ts'));
  const { VIDA7_REVISION } = require(path.resolve('src/app/domain/life/vida7-intelligence-civilizations.ts'));
  const { VIDA9_REVISION } = require(path.resolve('src/app/domain/life/vida9-biology-exploration.ts'));

  const sample = (id, group, bodyPlan, covering, locomotion, bodyLengthMeters, habitat, appendagePairs) => ({
    id: `vida6:${id}`, proceduralName: id, group, habitat,
    nutrition: 'OMNIVORE', niche: `${habitat}/OMNIVORE`,
    adaptations: ['SENSORY_ORIENTATION'],
    phenotype: {
      bodyPlan, covering, locomotion, bodyLengthMeters, appendagePairs,
      pattern: 'SPOTS', primaryColorHex: '#AABBCC', secondaryColorHex: '#443322',
      bioluminescent: false,
    },
  });
  const cases = [
    sample('Tesyl al1','MICROORGANISMS','CELL_COLONY','MEMBRANE','SESSILE',0.0000082117,'SURFACE_ROCK_SHELTER',0),
    sample('Isvar al2','FUNGI','FILAMENTOUS','FIBROUS','SESSILE',0.11808,'SURFACE_SOIL',0),
    sample('Kathar ix2','PLANTS_TREES','STEMMED','FIBROUS','SESSILE',3.2142,'SURFACE_WET_MARGIN',0),
    sample('Lovor um1','INSECTS','ARTHROPOD','CHITINOUS','FLYING',0.035307,'SURFACE_SOIL',3),
    sample('Loquor en2','REPTILES','TETRAPOD','SCALES','WALKING',0.44822,'SURFACE_OPEN_TERRAIN',2),
    sample('Zudros is1','BIRDS','WINGED','FEATHERS','FLYING',0.30942,'SURFACE_AIR',2),
    sample('Arvar um6','MAMMALS','TETRAPOD','FUR','WALKING',0.7108,'SURFACE_OPEN_TERRAIN',2),
    sample('Sania on1','HUMANOIDS','BIPED','LEATHERY','WALKING',1.6126,'SURFACE_SOIL',2),
  ];
  const record = (species, intelligentSpecies = null, civilization = null) => ({
    revision: VIDA9_REVISION, epoch: 'CT-0', bodyStorageKey: 'audit:planet',
    ecosystem: { revision: VIDA6_REVISION, bodyStorageKey: 'audit:planet', digest: 'ecosystem:audit', species },
    intelligence: { revision: VIDA7_REVISION, ecosystemDigest: 'ecosystem:audit', intelligentSpecies, civilization },
  });
  for (const species of cases) {
    const source = record([species]);
    const a = resolve(source, species.id);
    const b = resolve(source, species.id);
    assert.ok(a, `No se generó contrato para ${species.group}`);
    assert.equal(a.revision, VIDA38_SPECIES_VISUAL_REVISION);
    assert.deepEqual(a, b, 'No es determinista');
    assert.equal(a.morphology.group, species.group);
    assert.equal(a.morphology.bodyPlan, species.phenotype.bodyPlan);
    assert.equal(a.bodyLengthMeters, species.phenotype.bodyLengthMeters);
    assert.equal(a.locomotion, species.phenotype.locomotion);
    assert.equal(a.pigmentation.primaryColorHex, species.phenotype.primaryColorHex);
    assert.equal(a.provenance.observedImageAvailable, false);
    assert.equal(a.intelligence, null);
    assert.equal(resolve(source, 'vida6:unknown'), null);
    assert.ok(Object.isFrozen(a));
  }
  const founder = sample('Ismera on7','REPTILES','TETRAPOD','SCALES','WALKING',1.527,'SURFACE_WET_MARGIN',2);
  const other = cases[4];
  const intelligent = {speciesId: founder.id, lineage:'REPTILIAN'};
  const civilization = {founderSpeciesId: founder.id,lineage:'REPTILIAN',tier:'VERY_ADVANCED'};
  const family = record([founder,other], intelligent, civilization);
  assert.deepEqual(resolve(family, founder.id).intelligence, {lineage:'REPTILIAN',civilizationTier:'VERY_ADVANCED'});
  assert.equal(resolve(family, other.id).intelligence, null);
  assert.equal(resolve(null, founder.id), null);
  assert.equal(resolve({...family,bodyStorageKey:'other'},founder.id), null);
  assert.equal(resolve({...family,epoch:'OTHER'},founder.id), null);
  assert.equal(resolve(record([{...founder,phenotype:{...founder.phenotype,bodyLengthMeters:0}}]),founder.id), null);

  const ficheText = fs.readFileSync(fichePath, 'utf8');
  assert.ok(ficheText.includes('vida38SpeciesVisualContractFromConfirmedV1(this.registro()'),
    'La ficha no utiliza el contrato desde su registro confirmado');
  assert.ok(ficheText.includes('data-testid="vida38-contrato-visual"'));
  console.log('VIDA38_1_VISUAL_CONTRACT_AUDIT_OK (8 grupos, determinismo, fundador, acceso, integridad, ficha)');
} finally {
  if (oldTsLoader) require.extensions['.ts'] = oldTsLoader;
  else delete require.extensions['.ts'];
}
