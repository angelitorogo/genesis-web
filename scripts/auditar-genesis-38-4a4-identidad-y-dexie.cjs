'use strict';
/** 38.4a4: auditoría transitable de VIDA.6 ID y puntos reales de Dexie.
 * Este script inspecciona fuentes productivas; NUNCA certifica una operación IndexedDB que no haya ejecutado.
 */
const fs = require('node:fs');
const path = require('node:path');
const ROOT = process.cwd();
function getTs() {
  try { return require('typescript'); }
  catch (e) { throw new Error('38.4a4 requiere TypeScript (instalado por el proyecto Angular). Ejecutar en la raíz del repositorio.'); }
}
const SOURCE = 'src/app/simulation/life/vida6-ecosystems-species.ts';
const CONTRACT = 'src/app/presentation/life-species-visual/vida38-species-visual-contract.ts';
const DOM = 'src/app/domain/life/vida6-ecosystems-species.ts';
const OUT = 'docs/audits/38-4a4';
function read(root, relative) {const file=path.join(root,relative);return fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;}
function loc(sf,node){const p=sf.getLineAndCharacterOfPosition(node.getStart(sf));return p.line+1;}
function collectIdentifiers(ts,node,ignored=new Set()){const ids=new Set();function visit(n){if(ts.isIdentifier(n)){
   if(ts.isPropertyAccessExpression(n.parent)&&n.parent.name===n)return;
   if(ts.isPropertyAssignment(n.parent)&&n.parent.name===n)return;
   if(ts.isPropertySignature(n.parent)&&n.parent.name===n)return;
   if(ts.isVariableDeclaration(n.parent)&&n.parent.name===n)return;
   if(ts.isParameter(n.parent)&&n.parent.name===n)return;
   if(ts.isImportSpecifier(n.parent)||ts.isImportClause(n.parent))return;
   ids.add(n.text);
  }ts.forEachChild(n,visit);}visit(node);ignored.forEach(x=>ids.delete(x));return Array.from(ids).sort();}
