const fs=require('node:fs');
const path=require('node:path');
const root=process.cwd();
const requireTokens=(file,tokens)=>{
  const full=path.join(root,file);
  if(!fs.existsSync(full))throw Error(`VIDA.T1 missing ${file}`);
  const contents=fs.readFileSync(full,'utf8');
  for(const token of tokens)if(!contents.includes(token))throw Error(`VIDA.T1 missing ${token} in ${file}`);
};
requireTokens('src/app/simulation/life/vida-t1-civilized-founder.ts',[
  'VIDA_T1_MIN_CIVILIZED_BODY_LENGTH_METERS = 1.5',
  'vidaT1SelectFounder','vidaT1CalibrateFounder',
  "'PRIMITIVE'", "'ADVANCED'", "'VERY_ADVANCED'", 'MACROSCOPIC_TOOL_MANIPULATION',
]);
requireTokens('src/app/simulation/life/vida6-ecosystems-species.ts',[
  'vidaT1SelectFounder','vidaT1CalibrateFounder','vidaT1EligibilityOf',
]);
requireTokens('src/app/presentation/runtime/vida3-private-microbial.runtime.ts',[
  'preserveHistoricalMorphologyVersion','VIDA6_REVISION','getOrInsertPreservingExisting',
]);
requireTokens('src/app/simulation/life/vida7-intelligence-civilizations.ts',[
  'vidaT1SelectFounder','vidaT1EligibleCivilizableSpecies',
]);
console.log('VIDA.T1 audit OK');
