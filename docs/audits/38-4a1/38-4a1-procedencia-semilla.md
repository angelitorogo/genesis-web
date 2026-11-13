# GENESIS 38.4a1 — Procedencia de la semilla visual

Archivos revisados: 2307; asignaciones encontradas: 54; laboratorio: 52; producción: 2.

**Este informe no certifica conformidad de variantes espaciales por sí solo.**

| Archivo | Línea | Clasificación | Expresión |
|---|---:|---|---|
| `src/app/presentation/life-species-visual/vida38-species-visual-contract.ts` | 37 | PROCEDENCIA_NO_DEMOSTRADA | `number` |
| `src/app/presentation/life-species-visual/vida38-species-visual-contract.ts` | 182 | PROCEDENCIA_NO_DEMOSTRADA | `hash32(identity),` |

## Revisión obligatoria

- Inspeccionar mapper VIDA→Vida38SpeciesVisualContract y derivaciones aguas arriba
- Crear caso de VIDA persistido real: mismo ID y rasgos, ubicación alternativa
- Verificar fingerprint y variantSeedUint32 ante backup/restore real
- Permitir variantes distintas solo con rasgos biológicos explícitos

## Asignaciones de laboratorio (no prueban producción)

- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:14` · `hashVida38W(speciesId+'seed'),appearanceFingerprint:'LAB_ONLY/38W/${speciesId}',`
- `src/app/presentation/life-species-visual/vida38-advanced-insectoid-fixtures-38-2t.ts:28` · `vida38Hash38T(speciesId+'|seed'),appearanceFingerprint,`
- `src/app/presentation/life-species-visual/vida38-advanced-reptilian-38-2s3.spec.ts:35` · `(base.variantSeedUint32 + 17) >>> 0 }`
- `src/app/presentation/life-species-visual/vida38-advanced-reptilian-fixtures-38-2s.ts:27` · `vida38Hash38S('${speciesId}|seed'),`
- `src/app/presentation/life-species-visual/vida38-bird-face-visibility-38-2ia2b.spec.ts:35` · `(0x3a924a71 + index * 711) >>> 0,`
- `src/app/presentation/life-species-visual/vida38-birds-38-2i.spec.ts:12` · `0x7ac91a33,appearanceFingerprint:'avian-source-digest',`
- `src/app/presentation/life-species-visual/vida38-birds-refinement-38-2ia.spec.ts:16` · `0x7ac91a33,appearanceFingerprint:'avian-refinement-source',`
- `src/app/presentation/life-species-visual/vida38-certificacion-funcional-38-4a.spec.ts:139` · `(c.variantSeedUint32+1)>>>0}`
- `src/app/presentation/life-species-visual/vida38-civilized-humanoid-fixtures-38-2r.ts:23` · `vida38Hash38R('${speciesId}|seed'),appearanceFingerprint:fingerprint,`
- `src/app/presentation/life-species-visual/vida38-civilized-insectoid-fixtures-38-2q.ts:33` · `hash32('seed:'+speciesId),appearanceFingerprint,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2o.spec.ts:9` · `996633, appearanceFingerprint: '38-2o:${id}',`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oa.spec.ts:10` · `996633,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2ob.spec.ts:10` · `996633,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oc.spec.ts:10` · `996633,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od.spec.ts:11` · `382000,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od2.spec.ts:11` · `382002,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od3.spec.ts:9` · `382003, appearanceFingerprint: '38-2od3:${id}',`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od4.spec.ts:9` · `382004, appearanceFingerprint: '38-2od4:${id}',`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2od5.spec.ts:10` · `382005,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe.spec.ts:12` · `382006,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe2.spec.ts:26` · `382007, appearanceFingerprint: v.appearanceFingerprint,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe3.spec.ts:12` · `382007,`
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-38-2oe4.spec.ts:11` · `382004,`
- `src/app/presentation/life-species-visual/vida38-fungi-38-2m.spec.ts:14` · `381827,`
- `src/app/presentation/life-species-visual/vida38-humanoid-face-38-2gd.spec.ts:20` · `0x12efab84,`
- `src/app/presentation/life-species-visual/vida38-humanoid-material-stability-38-2ga.spec.ts:16` · `0x51a7b1e2,`
- `src/app/presentation/life-species-visual/vida38-humanoid-morphology-38-2f.spec.ts:21` · `0xacab1234,`
- `src/app/presentation/life-species-visual/vida38-humanoid-organic-field-38-2e.spec.ts:15` · `seed,`
- `src/app/presentation/life-species-visual/vida38-humanoid-organic-regional-material-38-2gb.spec.ts:16` · `0x88127ea1,`
- `src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2g.spec.ts:23` · `0xb19fa011,`
- `src/app/presentation/life-species-visual/vida38-humanoid-refinement-38-2gc.spec.ts:23` · `0xf003201a, appearanceFingerprint: '38gc-controlled-test',`
- `src/app/presentation/life-species-visual/vida38-humanoid-torso-38-2ge.spec.ts:16` · `149,`
- `src/app/presentation/life-species-visual/vida38-insects-38-2k.spec.ts:12` · `0x6e8c971a,appearanceFingerprint:'38k-specimen',`
- `src/app/presentation/life-species-visual/vida38-mammals-38-2h.spec.ts:12` · `0x124a9e11,appearanceFingerprint:'mammal-digest',`
- `src/app/presentation/life-species-visual/vida38-microbes-38-2n.spec.ts:14` · `382001, appearanceFingerprint: 'microbe-spec:${id}',`
- `src/app/presentation/life-species-visual/vida38-no-decorative-rocks-38-2mb.spec.ts:20` · `424242,`
- `src/app/presentation/life-species-visual/vida38-no-decorative-support-38-2ma.spec.ts:9` · `424242,appearanceFingerprint:'fp:${id}',`
- `src/app/presentation/life-species-visual/vida38-plant-canopy-support-38-2la.spec.ts:11` · `0x8cae2481, appearanceFingerprint: '38.2la-cue',`
- `src/app/presentation/life-species-visual/vida38-plants-38-2l.spec.ts:9` · `8765432,appearanceFingerprint:'test-plant',`
- `src/app/presentation/life-species-visual/vida38-primitive-humanoid-fixtures-38-2x.ts:13` · `seed,appearanceFingerprint:'LAB_ONLY/38X/${speciesId}',`
- `src/app/presentation/life-species-visual/vida38-primitive-insectoid-fixtures-38-2v.ts:28` · `vida38Hash38T(speciesId+'|seed'),appearanceFingerprint,`
- `src/app/presentation/life-species-visual/vida38-primitive-reptilian-fixtures-38-2u.ts:26` · `vida38PrimitiveHash38U(speciesId+'|seed'),appearanceFingerprint,`
- `src/app/presentation/life-species-visual/vida38-reptile-body-visibility-38-2ja.spec.ts:24` · `0x6215af12,`
- `src/app/presentation/life-species-visual/vida38-reptile-dentition-38-2jb.spec.ts:15` · `0x6c3591fb,appearanceFingerprint:'reptile-dental-test',`
- `src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p.spec.ts:12` · `382020,`
- `src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p1.spec.ts:11` · `382021,`
- `src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p1a.spec.ts:11` · `3820211,`
- `src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p2.spec.ts:13` · `382022,`
- `src/app/presentation/life-species-visual/vida38-reptile-eyes-38-2p2a.spec.ts:12` · `382022,`
- `src/app/presentation/life-species-visual/vida38-reptiles-38-2j.spec.ts:12` · `0x04d2a12a,appearanceFingerprint:'reptile-specimen',`
- `src/app/presentation/life-species-visual/vida38-reptilian-gallery-fixtures-38-2oe5.ts:56` · `seed32('seed:${speciesId}'),`
- `src/app/presentation/life-species-visual/vida38-reptilian-test-fixtures-38-2s8c.ts:37` · `seed32('seed:${speciesId}'),`
