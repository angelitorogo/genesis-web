# Auditoría GENESIS 38.bis-T3c — Identidad de fixtures en ordenaciones T3

## Síntomas

`genesis-universal-archive-t3-scientific-sorts.spec.ts` fallaba en **2 de 8 pruebas**:

- Booleanos globales: recibido `A,B,D,C`; esperado `A,D,B,C`.
- Reconstrucción localizada: recibido `C,B,A`; esperado `B,C,A`.

Los valores booleanos se ordenaban correctamente (`No`, `Sí`, `Sin determinar`), y los desconocidos estaban al final. La diferencia estaba en el **desempate de valores iguales entre galaxias**.

## Causa comprobada en el código

En producción, `genesis-universal-archive-38-bis.index.ts` envuelve la fila con `archiveRowId(scope,category,galaxyIndex,id)`, es decir `JSON.stringify([scope,category,galaxyIndex,id])`.

Dexie ordena el índice de valores derivados globales `[scope+category+field+available+value+rowId]`. Los empates se deshacen por `rowId` (identidad compuesta de producción, que incluye la galaxia). El fixture fallido asignaba `row.id=id`, donde `id` era solo una letra. Ese fixture **no representaba el identificador que genera la aplicación**: por ello cambiaba el desempate secundario aunque el indexador funcionase con sus datos reales.

## Corrección

1. El `row()` de pruebas usa la identidad compuesta real, sin modificar las filas del motor ni las claves persistidas.
2. Las comprobaciones de designaciones visibles utilizan `row.title`, que sigue conteniendo las letras `A/B/C/D`; los **órdenes esperados originales permanecen idénticos**.
3. Se añade regresión de dos galaxias y 26 registros para comprobar la identidad compuesta, desempate y paginación 25+1 en ambos sentidos.
4. Se mantiene el contrato de desconocidos al final y todas las pruebas científicas de T3.

## No se modifica

- Código de producción y reglas de ordenación.
- Esquema ni registros IndexedDB.
- 210 fragmentos o índices derivados previamente guardados.
- Confirmaciones, VIDA, geografía, escenas y UI.

## Validaciones aquí

- Auditoría portable de identidad, desempate, aserciones y sintaxis TypeScript: **PASS**.
- Se verifica empaquetado y ZIP.
- **No se ejecuta Vitest/Angular localmente:** el material fuente extraído no incluye `node_modules`. Debe ejecutarse `npx ng test --watch=false --include=...` en el proyecto del usuario.

## Limitación

El orden entre valores booleanos idénticos depende de `rowId` tal como está definido en producción. Esta corrección no introduce otra política de desempate ni afirma que la ordenación por *nombre público de galaxia* esté implícita en las ordenaciones booleanas: la ordenación explícita `Galaxia` utiliza una columna diferente.
