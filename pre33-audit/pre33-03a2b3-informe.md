# PRE-33.03a.2b.3 — Activación científica explícita con bloqueo de migración canónica

Semilla: 7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5 · SCIENTIFIC_PREVIEW_ACTIVATION_PASSED_CANONICAL_CUTOVER_BLOCKED

| Galaxia | Sistemas | Múltiples | Planetas V2 | Previews estelares opt-in | Rollbacks OK | Migraciones canónicas bloqueadas | Errores |
|---|---:|---:|---:|---:|---:|---:|---:|
| Elixisis | 20 | 6 | 77 | 6 | 6 | 6 | 0 |
| Elisoune | 20 | 3 | 40 | 3 | 3 | 3 | 0 |
| Ilyzenia | 20 | 5 | 71 | 5 | 5 | 5 | 0 |

**Únicamente está activable la revisión ESTELAR en PREVIEW CIENTÍFICA**, con selección explícita y rollback en memoria. El sistema V2 por defecto queda sin cambios.

La reconstrucción integral de remanentes (29/31), órbitas (16), planetas (18/19), atmósferas (20), lunas (21) e historia (32.7/32.12) NO ESTÁ IMPLEMENTADA en la nueva versión. El guard impide explícitamente mezclar snapshots y rechaza el cutover canónico.

La persistencia de partidas y la migración pública NO están activadas. Esta entrega no declara física CT-0 ni océanos certificados.

Próximo requisito: generadores de dependencias atómicas bajo una nueva versión PUBLICA y pruebas de migración/rollback de datos antes de activar juego real.
