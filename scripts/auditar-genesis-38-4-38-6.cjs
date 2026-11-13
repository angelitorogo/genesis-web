#!/usr/bin/env node
'use strict';
/*
 * GENESIS 38.4–38.6: auditoría de evidencia SIN modificar el proyecto.
 * No confunde la presencia textual de un identificador con un contrato verificado.
 * Node.js puro; compatible con un proyecto sin conexión a Internet.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.resolve(process.cwd());
const OUT = path.join(ROOT, 'docs', 'audits', '38-4-6');
const FILE_TYPES = new Set(['.ts', '.html']);
const OMIT = new Set(['node_modules', 'dist', '.angular', '.git', 'coverage', 'playwright-report', 'test-results']);

function enumerate(folder, result = []) {
  if (!fs.existsSync(folder)) return result;
  for (const ent of fs.readdirSync(folder, {withFileTypes: true})) {
    if (OMIT.has(ent.name)) continue;
    const full = path.join(folder, ent.name);
    if (ent.isDirectory()) enumerate(full, result);
    else if (ent.isFile() && FILE_TYPES.has(path.extname(ent.name)) && !/\.(spec|test)\.ts$/i.test(ent.name)) result.push(full);
  }
  return result;
}
function fingerprint(files) {
  const hash = crypto.createHash('sha256');
  for (const file of files) {
    const relative = path.relative(ROOT, file).replaceAll('\\','/');
    hash.update(relative); hash.update('\0');hash.update(fs.readFileSync(file));hash.update('\0');
  }
  return hash.digest('hex');
}
const files = enumerate(path.join(ROOT, 'src', 'app')).sort();
const rows = files.map(file => ({ file: path.relative(ROOT, file).replaceAll('\\','/'), lines: fs.readFileSync(file, 'utf8').split(/\r?\n/) }));
const SPECIES = rows.filter(r => /life-species-visual|species-visual|vida38/i.test(r.file));
const GAME = rows.filter(r => /species|civiliz|vida|life|system|planet|moon|stellar|galaxy|scene/i.test(r.file));
const CANDIDATES = rows.filter(r => /species|civiliz|life|vida|planet|moon|system|scene|settle|coloni|station/i.test(r.file));
const shrink = s => s.replace(/\s+/g,' ').trim().slice(0,260);
function collect(haystack, re, limit = 15) {
  const items=[];
  for(const r of haystack) {
    for(let i=0;i<r.lines.length;i++) {
      const line = r.lines[i];
      if(re.test(line)) items.push({file:r.file,line:i+1,excerpt:shrink(line)});
      if(items.length>=limit)return items;
    }
  }
  return items;
}
function result(id, state, summary, evidence, next) {
  return {id,state,summary,evidence,next};
}
const hasAny = (arr) => arr.length > 0;
const checks=[];

// 38.4 — determinismo: pruebas estáticas limitadas, nunca equivalen a repetición byte a byte.
const seedRefs=collect(SPECIES, /speciesId|appearanceFingerprint|variantSeedUint32/i, 18);
const unstable=collect(SPECIES, /\bMath\.random\s*\(|\bcrypto\.randomUUID\s*\(/, 15);
const generators=collect(SPECIES, /hash32\(|hashVida38|deriveVida38.*Plan|new Rng\(/, 12);
const spatial=collect(SPECIES, /spatialVariant|spatial.*variant|variant.*spatial|variation.*space|rasgos.*suficientes|variantSeedUint32/i, 15);
checks.push(result('38.4.determinismo', hasAny(seedRefs)&&hasAny(generators)&&!hasAny(unstable)?'INDICIOS':'REVISAR',
 'El uso de semillas/ID es rastreable; falta comparar dos reconstrucciones reales y comprobar estabilidad tras serializar/restaurar.',[...seedRefs.slice(0,5),...generators.slice(0,5),...unstable],
 'Ejecutar Vitest CT-0 con 2 modelos del mismo contrato y comparar geometría/materiales/plan. Revisar cualquier Math.random de las rutas productivas.'));
checks.push(result('38.4.variantes-espaciales','REVISAR',
 'La presencia de variantSeedUint32 NO demuestra que las variantes dependan de rasgos biológicos suficientes.',spatial.slice(0,12),
 'Inspeccionar el mapper contrato VIDA→render: mismo ID y rasgos idénticos deben mantener apariencia aunque cambie la localización; variante distinta solo con evidencia biológica explícita.'));

// 38.5 — se auditan fichas reales, no galerías de laboratorio ni solamente la existencia de datos VIDA.
const CARD = CANDIDATES.filter(r => /card|ficha|detail|panel|species|civiliz/i.test(r.file) && !/fixtures|gallery|laborator|preview-scene/i.test(r.file));
const labels = {
 origen: /\borigen\b|\bprocedencia\b|\borigin\b/i,
 ecosistema: /\becosistema\b|\becology\b|\bhabitat\b/i,
 relaciones: /\brelaciones\b|\brelaci[oó]n\b|\binteracciones\b|\brelationships\b/i,
 cultura: /\bcultura\b|\bculture\b/i,
 tecnologia: /\btecnolog[ií]a\b|\btechnology\b|\btechnological\b/i,
};
for (const [name,re] of Object.entries(labels)) {
  const matches=collect(CARD,re,6);
  checks.push(result(`38.5.${name}`,hasAny(matches)?'REVISAR':'SIN_EVIDENCIA',
    hasAny(matches)?`Se ha encontrado referencia a ${name}, pero hay que comprobar idioma visible, fuente VIDA y nivel de conocimiento.`:`No se ha localizado el bloque ${name} en candidatos de ficha.`,matches,
    'Validar en fichas de especie y civilización reales: texto español, propiedad VIDA trazable, nulos explícitos y no revelar datos no observados.'));
}
const gameVIDA=collect(CARD,/VIDA\.6|VIDA\.7|VIDA\.8|vida6|vida7|vida8|biosphere|ecosystem|civilization|civilisation/i,12);
checks.push(result('38.5.procedencia-vida',hasAny(gameVIDA)?'REVISAR':'SIN_EVIDENCIA',
 'La representación no debe sustituir culturas/roles persistidos de VIDA por roles generados para laboratorio.',gameVIDA,
 'Trazar campos de ficha a VIDA.6/VIDA.7 y verificar que los labels de laboratorio LAB_ONLY nunca aparecen como conocimiento observado.'));

// 38.6 — evidencia estructural, no aprobación automática basada en regex.
const LIGHT = GAME.filter(r=>!/fixtures|gallery|laborator|spec\.ts/i.test(r.file));
const topics = [
 ['luces',/night.?light|city.?light|night.?side|luces.?nocturnas|nightLights|nighttime/i],
 ['asentamientos',/settlement|asentamiento/i],
 ['colonias',/\bcolon(?:y|ies|ia|ias|ization|isation|izaci[oó]n)\b/i],
 ['estaciones',/space.?station|orbital.?station|station.?orbital|estaci[oó]n(?:es)?\s+orbital/i]
];
for (const [name,re] of topics) {
 const matches=collect(LIGHT,re,12);
 checks.push(result(`38.6.${name}`,hasAny(matches)?'REVISAR':'SIN_EVIDENCIA',
   hasAny(matches)?`Encontradas referencias a ${name}; aún hay que probar la condición científica exacta que habilita el dibujo.`:`No se han localizado referencias a ${name} en el código disponible.`,matches,
   'Revisar render + fuente de datos: construir solo con evidencia VIDA.8/37 y conocimiento permitido; si falta evidencia, 0 objetos visibles.'));
}
const validation=collect(LIGHT,/VIDA\.8|vida8|vida37|technosignature|tecnofirma|civilizationLevel|civilizationTier|colonization|settlement|observedKnowledge|discovered|confirmed/i, 22);
checks.push(result('38.6.gates-conocimiento','REVISAR',
 'La existencia de campos VIDA.8/37 no prueba que el dibujo quede condicionado por ellos; se requieren tests positivos y negativos.',validation,
 'Crear fixture sin civilización/colonización: 0 luces y estructuras; fixture con justificación y conocimiento: aparecen exactamente los elementos autorizados.'));

const report={
  revision:'GENESIS/38.4-38.6/auditoria-evidencia-v1',
  generatedAt:new Date().toISOString(),
  projectRoot:ROOT,
  sourceFingerprintSHA256:fingerprint(files),
  filesReviewed:files.length,
  scope:'Auditoría estática de evidencia: NO certifica semántica en runtime ni hace cambios visuales',
  states:{INDICIOS:'Se encontraron señales técnicas, pero aún requiere prueba de comportamiento',REVISAR:'Hay que contrastar condiciones reales',SIN_EVIDENCIA:'No se localizó evidencia suficiente'},
  checks,
  conclusion:checks.every(c=>c.state==='INDICIOS')?'REQUIERE_TESTS_RUNTIME':'CIERRE_NO_CERTIFICADO'
};
fs.mkdirSync(OUT,{recursive:true});
const json=path.join(OUT,'38-4-6-auditoria-evidencia.json');
fs.writeFileSync(json,JSON.stringify(report,null,2)+'\n');
const lines=[
 '# GENESIS · Auditoría de evidencia 38.4–38.6',
 '', `Fecha: ${report.generatedAt}`, `Archivos revisados: ${report.filesReviewed}`,
 `Huella SHA-256 del código examinado: \`${report.sourceFingerprintSHA256}\``,
 '', '> La detección estática NO certifica cumplimiento. Ninguna fase se declara cerrada automáticamente.',
 '', '| Requisito | Estado | Observación |', '|---|---|---|',
 ...checks.map(c=>`| ${c.id} | ${c.state} | ${c.summary.replace(/\|/g,'/')} |`),
 '', '## Evidencias por archivo y línea',
 ...checks.flatMap(c=>['',`### ${c.id}`,...(c.evidence.length?c.evidence.map(e=>`- \`${e.file}:${e.line}\`: ${e.excerpt.replace(/`/g,"'")}`):['- Sin evidencias localizadas']),`- **Pendiente:** ${c.next}`]),
 '', '## Criterio de cierre',
 '38.4 requiere dos renders con igual contrato y resultados equivalentes y una prueba negativa de variante espacial injustificada.',
 '38.5 requiere cinco bloques en español, trazabilidad VIDA y separación de conocimiento observado.',
 '38.6 requiere casos positivos y negativos de VIDA.8/37 en cada categoría (luces, estaciones, colonias, asentamientos).',
 'No se modificaron los nueve renderers de civilizaciones.'
];
fs.writeFileSync(path.join(OUT,'38-4-6-auditoria-evidencia.md'),lines.join('\n')+'\n');
console.log(JSON.stringify({filesReviewed:report.filesReviewed,sourceFingerprintSHA256:report.sourceFingerprintSHA256,conclusion:report.conclusion,states:Object.fromEntries(checks.map(c=>[c.id,c.state])),output:json},null,2));
if (!files.length) process.exitCode=2;
