# Informe de implementación GENESIS LODMAX.1

## Motivo

Al acercarse a planetas/lunas, el `updateBodyLod()` original activa geometrías LOW/MEDIUM/HIGH, atlas planetarios VISSURF/VISCATM, atlas lunares LUNSURF y atlas de cuerpos menores 38.7x con mecanismos independientes. El coste de generación síncrona durante el zoom puede producir saltos perceptibles.

## Experimento implementado

**No se modifica la política de producción.** `?genesisLod=max` habilita un único modo de estrés de sistema completo. El sistema se monta en HD desde el primer fotograma; desaparecen los refinamientos dependientes de distancia. `?genesisLod=adaptive` permite medición idéntica sobre el comportamiento anterior. Sin parámetro, todo sigue como antes, sin panel ni trabajo adicional significativo.

- 1024×512 para cada planeta y luna, usando el generador científico existente sin nuevas semillas o simulaciones.
- Geometría 144×104 compartida entre superficies planetarias, lunas regulares y capas de gigantes gaseosos. Se retienen geometrías nativas irregulares.
- No se descarga/destruye el detalle al alejarse, ni se instalan texturas en tiempo de zoom.
- Los atlas de cuerpos menores que tienen contrato 38.7x se instalan al inicio y se conservan hasta el desmontaje; se restaura y dispone cada recurso.
- Lunas ocultas se materializan también al inicio, respetando la capa de visibilidad.
- Infraestructuras con nivel cercano permanente; sin alterar sus planes coloniales.
- HUD y consola con carga, FPS, CPU/frame, p95, draw calls, triángulos, contadores de geometrías y texturas.

## Riesgos

La prueba busca deliberadamente estrés: el tiempo inicial, el uso CPU y la memoria pueden ser elevados, especialmente con muchos satélites. Requiere recargar al alternar los modos. No prueba que la opción de detalle máximo sea viable como configuración permanente ni garantiza 60 FPS. Los tipos de cuerpo sin atlas HD no reciben detalle inventado.

## Garantías

Paridad ficha/escena: generadores y seeds existentes. Solo `SystemScene` cambia bajo el modo experimental. No se modifica ninguna capa de simulación, universo, catálogo, persistencia, ni interfaz normal.

## Pruebas ejecutadas

Auditorías LODMAX: 42; VISCORB1: 48; VISCORB1a: 31; VISCORB1b: 30. Arquitectura: PASS. AST TypeScript: PASS. **Pendientes**: compilación Angular/Vitest, WebGL real, FPS, p95 y comparación visual.
