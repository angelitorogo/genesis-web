# VISCIV.6m — Sombra del planeta sobre los anillos

## Alcance
- Oclusión geométrica direccional analítica: segmento→estrella contra esfera del planeta.
- Sombra por instancia sobre vigas, armazones, módulos, niveles, nodos, distritos y astilleros de los anillos.
- Penumbra de aproximación visual suave alrededor del borde del planeta (4,5 % del radio), sin pretensión de reconstruir el tamaño angular real de cada estrella.
- 1–3 fuentes estelares combinadas mediante los pesos que ya aporta cada visor.
- Materiales metálicos atenuados por `instanceColor`; las luces artificiales `MeshBasicMaterial` no se apagan.
- Reutiliza la actualización nocturna de VISCIV.6g/6j; ambas escenas comparten exactamente la implementación.
- Los vehículos móviles de VISCIV.6k quedan excluidos de esta primera pasada: la sombra afecta a la **estructura fija** de los anillos. No se altera el tráfico.
- La nueva máscara es visual; no se cambian órbitas físicas, VIDA, ciencia, ni IndexedDB.

## Rendimiento
Se precalculan las posiciones de las instancias una vez. Por fotograma se actualiza un multiplicador de color de material por instancia; sin render targets, shadow maps, luces físicas, nueva geometría ni texturas por frame. Se liberan los `InstancedMesh` con el ciclo de vida del visor.

## Verificación
- Auditoría portable: `node scripts/auditar-genesis-visciv-6m.spec.cjs`
- Vitest: `npx ng test --watch=false --include=src/app/presentation/system/system-scene-orbital-planet-shadow-visciv6m.spec.ts`
- Regresión de VISCIV.6g / 6j / 6k / 6l.
- Tests generales y build de Angular pendientes de ejecutar en el entorno del usuario.
