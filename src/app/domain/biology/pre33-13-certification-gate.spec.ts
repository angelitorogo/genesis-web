import { describe,expect,it } from 'vitest';
import { decideG2PRE3313, type PRE3313GateInput } from './pre33-13-certification-gate';
const ok:PRE3313GateInput={currentSourceReproduced:true,exactHistorical45Reproduced:true,
 multiGalaxyIndependentPassed:true,scientificCoreAuditsPassed:true,v2IdentityAndOrbitRegressionPassed:true,
 persistenceAndObservationPassed:true,workerUnitBuildE2EPassed:true,reproducibilityPassed:true,
 findings:['IDENTIDAD_Y_ORBITA_MULTISISTEMA','OBSERVADO_NO_REVELA_REALIDAD_PRIVADA',
 'LUNAS_CONFIRMED_E_IDENTIDAD_DIFERIDA','PRESION_Y_NICHOS_FISICOS',
 'POTENCIA_QUIMICA_NO_RESUELTA','DOSIMETRIA_GLOBAL_NO_RESUELTA','CONTINUIDAD_GLOBAL_NO_CERTIFICADA',
 'LUNAS_IDENTIDAD_SOLO','SOLVENTES_NH3_CH4_SIN_FASE','FRECUENCIAS_AMBIENTALES_NO_BIOLOGICAS'].map(code=>({
 code,source:'PRE-33',explanation:'Rastro trazable',state:code==='LUNAS_IDENTIDAD_SOLO'?'FUERA_DOMINIO_FORMAL' as const:
 code==='POTENCIA_QUIMICA_NO_RESUELTA'||code==='DOSIMETRIA_GLOBAL_NO_RESUELTA'||code==='CONTINUIDAD_GLOBAL_NO_CERTIFICADA'||code==='SOLVENTES_NH3_CH4_SIN_FASE'?'NO_EVALUABLE_JUSTIFICADA' as const:'CORREGIDA_TESTS_OK' as const,
 permittedUse:code==='LUNAS_IDENTIDAD_SOLO'?'DO_NOT_USE' as const:
 code==='POTENCIA_QUIMICA_NO_RESUELTA'||code==='DOSIMETRIA_GLOBAL_NO_RESUELTA'||code==='CONTINUIDAD_GLOBAL_NO_CERTIFICADA'||code==='SOLVENTES_NH3_CH4_SIN_FASE'?'HYPOTHESIS_ONLY' as const:'PHYSICAL_EVIDENCE' as const}))};
describe('PRE-33.13 — seguridad científica de G2',()=>{
 it('solo autoriza hipótesis explícitas con TODAS las puertas verificadas',()=>{
  const g=decideG2PRE3313(ok);expect(g.verdict).toBe('G2_AUTORIZADA_CON_HIPOTESIS');
  expect(g.automaticBiologyFromHabitability).toBe(false);
  expect(g.realWorldAbiogenesisCertified).toBe(false);
 });
 it('bloquea evidencia física inventada a partir de incertidumbre',()=>{
  const g=decideG2PRE3313({...ok,findings:[{...ok.findings[4],permittedUse:'PHYSICAL_EVIDENCE'}]});
  expect(g.verdict).toBe('G2_BLOQUEADA');
 });
 it('no autoriza usando solo la auditoría ampliada sin el panel original de 45',()=>{
  const g=decideG2PRE3313({...ok,exactHistorical45Reproduced:false});
  expect(g.verdict).toBe('G2_PENDIENTE_EVIDENCIA');
 });
 it('no autoriza sin persistencia, E2E y HEAD reproducido',()=>{
  const g=decideG2PRE3313({...ok,currentSourceReproduced:false,persistenceAndObservationPassed:false,workerUnitBuildE2EPassed:false});
  expect(g.missingChecks).toHaveLength(3);expect(g.verdict).toBe('G2_PENDIENTE_EVIDENCIA');
 });
 it('un hallazgo contradictorio, fuera del dominio o sin procedencia no es evidencia',()=>{
  for(const state of ['BLOQUEANTE','FUERA_DOMINIO_FORMAL','NO_VERIFICADA'] as const){
   const g=decideG2PRE3313({...ok,findings:ok.findings.map((f,i)=>i===4?{...f,state,permittedUse:'PHYSICAL_EVIDENCE'}:f)});
   expect(g.verdict).toBe('G2_BLOQUEADA');
  }
 });
 it('las condiciones históricas desconocidas no equivalen a esterilidad',()=>{
  const g=decideG2PRE3313({...ok,findings:[...ok.findings,{code:'UNKNOWN_HISTORY',state:'NO_EVALUABLE_JUSTIFICADA',source:'PRE33.09',explanation:'Sin serie fechada',permittedUse:'HYPOTHESIS_ONLY'}]});
  expect(g.verdict).toBe('G2_AUTORIZADA_CON_HIPOTESIS');
 });
});
