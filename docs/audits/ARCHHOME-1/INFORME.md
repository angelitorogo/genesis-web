# GENESIS ARCHHOME.1 — Restauración del enlace a Home en el Archivo

## Incidencia y diagnóstico

En el Archivo GENESIS, tanto `/archive` como `/archive/catalog/:category`, desapareció el enlace superior «Volver a Home». Se comprobó que los estilos `.archive-header` y `.archive-home-link` permanecían en `genesis-archive.scss`, y que el test `genesis-archive.spec.ts` todavía exigía `data-testid="archive-home-link"`, `href="/"` y una única presencia incluso tras cargar datos. El elemento faltaba de `genesis-archive.html`.

## Solución

Se recupera una cabecera con `genesis-section-title` y un `<a routerLink="/">` usando las clases y `data-testid` preexistentes. El enlace se sitúa antes de las ramas `loading`, `empty`, `error` y `ready`, por lo que siempre está disponible y no depende del universo o categoría seleccionados. Los estilos existentes lo sitúan a la derecha en escritorio y arriba en móvil.

## Alcance

Se modifica **solo** `src/app/presentation/genesis-archive/genesis-archive.html`. Se incorpora una auditoría portátil de regresión y este informe. Sin cambios en SCSS, TypeScript de producción, rutas, indexación, caché, persistencia, fichas, `SystemScene` o nivel de conocimiento.

## Instalación en la raíz de `genesis-web`

```powershell
Expand-Archive -Path .\genesis-ARCHHOME-1-restauracion-enlace-home-INCREMENTAL.zip -DestinationPath . -Force
```

## Comprobaciones

```powershell
node scripts/auditar-genesis-archhome1.spec.cjs
npx ng test --watch=false --include=src/app/presentation/genesis-archive/genesis-archive.spec.ts
npm run test:architecture
npx ng build
```

Comprobar visualmente el botón en la cabecera del Archivo y dentro de `/archive/catalog/planets`, tanto con el índice cargado como durante carga o error. Al pulsarlo, debe navegar a `/`.

La auditoría portátil puede ejecutarse sin las dependencias Angular; Vitest y `ng build` requieren las dependencias instaladas en el entorno del usuario. No confundir la auditoría estática con una prueba de navegador.
