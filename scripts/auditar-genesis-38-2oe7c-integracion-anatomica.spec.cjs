'use strict';
/** Auditoría geométrica portable para ejecutar desde la raíz de genesis-web.
 * El módulo nuevo solo depende en ejecución de Three.js (sus imports de tipos
 * desaparecen al transpilarlo). No requiere navegador ni infraestructura WebGL. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const ts=require('typescript');
const THREE=require('three');
const source=fs.readFileSync(path.join(process.cwd(),'src/app/presentation/life-species-visual/vida38-reptilian-organic-garments-38-2oe7c.ts'),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const exportsFromModule={};
new Function('exports','require',js)(exportsFromModule,require);
const {createVida38ReptilianTailoredShell38OE7C,createVida38ReptilianOrganicGarments38OE7C}=exportsFromModule;
assert.equal(typeof createVida38ReptilianTailoredShell38OE7C,'function');
const anatomy={legLength:1.04,torsoLength:.73,shoulderWidth:.31,hipWidth:.235};
const geometry=new THREE.SphereGeometry(.235,28,24);
geometry.scale(1.08,1.70,.87);geometry.translate(0,1.35,0);
const body=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial());
const kinds=['PRIEST_TUNIC','TECHNO_HABIT','NOBLE_MANTLE','COLONIAL_OVERCOAT','PELAGIC_VEIL'];
const results=[];
for(const kind of kinds){
  const plan={kind,length:'KNEE',flare:.52,pleatCount:9,phase:.4,thickness:.011,
    primaryColor:'#101923',accentColor:'#57d6cb',culture:'BASILICA_TECHNOCRACY',signature:`e7c:audit:${kind}`};
  const garments=createVida38ReptilianOrganicGarments38OE7C(body,anatomy,plan,'LOW');
  const shell=garments[0];
  const stats=shell.userData.garmentStats38OE7C;
  const index=shell.geometry.getIndex();
  const edges=new Map();
  const positions=shell.geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++)for(const v of [positions.getX(i),positions.getY(i),positions.getZ(i)])assert.ok(Number.isFinite(v));
  for(let i=0;i<index.count;i+=3){
    const ids=[index.getX(i),index.getX(i+1),index.getX(i+2)];
    for(let j=0;j<3;j++){
      const a=ids[j],b=ids[(j+1)%3];const key=`${Math.min(a,b)}:${Math.max(a,b)}`;
      edges.set(key,(edges.get(key)||0)+1);
    }
  }
  const boundary=[...edges.values()].filter(v=>v===1).length;
  const nonManifold=[...edges.values()].filter(v=>v>2).length;
  assert.equal(boundary,0,`${kind}: aristas expuestas`);
  assert.equal(nonManifold,0,`${kind}: aristas no-manifold`);
  assert.ok(stats.tailOpeningLoop&&stats.tailOpeningEdges>8,`${kind}: abertura caudal no válida`);
  results.push({kind,triangles:stats.triangleCount,tailEdges:stats.tailOpeningEdges,silhouette:stats.silhouette});
  for(const mesh of garments){mesh.geometry.dispose();if(Array.isArray(mesh.material))mesh.material.forEach(m=>m.dispose());else mesh.material.dispose();}
}
body.geometry.dispose();body.material.dispose();
assert.equal(new Set(results.map(r=>r.silhouette)).size,5);
console.log('GENESIS_38_2OE7C_AUDIT_OK:',JSON.stringify({families:results.length,manifold:results.every(r=>r.triangles>5000),results}));
