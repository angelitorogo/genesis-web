const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/app/presentation/system/system-scene-planet-surface-vegetation-visbio1d.spec.ts');
const source = fs.readFileSync(file, 'utf8');
const required = [
  "it('follows weighted palette dominance instead of treating every tone equally'",
  'expect(coolAvg[2]).toBeGreaterThan(warmAvg[2] + 8)',
  'expect(warmAvg[0]).toBeGreaterThan(coolAvg[0] + 8)',
];
for (const fragment of required) {
  if (!source.includes(fragment)) {
    throw new Error(`VISBIO.1d.3: falta la aserción requerida: ${fragment}`);
  }
}
if (source.includes('expect(coolAvg[2] - coolAvg[0]).toBeGreaterThan(-4)')) {
  throw new Error('VISBIO.1d.3: se conserva el antiguo umbral absoluto, dependiente del verde normalizado.');
}
console.log('VISBIO.1d.3 assertion audit passed');
