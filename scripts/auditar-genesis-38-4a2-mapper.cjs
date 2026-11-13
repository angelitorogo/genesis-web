'use strict';
/** GENESIS 38.4a2: análisis estructural de procedencia del mapper real, no lo modifica. */
const fs=require('node:fs');const path=require('node:path');
const ts=require('typescript');
const TARGET='src/app/presentation/life-species-visual/vida38-species-visual-contract.ts';
const LOC=/^(?:planet(?:Id|Index|Name|Key|Ordinal)?|moon(?:Id|Index|Name|Key)?|system(?:Id|Index|Name|Key)?|galaxy(?:Id|Index|Name|Key)?|sector(?:Id|Index|X|Y)?|coordinates?|latitude|longitude|orbital(?:Index|Position)?|world(?:Id|Index|Key)?|location|position|host(?:Planet|System|Moon)?|universeSeed)$/i;
const ALLOWED=/^(?:species|phenotype|morphology|adaptations?|pigmentation|lineage|bodyPlan|bodyLengthMeters|locomotion|ecological(?:Role|Niche)?|niche|identity|fingerprint|group|covering|id|color|traits?|name|hash32|join|String|Number|JSON|Math|sort|map|filter|toString|toUpperCase|toLowerCase|slice|concat|length|Uint32Array|appearanceFingerprint|speciesId)$/;
function lineOf(sf,node){return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1;}
function inspect(source,filepath=TARGET){
 const sf=ts.createSourceFile(filepath,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
 const assignments=[];const decls=new Map();const functions=[];
 function walk(node){
   if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer){
     const a=decls.get(node.name.text)||[];a.push(node);decls.set(node.name.text,a);
   }
   if((ts.isFunctionDeclaration(node)||ts.isMethodDeclaration(node)||ts.isArrowFunction(node))&&node.body)functions.push(node);
   if(ts.isPropertyAssignment(node)&&node.name.getText(sf)==='variantSeedUint32')assignments.push(node);
   ts.forEachChild(node,walk);
 }
 walk(sf);
 const seedAssignments=assignments.filter(a=>/\bhash32\s*\(\s*identity\s*\)/.test(a.initializer.getText(sf)));
 const results=[];
 for(const seed of seedAssignments){
   const scope=(()=>{let p=seed.parent;while(p){if(ts.isFunctionLike(p))return p;p=p.parent;}return sf;})();
   const bindings=new Map();function collect(node){if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer){if(!bindings.has(node.name.text))bindings.set(node.name.text,node);}ts.forEachChild(node,collect);}collect(scope);
   const identity=bindings.get('identity');
   const localRefs=new Set(),properties=new Set(),spatial=new Set(),unresolved=new Set(),chains=[];
   function follow(node,depth=0){if(!node||depth>14)return;
     if(ts.isPropertyAccessExpression(node)){const s=node.getText(sf),p=node.name.text;properties.add(s);if(LOC.test(p))spatial.add(s);follow(node.expression,depth+1);return;}
     if(ts.isElementAccessExpression(node)){const s=node.getText(sf);properties.add(s);if(/(?:planet|moon|system|galaxy|sector|location|coordinate|world|host)/i.test(s))spatial.add(s);follow(node.expression,depth+1);if(node.argumentExpression)follow(node.argumentExpression,depth+1);return;}
     if(ts.isIdentifier(node)){const s=node.text;if(LOC.test(s))spatial.add(s);const binding=bindings.get(s);if(binding&&!localRefs.has(s)){localRefs.add(s);chains.push({name:s,line:lineOf(sf,binding),expression:binding.initializer.getText(sf).slice(0,900)});follow(binding.initializer,depth+1);}else if(!binding&&!ALLOWED.test(s)&&!ts.isPropertyAccessExpression(node.parent)&&!ts.isPropertyAssignment(node.parent))unresolved.add(s);return;}
     ts.forEachChild(node,c=>follow(c,depth+1));
   }
   if(identity)follow(identity.initializer);else unresolved.add('identity (sin declaración local identificable)');
   const identityText=identity?.initializer.getText(sf)??null;
   const evidence={seedLine:lineOf(sf,seed),seedExpression:seed.initializer.getText(sf),identityLine:identity?lineOf(sf,identity):null,identityExpression:identityText,localDependencies:chains,properties:[...properties].sort(),spatialDependencies:[...spatial].sort(),unresolvedSymbols:[...unresolved].sort()};
   evidence.state=spatial.size?'DEPENDENCIA_ESPACIAL_POSIBLE':identity&&unresolved.size===0?'SIN_DEPENDENCIA_ESPACIAL_DIRECTA':'PROCEDENCIA_REQUIERE_REVISION';
   results.push(evidence);
 }
 const allAssignments=assignments.map(a=>({line:lineOf(sf,a),expression:a.initializer.getText(sf).slice(0,200)}));
 const exportedMappers=[];for(const fn of functions){if(ts.isFunctionDeclaration(fn)&&fn.name&&fn.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){const body=fn.body?.getText(sf)||'';if(body.includes('variantSeedUint32')||body.includes('appearanceFingerprint'))exportedMappers.push({name:fn.name.text,line:lineOf(sf,fn),parameters:fn.parameters.map(p=>p.getText(sf)).slice(0,15)});}}
 return {revision:'GENESIS/38.4a2/mapper-biologico/v1',file:filepath,hash32IdentityMappings:results,allSeedAssignments:allAssignments,exportedMappers,parseDiagnostics:sf.parseDiagnostics.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' ')),overall:results.length===0?'MAPPER_NO_LOCALIZADO':results.some(r=>r.spatialDependencies.length)?'REVISAR_DEPENDENCIA_ESPACIAL':results.some(r=>r.unresolvedSymbols.length)?'REVISAR_PROCEDENCIA':'SIN_DEPENDENCIA_ESPACIAL_DIRECTA',limitations:['No prueba por sí mismo la estabilidad de species.id (puede codificar origen espacial) ni la semántica de funciones importadas.','No equivale a backup/restore de IndexedDB.','Las diferencias biológicas deben verificarse mediante tests productivos con fixtures VIDA reales.']};
}
function main(){const project=process.cwd(),target=path.join(project,TARGET);if(!fs.existsSync(target)){console.error('38.4a2: falta '+TARGET);process.exitCode=2;return;}
 const result=inspect(fs.readFileSync(target,'utf8'));
 const folder=path.join(project,'docs/audits/38-4a2');fs.mkdirSync(folder,{recursive:true});
 const json=path.join(folder,'38-4a2-mapper-biologico.json'),md=path.join(folder,'38-4a2-mapper-biologico.md');fs.writeFileSync(json,JSON.stringify(result,null,2)+'\n');
 const lines=['# GENESIS 38.4a2 — Trazabilidad del mapper biológico','',`**Estado:** ${result.overall}`,'',`**Archivo:** \`${TARGET}\``,'',...result.hash32IdentityMappings.flatMap((e,i)=>[`## Semilla ${i+1} · línea ${e.seedLine}`,`- Estado: ${e.state}` ,`- \`variantSeedUint32: ${e.seedExpression}\``,`- Construcción de identidad (línea ${e.identityLine??'no identificada'}): \`${e.identityExpression??'NO LOCALIZADA'}\``,`- Dependencias espaciales: ${e.spatialDependencies.length?e.spatialDependencies.join(', '):'ninguna directa detectada'}`,`- Símbolos sin resolver: ${e.unresolvedSymbols.length?e.unresolvedSymbols.join(', '):'ninguno identificado'}`,'','### Dependencias locales',...e.localDependencies.map(d=>`- Línea ${d.line} · \`${d.name} = ${d.expression}\``),'']), '## Funciones exportadas que pueden construir el contrato',...result.exportedMappers.map(e=>`- ${e.name} (línea ${e.line}): ${e.parameters.join(', ')}`),'','## Limitaciones',...result.limitations.map(s=>'- '+s),'','## Estado de cierre','Este análisis es estructural. No cerrar 38.4 sin pruebas de mapper ejecutado y restauración real.',''];fs.writeFileSync(md,lines.join('\n'));
 console.log(`38.4a2: ${result.overall}; ${result.hash32IdentityMappings.length} asignación(es) en ${TARGET}`);console.log(json);console.log(md);
 if(result.overall==='MAPPER_NO_LOCALIZADO')process.exitCode=2;
}
if(require.main===module)main();module.exports={inspect};
