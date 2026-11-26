# GENESIS NUCLEUS-SYNC.1 — Reparación acotada a núcleos activos galácticos

## Base y alcance

Código reconstruido desde `genesis-diagnostico-progresion-conocimiento.zip` del usuario con los parches posteriores `LIVE-SCI.1` y `LIVE-SCI.2`, en ese orden. No se modifica código de generación, IndexedDB, economía de PD, renderizadores, shaders, otros cuerpos o sistemas estelares.

## Diagnóstico

1. `ArchiveDiscoveryDetail.ngOnInit()` leía `ActivatedRoute.snapshot` una única vez. Si Angular reutilizaba la misma instancia al cambiar entre núcleos, no se volvía a cargar la ficha del nuevo destino.
2. `resolveDetails()` esperaba las inspecciones de jets (28.5), lentes (28.6) y el asentamiento del expediente (28.7) **antes** de publicar el contenido del núcleo ya `CONFIRMED`. Un fallo en cualquiera podía devolver `false` y conservar un modelo desactualizado con botón de etapa anterior.
3. Las pruebas LIVE-SCI cubrían un ejemplo V2, pero no el ciclo V3 del núcleo del reporte ni el aislamiento ante fallos simultáneos de estudios complementarios.

## Implementación

- Observación de cambios de ruta **solo cuando el origen o destino es el objeto central del sector 0**, con identidad deduplicada y liberación de la suscripción al destruir el componente. La inicialización de otras fichas no se altera.
- En núcleos activos confirmados, el modelo científico canónico y el render se publican primero; jets, lentes y completitud se consultan posteriormente mediante `Promise.allSettled` y actualizan únicamente esos tres campos en el modelo actual. Se descarta el resultado si el usuario navega a otro objeto durante la operación.
- El motor de completitud sigue siendo el mismo, con recompensa exactamente una vez según su contrato transaccional. No se repite ninguna acción observacional ni se crean PD adicionales por refresco.
- Se añade un aviso y la posibilidad de **reintentar la lectura del expediente complementario** solamente si algún complemento falla, sin reejecutar la acción científica principal.
- Una excepción tardía de una acción antigua del núcleo ya no aparece en la ficha de otro núcleo al navegar.

## Pruebas incorporadas

- `archive-nucleus-route-sync.spec.ts`: reutilización de la ruta V3, deduplicación y liberación de suscripción.
- `archive-nucleus-sync-v3.spec.ts`: progresión de núcleo V3 completo, persistencia de la identidad del render, transición instantánea a `CONFIRMED` con tres estudios pendientes y aislamiento ante los tres estudios fallidos.
- `scripts/auditar-genesis-nucleus-sync-1.spec.cjs`: comprobación estructural independiente.

### Verificaciones locales de este entorno

Se ha ejecutado el parser/transpilador TypeScript con diagnóstico sin errores sintácticos. Se ha ejecutado el auditor independiente. **No se han ejecutado Vitest/Angular build:** este ZIP de diagnóstico no trae `node_modules`; no corresponde declarar el cierre funcional hasta ejecutar las pruebas en el proyecto completo del usuario.

El verificador general de arquitectura del repositorio reconstruido informa que falta la capa `src/app/observation`, que tampoco viene incluida en el ZIP de diagnóstico. Esa limitación de la fuente reconstruida no se resuelve artificialmente añadiendo directorios ajenos al parche.

## Instalación y pruebas (PowerShell, raíz de genesis-web)

```powershell
Expand-Archive -Path ".\genesis-NUCLEUS-SYNC-1-nucleos-galacticos-INCREMENTAL.zip" -DestinationPath "." -Force
node scripts/auditar-genesis-nucleus-sync-1.spec.cjs
npx ng test --watch=false --include=src/app/presentation/genesis-archive/archive-nucleus-sync-v3.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/archive-nucleus-route-sync.spec.ts
npx ng test --watch=false --include=src/app/presentation/genesis-archive/archive-scientific-stage-live-sync.spec.ts
npx ng build
```

No se añaden scripts PowerShell ni dependencias, ni se modifica `package.json`.
