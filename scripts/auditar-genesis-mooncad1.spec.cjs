#!/usr/bin/env node
'use strict';
/** Legacy entrypoint: MOONCAD.1 remains exported for historical lab fixtures.
 * The visible fiche/scene contract is MOONCAD.3; the MOONCAD.2
 * auditor still checks historic pure V2 calculations and current integration.
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../src/app/presentation/system/system-scene-secondary-motion.ts'), 'utf8');
assert.match(source, /export const SCIENTIFIC_MOON_OUTERMOST_CYCLE_REAL_SECONDS_V1\s*=\s*90/);
assert.match(source, /export function scientificMoonGroupDaysPerRealSecondV1/);
assert.match(source, /export function systemSceneMoonGroupPresentationTimeScaleV1/);
require('./auditar-genesis-mooncad2.spec.cjs');
console.log('PASS GENESIS MOONCAD.1 — API histórica conservada, integración visual verificada por MOONCAD.2/3');
