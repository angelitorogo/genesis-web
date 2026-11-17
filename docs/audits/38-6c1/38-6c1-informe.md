# Auditoría de alcance 38.6c1

- **Sí cambia:** el LOD del render de colonias autorizadas de VIDA.8 bajo 200px. Se añade el grupo `VIDA.38.6c1 distant colonial infrastructure` y una escala visual suave y acotada.
- **No cambia:** `vida38-infrastructure-plan-38-6.ts`, `vida38-colonial-complex-38-6c.ts`, `vida38-day-urban-visual-38-6a.ts`, `SystemScene`, fuentes de luces nocturnas, VIDA.6/7/8/9, fichas, IndexedDB ni posición procedural.
- **Continuidad:** el LOD lejano es la misma geometría de tipo medium con escala 1 en 200px; no hay transición espacial.
- **Escala:** factor `min(3.5, max(1, sqrt(200/diametro)))`, con diámetro positivo y finito; tamaño aparente crece con el zoom.
- **Ausencias:** no hay LOD lejano si no se ha generado un plan colonial 38.6 válido o el layout 38.6c lo rechaza. No hay luces nuevas.
- **Render:** mismo mecanismo de profundidad/oclusiones; sin panel HTML ni sprites que revelen localizaciones ocultas.
- **Rendimiento:** se añaden pocos `InstancedMesh` de nivel medio solo a planes coloniales; nunca se renderizan en paralelo con el LOD medio/alto; instancias y recursos se liberan al desmontar.
- **Compatibilidad:** se preservan los dos primeros hijos de `group` como `medium` y `high`. Las pruebas antiguas se mantienen sin relajar.

## Comprobaciones efectuadas

- Arquitectura: PASS — 1.216 archivos productivos.
- Sintaxis de los 2 ficheros TypeScript: PASS.
- Comportamiento matemático independiente de la escala: PASS.
- Angular build, Vitest, navegador/LOD GPU, persistencia real: NO EJECUTADOS AQUÍ.
