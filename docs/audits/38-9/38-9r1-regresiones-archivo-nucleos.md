# GENESIS 38.9R1 — Reconciliación de regresiones de Archivo y núcleos

## Entrada

Registro local aportado el 26/11/2026: **24 tests fallidos / 6.953 correctos**, en 3 archivos de prueba. No consta un fallo de `ng build` asociado al registro.

## Diagnóstico

- **21 fallos** de `genesis-archive.spec.ts` y `genesis-universal-archive-list-layout-38-bis-b2.spec.ts` proceden de dobles de prueba incompletos: el componente ARCHFAST.1 invoca `facade.updateJobsArchfast1()` y los stubs no lo implementaban.
- **3 fallos** de `archive-discovery-detail.facade.spec.ts`: la fachada NUCLEUS-SYNC.1 publica primero la ficha canónica y después resuelve por separado 28.5 (jets), 28.6 (lentes) y completitud. Las aserciones antiguas suponían que `await load()` publicaba también esas observaciones.
- **Error funcional asociado:** tras persistir `analyze`, `performRelativisticJetAnalysis()` y `performGravitationalLensingReconstruction()` deducían el mensaje de detección desde un campo opcional que podía seguir a `null`, produciendo una falsa «no detección».

## Cambios aplicados

1. Los dos stubs del Archivo ahora exponen el contrato `updateJobsArchfast1` sin cambiar la plantilla ni el indexador. Se añade una regresión de la visualización del trabajo por galaxia, categoría y ordenación.
2. Los tests 28.5 y 28.6 esperan la resolución asíncrona con `vi.waitFor`, sin exigir que la ficha científica espere a los estudios opcionales.
3. Después de `analyze`, la fachada realiza `resolveDetails` y recupera la inspección científica si el estado auxiliar aún no se ha materializado; verifica `resolutionVersion` para descartar respuestas antiguas. Se comprueba `analyzed` antes de interpretar la firma; una lectura no disponible solicita actualizar la ficha y no repite la observación.
4. Nueva prueba de estado científicamente persistido con lectura auxiliar todavía ausente: no debe informar falsamente «no detección».

## No se modifica

Generadores, modelos científicos, reglas de descubrimiento, PD, Dexie, los índices del Archivo, pantallas 3D, Three.js, LODGRP ni recursos WebGL.

## Validación en este entorno

- Auditor estático: incluido y ejecutado.
- Análisis de sintaxis TypeScript: realizado con compilador global, sin errores sintácticos en los cuatro archivos modificados.
- Pruebas Angular, Vitest y build: **no ejecutados**; la copia recuperada es parcial y carece de `node_modules`.
- `npm run test:architecture` **no concluye satisfactoriamente con la copia parcial**: el paquete diagnóstico del usuario incluye `src/app` pero carece de la capa raíz `observation` exigida por el verificador de arquitectura. No hay evidencia de regresión arquitectónica, pero esta comprobación debe realizarse en el proyecto completo.

## Validación local

Ejecutar el auditor del ZIP, las 4 suites orientadas con **un único `npx ng test`**, `npm run test:architecture`, batería general y `npx ng build`. Ver LEEME en la raíz del ZIP.

## Instalación

Aplicar sobre la versión que ya incluye GENESIS 38.9 y ARCHFAST.1a, sin eliminar otros archivos del repositorio. Mantener una copia o commit anterior para volver atrás si aparece alguna diferencia inesperada.
