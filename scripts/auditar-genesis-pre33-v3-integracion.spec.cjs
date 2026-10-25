'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {publicRouteProof}=require('./auditar-genesis-pre33-v3-integracion.cjs');
test('no V3 release by relabeling private V2 source',()=>{
 const r=publicRouteProof();
 assert.equal(r.publicV3Defined,false);
 assert.equal(r.fromCode3Accepted,false);
});
test('bootstrap, seed selector and IndexedDB reject an unreleased public version',()=>{
 const r=publicRouteProof();
 assert.equal(r.bootstrapGuard,true);
 assert.equal(r.repositoryGuard,true);
 assert.equal(r.seedSelectionGuard,true);
});
