/**
 * PRE-33.13: pure, versioned G2 safety decision. No organisms, no observations,
 * no RNG, no I/O and no modification of V1/V2/V3 generation.
 */
export const PRE33_13_GATE_CONTRACT = 'PRE-33.13/G2-CERTIFICATION/v1' as const;

export type PRE3313IssueState = 'CORREGIDA_TESTS_OK' | 'NO_EVALUABLE_JUSTIFICADA' |
  'FUERA_DOMINIO_FORMAL' | 'BLOQUEANTE' | 'NO_VERIFICADA';
export type PRE3313GateState = 'G2_AUTORIZADA_CON_HIPOTESIS' | 'G2_PENDIENTE_EVIDENCIA' | 'G2_BLOQUEADA';
export interface PRE3313Finding {
  readonly code:string;
  readonly state:PRE3313IssueState;
  readonly source:string;
  readonly explanation:string;
  readonly permittedUse:'PHYSICAL_EVIDENCE'|'HYPOTHESIS_ONLY'|'DO_NOT_USE';
}
export interface PRE3313GateInput {
  readonly currentSourceReproduced:boolean;
  readonly exactHistorical45Reproduced:boolean;
  readonly multiGalaxyIndependentPassed:boolean;
  readonly scientificCoreAuditsPassed:boolean;
  readonly v2IdentityAndOrbitRegressionPassed:boolean;
  readonly persistenceAndObservationPassed:boolean;
  readonly workerUnitBuildE2EPassed:boolean;
  readonly reproducibilityPassed:boolean;
  readonly findings:readonly PRE3313Finding[];
}
export interface PRE3313GateReport {
  readonly contract:typeof PRE33_13_GATE_CONTRACT;
  readonly verdict:PRE3313GateState;
  readonly missingChecks:readonly string[];
  readonly blockers:readonly string[];
  readonly authorizedScope:'PHASE33_2_33_5_DECLARED_AND_VALIDATED_HYPOTHESES_ONLY'|'NO_EFFECTIVE_LIFE_ACTIVATION';
  readonly automaticBiologyFromHabitability:false;
  readonly observedGroundTruthLeakageAllowed:false;
  readonly realWorldAbiogenesisCertified:false;
}
/** G2 cannot be granted by a merely passing fixture or unquantified environment. */
export function decideG2PRE3313(input:PRE3313GateInput):PRE3313GateReport {
  const required:[keyof Omit<PRE3313GateInput,'findings'>,string][]=[
    ['currentSourceReproduced','CURRENT_HEAD_NOT_REPRODUCED'],
    ['exactHistorical45Reproduced','ORIGINAL_45_SYSTEM_IDENTITIES_NOT_REPLAYED'],
    ['multiGalaxyIndependentPassed','MULTIGALAXY_REAUDIT_MISSING'],
    ['scientificCoreAuditsPassed','PRE33_07_08_09_CORE_AUDITS_MISSING'],
    ['v2IdentityAndOrbitRegressionPassed','V2_IDENTITY_ORBIT_REGRESSION_MISSING'],
    ['persistenceAndObservationPassed','PERSISTENCE_OR_OBSERVATION_EVIDENCE_MISSING'],
    ['workerUnitBuildE2EPassed','OFFICIAL_TEST_PIPELINE_MISSING'],
    ['reproducibilityPassed','DETERMINISM_REPLAY_MISSING'],
  ];
  const missingChecks=required.filter(([key])=>input[key]!==true).map(([,name])=>name);
  const blockers:string[]=[];
  const codes=new Set<string>();
  for(const f of input.findings){
    if(!f.code.trim()||!f.source.trim()||!f.explanation.trim()||codes.has(f.code))blockers.push('INVALID_OR_DUPLICATED_FINDING');
    codes.add(f.code);
    if(f.state==='BLOQUEANTE')blockers.push(f.code);
    if(f.state==='NO_EVALUABLE_JUSTIFICADA'&&f.permittedUse!=='HYPOTHESIS_ONLY')blockers.push('UNRESOLVED_TREATED_AS_PHYSICAL_'+f.code);
    if(f.state==='FUERA_DOMINIO_FORMAL'&&f.permittedUse!=='DO_NOT_USE')blockers.push('OUT_OF_DOMAIN_TREATED_AS_PHYSICAL_'+f.code);
    if(f.state==='NO_VERIFICADA'&&f.permittedUse!=='DO_NOT_USE')blockers.push('UNVERIFIED_TREATED_AS_PHYSICAL_'+f.code);
    if(f.state==='CORREGIDA_TESTS_OK'&&f.permittedUse!=='PHYSICAL_EVIDENCE')blockers.push('TESTED_PHYSICS_BAD_SCOPE_'+f.code);
  }
  const mandatory = [
    'IDENTIDAD_Y_ORBITA_MULTISISTEMA', 'OBSERVADO_NO_REVELA_REALIDAD_PRIVADA',
    'LUNAS_CONFIRMED_E_IDENTIDAD_DIFERIDA', 'PRESION_Y_NICHOS_FISICOS',
    'POTENCIA_QUIMICA_NO_RESUELTA', 'DOSIMETRIA_GLOBAL_NO_RESUELTA',
    'CONTINUIDAD_GLOBAL_NO_CERTIFICADA', 'LUNAS_IDENTIDAD_SOLO',
    'SOLVENTES_NH3_CH4_SIN_FASE', 'FRECUENCIAS_AMBIENTALES_NO_BIOLOGICAS',
  ];
  for(const code of mandatory)if(!codes.has(code))blockers.push('MISSING_MANDATORY_FINDING_'+code);
  if(!input.findings.length)blockers.push('EMPTY_FINDINGS_REGISTER');
  const verdict:PRE3313GateState=blockers.length?'G2_BLOQUEADA':
    missingChecks.length||input.findings.some(f=>f.state==='NO_VERIFICADA')?'G2_PENDIENTE_EVIDENCIA':'G2_AUTORIZADA_CON_HIPOTESIS';
  return Object.freeze({contract:PRE33_13_GATE_CONTRACT,verdict,
    missingChecks:Object.freeze(missingChecks),blockers:Object.freeze([...new Set(blockers)]),
    authorizedScope:verdict==='G2_AUTORIZADA_CON_HIPOTESIS'?
      'PHASE33_2_33_5_DECLARED_AND_VALIDATED_HYPOTHESES_ONLY':'NO_EFFECTIVE_LIFE_ACTIVATION',
    automaticBiologyFromHabitability:false,
    observedGroundTruthLeakageAllowed:false,
    realWorldAbiogenesisCertified:false});
}