function pickInterestingDeclaration(ts,sf){const found=[];function visit(node){if(ts.isPropertyAssignment(node)&&node.name.getText(sf)==='id'&&node.initializer.getText(sf).includes('vida6:'))found.push(node);ts.forEachChild(node,visit);}visit(sf);return found;}
function inspectGenerator(source){const ts=getTs();const sf=ts.createSourceFile(SOURCE,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);const matches=pickInterestingDeclaration(ts,sf);
 const spatial=/(?:planet|system|galaxy|moon|sector|location|coordinates|bodyStorageKey|universeSeed|world|index|position|origin|planetary)/i;
 const biological=/(?:species|phenotype|adaptation|lineage|trait|group|habitat|nutrition|ecosystem|gene|morpholog|taxonomy|seed|biosphere)/i;
 const traces=matches.map(hit=>{
  let scope=hit;while(scope.parent&&!ts.isFunctionDeclaration(scope)&&!ts.isMethodDeclaration(scope)&&!ts.isArrowFunction(scope)&&!ts.isFunctionExpression(scope))scope=scope.parent;
  const enclosing=scope.parent?scope:sf;
  const decls=new Map(),params=new Map();
  function visit(node){if(ts.isFunctionLike(node)&&node!==enclosing)return;
    if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer)decls.set(node.name.text,node);
    ts.forEachChild(node,visit);
  }visit(enclosing);
  if(ts.isFunctionLike(enclosing))for(const p of enclosing.parameters){if(ts.isIdentifier(p.name))params.set(p.name.text,p);}
  const expression=hit.initializer.getText(sf);
  const deps=[];const seen=new Set();
  function follow(name,depth){if(depth>18||seen.has(name))return;seen.add(name);
   const d=decls.get(name);
   if(d){const expr=d.initializer.getText(sf);deps.push({symbol:name,line:loc(sf,d),kind:'LOCAL',expression:expr.slice(0,1200),references:collectIdentifiers(ts,d.initializer)});for(const k of collectIdentifiers(ts,d.initializer))follow(k,depth+1);return;}
   const p=params.get(name);if(p){deps.push({symbol:name,line:loc(sf,p),kind:'PARAMETER',expression:p.getText(sf),references:[]});return;}
   deps.push({symbol:name,line:null,kind:'OUTER_OR_IMPORTED',expression:null,references:[]});
  }
  for(const k of collectIdentifiers(ts,hit.initializer))follow(k,0);
  const refs=deps.map(d=>d.symbol).concat(deps.flatMap(d=>d.references));
  const possibleSpatial=deps.filter(d=>spatial.test(d.symbol)||spatial.test(d.expression||''));
  return {line:loc(sf,hit),assignment:hit.getText(sf),enclosingFunction:ts.isFunctionLike(enclosing)?enclosing.name?.getText(sf)||'ANONIMA':'NO_RESUELTA',dependencies:deps,possibleSpatial:possibleSpatial.map(d=>d.symbol),biologicalHints:[...new Set(refs.filter(x=>biological.test(x)))],scopeComplete:enclosing!==sf};
 });
 return {matches:traces,diagnostics:sf.parseDiagnostics.map(x=>String(x.messageText))};
}
function walk(dir,arr){if(!fs.existsSync(dir))return;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f,arr);else if(e.isFile()&&f.endsWith('.ts')&&!f.endsWith('.spec.ts'))arr.push(f);}}
function inspectRepositories(root){const ts=getTs();const files=[];walk(path.join(root,'src/app/data'),files);
 const relevant=files.filter(p=>/vida[69]|dexie|biology|ecosystem|backup|restore/i.test(p));const results=[];
 for(const file of relevant){const rel=path.relative(root,file).replaceAll('\\','/');const raw=fs.readFileSync(file,'utf8');const matches=[...raw.matchAll(/\b(?:privateEcologicalBiospheres|privateBiospheres|snapshotJson|Vida6EcosystemSnapshot|Vida9BiologyRecord|VIDA9_REVISION|\bensure\s*\(|\bget\s*\(|\bbackup\b|\brestore\b)/g)];if(!matches.length)continue;
  const sf=ts.createSourceFile(rel,raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);const signatures=[];
  function visit(node){if((ts.isMethodDeclaration(node)||ts.isConstructorDeclaration(node)||ts.isClassDeclaration(node))&&node.name){const s=node.getText(sf).split('{')[0].slice(0,450);signatures.push({line:loc(sf,node),signature:s});}ts.forEachChild(node,visit);}visit(sf);
  results.push({file:rel,mentions:matches.length,signatures:signatures.slice(0,35),snippets:matches.slice(0,10).map(m=>{const offset=m.index||0,line=raw.slice(0,offset).split('\n').length;return {line,text:raw.split(/\r?\n/)[line-1]?.trim().slice(0,200)};})});
 }
 return results.sort((a,b)=>b.mentions-a.mentions).slice(0,50);
}
function inspect(root=ROOT){const source=read(root,SOURCE),mapper=read(root,CONTRACT),domain=read(root,DOM);
 const generator=source===null?null:inspectGenerator(source);const repositoryEvidence=inspectRepositories(root);
 const mapperSeed=mapper!==null&&/variantSeedUint32\s*:\s*hash32\s*\(\s*identity\s*\)/.test(mapper);
 const dynamicStatus=generator?.matches.length?'IDENTIDAD_TRAZADA_REQUIERE_CASOS_PRODUCTIVOS':'GENERADOR_NO_LOCALIZADO';
 const persistenceStatus='NO_EJECUTADA_REPOSITORIOS_REALES';
 return {revision:'GENESIS/38.4a4/identidad-dexie/v1',scope:'Auditoría estructural con TypeScript AST. NO ejecuta una transacción Dexie ni afirma haberla hecho.',generatorFile:SOURCE,domainFile:DOM,contractFile:CONTRACT,generator,mapperSeed,repositoryEvidence,verification:{identityTrace:dynamicStatus,repositoryApiDiscovery:repositoryEvidence.length?'FUENTES_LOCALIZADAS':'NO_LOCALIZADAS',indexedDbRoundTrip:persistenceStatus},requirements:['Probar con el generador VIDA.6 productivo dos reconstrucciones independientes y un caso de consulta desde otra ubicación conservando species.id.','Instanciar la base Dexie real y sus repositorios VIDA.6/9 en un entorno IndexedDB de prueba aislado.','Guardar y leer por los métodos reales, reconstruir el contrato con el mapper productivo y comparar species.id, variantSeedUint32 y appearanceFingerprint.','Cerrar 38.4 solo cuando la prueba real anterior pase; JSON roundtrip y auditorías estáticas no la sustituyen.']};
}
function report(result){const rows=['# GENESIS — 38.4a4 · Identidad VIDA.6 y preparación Dexie real','',`**Estado identidad:** ${result.verification.identityTrace}`,`**Estado persistencia:** ${result.verification.indexedDbRoundTrip}`,'','## Generador productivo VIDA.6',''];
 if(result.generator?.matches.length)for(const entry of result.generator.matches){rows.push(`### ID línea ${entry.line}`,`- Asignación: \`${entry.assignment}\``,`- Función: \`${entry.enclosingFunction}\``,`- Dependencias espaciales potenciales: ${entry.possibleSpatial.join(', ')||'ninguna en este nivel'}`,'','| Símbolo | Línea | Tipo | Expresión |','|---|---:|---|---|');for(const d of entry.dependencies)rows.push(`| \`${d.symbol}\` | ${d.line??'—'} | ${d.kind} | \`${String(d.expression??'').replaceAll('|','\\|').slice(0,140)}\` |`);}
 else rows.push('No se localizó la asignación productiva.');
 rows.push('','## Interfaces observadas en persistencia','');for(const r of result.repositoryEvidence){rows.push(`### ${r.file}`);for(const s of r.signatures)rows.push(`- L${s.line}: \`${s.signature.replaceAll('`','\\`').replaceAll('\n',' ').slice(0,240)}\``);}
 rows.push('','## Verificación obligatoria','',...result.requirements.map((x,i)=>`${i+1}. ${x}`),'','> El informe no certifica IndexedDB. Para el test final deben enlazarse los constructores y operaciones reales de los repositorios localizados.','');return rows.join('\n');}
function main(){const result=inspect();const dest=path.join(ROOT,OUT);fs.mkdirSync(dest,{recursive:true});fs.writeFileSync(path.join(dest,'38-4a4-identidad-y-dexie.json'),JSON.stringify(result,null,2)+'\n');fs.writeFileSync(path.join(dest,'38-4a4-identidad-y-dexie.md'),report(result));console.log(`38.4a4: generador=${result.verification.identityTrace}, repos=${result.repositoryEvidence.length}, persistencia=${result.verification.indexedDbRoundTrip}`);}
if(require.main===module)main();module.exports={inspect,inspectGenerator,report};
