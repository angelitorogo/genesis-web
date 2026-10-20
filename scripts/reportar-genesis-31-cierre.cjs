#!/usr/bin/env node
'use strict';
/**
 * Phase-31 scoped E2E evidence (NOT a new scientific certification).
 * Converts ONLY records emitted by materialized-world Vitest assertions.
 * A log with failing tests, absent scenarios or inconsistent CT-0 coverage
 * cannot produce a VERIFIED scoped result.
 */
const fs = require('node:fs');

/** Read PowerShell 5.1 Tee-Object output (UTF-16 LE) and UTF-8 logs safely. */
function decodeLog(bytes) {
  if (!Buffer.isBuffer(bytes)) throw new TypeError('Expected a log Buffer');
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    if ((bytes.length - 2) % 2 !== 0) throw new Error('Incomplete UTF-16 LE log');
    return bytes.subarray(2).toString('utf16le');
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    throw new Error('UTF-16 BE log is not supported');
  }
  // Fail explicitly rather than silently issuing NO_E2E_EVIDENCE for a
  // misdecoded log. UTF-16 LE without BOM is also accepted when unambiguous.
  const sample = bytes.subarray(0, Math.min(bytes.length, 512));
  let zeroEven = 0;
  let zeroOdd = 0;
  for (let i = 0; i < sample.length; i++) {
    if (sample[i] === 0) { if (i % 2 === 0) zeroEven++; else zeroOdd++; }
  }
  if (sample.length >= 16 && zeroOdd >= sample.length / 5 && zeroEven === 0) {
    if (bytes.length % 2 !== 0) throw new Error('Incomplete UTF-16 LE log');
    return bytes.toString('utf16le');
  }
  if (zeroEven > 0 || zeroOdd > 0) throw new Error('Unexpected NUL bytes in log encoding');
  return bytes.toString('utf8').replace(/^\uFEFF/, '');
}

