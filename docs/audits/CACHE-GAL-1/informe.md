# GENESIS CACHE-GAL.1 — Auditoría de rendimiento y restauración de cachés galácticas

## Fuente revisada

Paquete actual del usuario `genesis-diagnostico-cache-galaxias.zip` (2.703 archivos, `src/app` y configuración Angular), recibido el 23-11-2026. Se inspeccionaron los flujos de `DiscoveredGalaxiesFacade`, `GalaxyDetailFacade`, `GalaxyKnowledgeCatalogFacade`, el repositorio Dexie y los snapshots de conocimiento de galaxia.

## Hallazgos contrastados en código

1. `DiscoveredGalaxiesFacade.refresh()` se invoca al montar la pantalla, al recuperar el foco de ventana y tras los cambios de galaxia. Siempre volvía a cargar todos los `KnownDiscovery` del universo y generaba el tipo y la malla de sectores de cada galaxia descubierta.
2. `GalaxyDetailFacade.load()` volvía a hidratar las filas de conocimiento del universo, incluso si la galaxia ya se había visitado; el snapshot estadístico persistido existía, pero la telemetría restringida a objetos confirmados se reconstruía en cada carga.
3. Los catálogos científicos usan lecturas por índice de galaxia y conservan snapshots derivados de planetas/lunas y otros objetos. **No se eliminan esas cachés ni sus contratos de descubrimiento.** Sin embargo, la lectura por galaxia se ejecutaba de nuevo al reabrir los catálogos; si había muchas filas, rehidratarlas y ordenarlas repetidamente seguía siendo costoso.
4. La causa exacta de la regresión temporal no puede atribuirse de forma concluyente a un cambio concreto sin un perfil de navegador/IndexedDB del entorno del usuario. Los puntos 1–3 son trabajo repetitivo comprobado estáticamente y constituyen oportunidades de optimización concretas.

## Intervención integrada

- Caché **compartida, en memoria y acotada** (6 entradas) de lecturas de `KnownDiscovery` del repositorio raíz, identificadas por universo, versión del generador, galaxia y filtro de tipo. Las consultas simultáneas comparten la misma promesa. Los errores no se memorizan. Las lecturas dentro de una transacción Dexie no utilizan caché para garantizar lectura de los cambios no confirmados de esa transacción.
- Invalidación al escribir `DiscoveryState` y en los eventos `storagemutated` de Dexie, cubriendo transacciones ajenas, restauraciones y otras conexiones. Se invalidan cambios en `discoveries` y `universes`; las escrituras de materialización VIDA.9 o snapshots derivados no descartan los descubrimientos sin motivo.
- Caché limitada a 64 entradas de **tipo físico y total de sectores deterministas** por galaxia. Los porcentajes de exploración siguen recalculándose sobre `KnownDiscovery` autorizado.
- Caché de 4 entradas para la telemetría científica **solo confirmada** de fichas, validada contra `knowledgeRevision` persistida.

## Garantías

- No introduce datos privados de generación ni revela nuevos objetos.
- No cambia persistencia, esquemas de Dexie, semillas, fichas, visuales, VIDA.8/VIDA.9, COLVIS, ni la fase 37/38.7.
- La caché de lectura no modifica las entidades de `KnownDiscovery` ni inventa niveles de observación.
- Los datos dependientes del progreso científico se recalculan después de cambios reales de descubrimientos.
- Todas las cachés nuevas están acotadas en memoria y no sobreviven a una recarga de la aplicación.

## Pruebas locales realizadas

- Auditoría portátil TypeScript (transpilación sintáctica de los ficheros modificados) y 27 comprobaciones del comportamiento de la caché (concurrencia, aciertos, claves, errores, invalidación, límites y conocimiento confirmado).
- Compilación Angular/Vitest integrada y perfil WebGL/IndexedDB **no ejecutados aquí**: requieren la instalación completa y los datos locales reales del usuario.

## Criterio de aceptación propuesto

Verificar que los tiempos de *segunda entrada* a listado y ficha, el cambio de foco y el retorno al catálogo sean sustancialmente menores que la primera entrada; confirmar que descubrir/confirmar nuevos objetos actualiza todo inmediatamente sin reiniciar ni borrar IndexedDB, y que ninguna información bajo CONFIRMED se filtre.
