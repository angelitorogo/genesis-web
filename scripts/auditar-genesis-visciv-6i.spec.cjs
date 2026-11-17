const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(__dirname, '../src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts');
const source = fs.readFileSync(file, 'utf8');

const requiredTokens = [
  'VISCIV6i monumental orbital superstructure',
  'VISCIV6i deck levels',
  'VISCIV6i great orbital nodes',
  'VISCIV6i habitat districts',
  'VISCIV6i industrial shipyards',
  'VISCIV6i transport corridors',
  'addMonumentalOrbitalArchitectureVISCIV6i',
];

for (const token of requiredTokens) {
  if (!source.includes(token)) {
    throw new Error(`VISCIV.6i: no se ha encontrado el marcador requerido: ${token}`);
  }
}

console.log('VISCIV.6i audit: PASS');
