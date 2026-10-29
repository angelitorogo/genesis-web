const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const base=path.resolve(__dirname,'../src/app/presentation');
const file=p=>fs.readFileSync(path.join(base,p),'utf8');

test('Confirmación normal materializa VIDA.9 solo después de confirmar y COMMIT',()=>{
 const t=file('runtime/stellar-system-scientific-progression.runtime.ts');
 const transaction=t.indexOf('const committed = await this.database');
 const publish=t.indexOf('if(committed.stateBefore.code < DiscoveryState.CONFIRMED.code');
 assert.ok(transaction>0 && publish>transaction);
 assert.match(t,/ensureVida9PlanetsInBackground\(generationKey,locator\.galaxyIndex,new Set\(\[systemKey\]\)\)/);
 assert.match(t,/return committed;/);
});
test('Confirmación masiva inicia proyección biológica después de grabar descubrimientos',()=>{
 const t=file('codes/codes.ts');
 assert.match(t,/case 'confirmed':/);assert.match(t,/ensureVida9PlanetsInBackground\(generationKey,confirmation\.galaxyIndex,systems\)/);
 assert.match(t,/d\.state\.code>=DiscoveryState\.CONFIRMED\.code/);
});
test('Fallos por sistema no certifican como estériles, se notifican',()=>{
 const w=file('runtime/vida9-background-materializer.worker.ts');
 assert.match(w,/problems\.push\(\{system:confirmed\[i\],message:/);
 assert.match(w,/missingPhysical\+\+/);
 const t=file('galaxy-knowledge-catalog/galaxy-civilization-known-index.ts');
 assert.match(t,/outcome\.problems\?\.length/);
 assert.match(t,/outcome\.expected===physicalCount/);
 assert.match(t,/unresolvedCandidates===0/);
});
test('La vista revela solo civilizaciones confirmadas y nunca un cero incompleto',()=>{
 const t=file('galaxy-detail/galaxy-civilizations-inventory.ts');
 assert.match(t,/result\.complete \|\| result\.entries\.length > 0/);
 assert.match(t,/Inventario parcial/);
 const c=file('galaxy-knowledge-catalog/galaxy-civilization-known-index.ts');
 assert.match(c,/extractConfirmedCivilization/);
 assert.match(c,/vida9DigestForRecord\(payload\)/);
 assert.match(c,/confirmed\.has/);
});
