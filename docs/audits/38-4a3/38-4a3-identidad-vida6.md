# GENESIS — 38.4a3 · Trazabilidad de `species.id` VIDA.6

Archivos TS revisados: 1207
Mapper anclado a species.id: sí
Candidatos de asignación/uso en VIDA: 2
Candidatos con términos espaciales cercanos: 0

## Evidencias

- `src/app/domain/life/vida6-ecosystems-species.ts:36`  — `readonly bioluminescent: boolean; } export interface Vida6Species { readonly id: string; readonly proceduralName: string; readonly group: Vida4Group; readonly habitat: Vida6HabitatKind;`
- `src/app/simulation/life/vida6-ecosystems-species.ts:151`  — `const meal = nutrition(group,habitat,key+'|meal'); const detail = traits(group,habitat,meal,key); const name = `${pick(NAME_A,key+'|a')}${pick(NAME_B,key+'|b')} ${pick(NAME_C,key+'|c')}${String(i+1)}`; species.push(Object.freeze({id:`vida6:${hash(key).slice(0,24)}`,proceduralName:name, group,habitat`

## Límites de certificación

- Coincidencias textuales NO prueban la dependencia transitiva de species.id.
- Un ID biológico puede codificar su origen natal legítimo: estabilidad entre vistas exige conservar ese mismo ID, no regenerarlo en otro mundo.
- La prueba de JSON NO equivale a un backup/restore IndexedDB real.
- Para certificar generación VIDA.6 son necesarios fixtures productivos y acceso al generador/repository real.

**Veredicto:** REQUIERE_VALIDACION_GENERADOR (no bloquear build por un auditor conservador).