function assess(raw) {
  const cleaned = raw.replace(/\x1b\[[0-9;]*m/g, '');
  const entries = [];
  for (const line of cleaned.split(/\r?\n/)) {
    const at = line.indexOf('GENESIS_31_FINAL_EVIDENCE ');
    if (at === -1) continue;
    try { entries.push(JSON.parse(line.slice(at + 'GENESIS_31_FINAL_EVIDENCE '.length))); }
    catch { throw new Error('Malformed GENESIS_31_FINAL_EVIDENCE record'); }
  }
  const scenarios = ['SINGLE', 'BINARY', 'TRIPLE', 'LUNAR_V2', 'COMPACT_V2', 'PERMISSIONS_V2', 'EVENT_DISRUPTION'];
  const reasons = [];
  if (!/Test Files\s+1 passed\s*\(1\)/.test(cleaned) ||
      !/Tests\s+\d+ passed\s*\(\d+\)/.test(cleaned) ||
      /\b(?:Test Files|Tests)\s+\d+ failed\b/.test(cleaned)) {
    reasons.push('TEST_RUN_NOT_PROVEN_GREEN');
  }
  const byScenario = new Map();
  for (const e of entries) {
    if (!scenarios.includes(e.scenario) || byScenario.has(e.scenario)) {
      reasons.push('DUPLICATE_OR_UNKNOWN_SCENARIO'); continue;
    }
    byScenario.set(e.scenario, e);
  }
  const assessments = scenarios.map(name => {
    const e = byScenario.get(name);
    if (!e) { reasons.push(`MISSING_${name}`); return {scenario:name, result:'FAIL', reason:'NO_E2E_EVIDENCE'}; }
    if (name === 'SINGLE' || name === 'BINARY' || name === 'TRIPLE' || name === 'LUNAR_V2') {
      if (!Number.isSafeInteger(e.ageYearsCT0) || e.ageYearsCT0 < 0 ||
          !Number.isSafeInteger(e.irradianceYears) || e.irradianceYears <= 0 ||
          !Number.isSafeInteger(e.unknownYears) || e.unknownYears < 0 ||
          e.irradianceYears + e.unknownYears !== e.ageYearsCT0 + 1 ||
          e.environment !== 'UNKNOWN_BY_DESIGN' || e.life !== 'NOT_EVALUATED' ||
          e.certification !== 'NOT_CERTIFIED' || e.private !== true ||
          (name === 'SINGLE' && e.radiativeScope !== 'HOST_STELLAR_SYSTEM_CONDITIONAL') ||
          ((name === 'BINARY' || name === 'TRIPLE') &&
            e.radiativeScope !== 'ONE_COMPONENT_ONLY_NOT_MULTIPLE_TOTAL') ||
          (name === 'LUNAR_V2' && (!e.parentKey || !e.moonKey?.startsWith(e.parentKey + '/M')))) {
        reasons.push(`INVALID_${name}`);
        return {scenario:name,result:'FAIL',reason:'INCONSISTENT_PHYSICAL_ACCOUNTING'};
      }
      if (name !== 'LUNAR_V2' && (e.integrated31_7_8_9 !== true || e.deterministic !== true)) {
        reasons.push(`MISSING_TEMPORAL_CHAIN_${name}`);
        return {scenario:name,result:'FAIL',reason:'RECONSTRUCTION_NOT_VERIFIED'};
      }
      return {scenario:name, result:'VERIFIED', irradianceYears:e.irradianceYears,
        unknownYears:e.unknownYears, radiativeScope:e.radiativeScope,
        paleoenvironment:'UNKNOWN_BY_DESIGN'};
    }
    if (name === 'EVENT_DISRUPTION') {
      if (!Number.isSafeInteger(e.eventYear) || e.eventYear <= 0 ||
          !Number.isSafeInteger(e.ageYearsCT0) || e.ageYearsCT0 < e.eventYear ||
          e.irradiationStopsAt !== e.eventYear - 1 ||
          e.unknownFromEvent !== true || e.deterministic !== true ||
          e.life !== 'NOT_EVALUATED' || e.certification !== 'NOT_CERTIFIED') {
        reasons.push('INVALID_EVENT_DISRUPTION'); return {scenario:name,result:'FAIL'};
      }
      return {scenario:name,result:'VERIFIED',reason:'UNRESOLVED_EVENTS_STOP_CONDITIONAL_PROPAGATION'};
    }
    if (name === 'COMPACT_V2') {
      // Compact is deliberately not treated as a stellar main-sequence history.
      if (e.illustrationNotPhysical !== true || e.datedHistory !== 'UNKNOWN_BY_DESIGN' ||
          e.certification !== 'NOT_CERTIFIED') {
        reasons.push('INVALID_COMPACT_V2');return {scenario:name,result:'FAIL'};
      }
      return {scenario:name,result:'UNKNOWN_BY_DESIGN',reason:'NO_DATED_COMPACT_HOST_SOURCE'};
    }
    if (e.lockedDenied !== true || e.privateNotSerialized !== true ||
        e.copiedTargetCannotAccess !== true) {
      reasons.push('INVALID_PERMISSIONS_V2');return {scenario:name,result:'FAIL'};
    }
    return {scenario:name,result:'VERIFIED'};
  });
  return {
    contractVersion:'31.INTEGRAL.SCOPED.EVIDENCE-v1',
    kind:'E2E_TEST_EVIDENCE_NOT_INDEPENDENT_PHYSICAL_CERTIFICATION',
    status:reasons.length ? 'FAIL' : 'SCOPED_VALIDATION_PASSED',
    scientificPhaseClosure:'NOT_CERTIFIED',
    historicalAtmosphereWaterRadiation:'UNKNOWN_BY_DESIGN',
    missingIndependentEvidence:['DATED_PRESSURE_WATER_RADIATION_STABILITY',
      'COMPLETE_MULTI_HOST_TOTAL_IRRADIANCE', 'COMPACT_HOST_DATED_SOURCE',
      'INDEPENDENT_HISTORICAL_ENVIRONMENTAL_CERTIFICATION'],
    scenarios:assessments, issues:reasons,
  };
}

if (require.main === module) {
  const input = process.argv[2];
  if (!input || !fs.existsSync(input)) {
    console.error('Usage: node scripts/reportar-genesis-31-cierre.cjs .\\genesis-31-cierre-e2e.txt');
    process.exitCode = 2;
  } else {
    try {
      const result = assess(decodeLog(fs.readFileSync(input)));
      console.log(JSON.stringify(result, null, 2));
      if (result.status === 'FAIL') process.exitCode = 1;
    } catch (error) { console.error(error.message);process.exitCode = 2; }
  }
}
module.exports = { assess, decodeLog };
