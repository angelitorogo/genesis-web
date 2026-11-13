#!/usr/bin/env node
/** GENESIS 38.2j.a — auditoría estructural sin dependencias externas. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const filename = path.join(__dirname, '../src/app/presentation/life-species-visual/vida38-reptile-materials-38-2j.ts');
const code = fs.readFileSync(filename, 'utf8');
assert.match(code, /VIDA38_REPTILE_MATERIAL_REVISION='VIDA\.38\.2j\.a\//);
assert.match(code, /transparent:false,opacity:1,alphaTest:0,depthWrite:true,depthTest:true,colorWrite:true/);
assert.match(code, /material\.customProgramCacheKey=\(\)=>VIDA38_REPTILE_MATERIAL_REVISION/);
const color = code.match(/shader\.fragmentShader=shader\.fragmentShader\.replace\('#include <color_fragment>',`([\s\S]*?)`\);/);
const roughness = code.match(/shader\.fragmentShader=shader\.fragmentShader\.replace\('#include <roughnessmap_fragment>',`([\s\S]*?)`\);/);
assert.ok(color, 'No existe bloque de pigmentación');
assert.ok(roughness, 'No existe bloque de rugosidad');
for (const [label, insertion] of [['pigmentación', color[1]], ['rugosidad', roughness[1]]]) {
  assert.match(insertion, /#include <\w+_fragment>\s*\/\/[^\n]*\n\s*\{/,
    `${label}: no comienza ámbito GLSL aislado`);
  assert.match(insertion, /\n\s*\}\s*$/, `${label}: no cierra ámbito GLSL aislado`);
  assert.match(insertion, /vec3 p\s*=/, `${label}: falta p`);
  assert.match(insertion, /vec3 n\s*=/, `${label}: falta n`);
  assert.match(insertion, /float dorsal\s*=/, `${label}: falta dorsal`);
}
assert.match(color[1], /diffuseColor\.rgb\*=bio/);
assert.match(roughness[1], /roughnessFactor=clamp/);
assert.match(code, /vida38ReptileScaleMask/);
assert.match(code, /fwidth/);
assert.ok(!code.includes('gl_FragCoord'));
assert.ok(!code.includes('discard;'));
console.log('GENESIS_38_2JA_MATERIAL_VISIBLE_AUDIT_OK');
