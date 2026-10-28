# GENESIS Web — VIDA.0: limpieza y sustitución

### Objetivo
Retirar la generación científica de vida 33.1–33.11 / 33.F, sus integraciones en catálogos, repositorios, vistas diagnósticas, datos y pruebas. Conservar galaxias, sistemas, planetas, lunas, atmósferas, océanos, órbitas, gravedad, exploración, conocimiento y partidas.

### Instalación
Colocar el ZIP incremental en la raíz del proyecto y ejecutar:

```powershell
Expand-Archive -Path .\genesis-VIDA0-limpieza-sustitucion-INCREMENTAL.zip -DestinationPath .\ -Force
node scripts/aplicar-genesis-vida0-limpieza.cjs --check
node scripts/aplicar-genesis-vida0-limpieza.cjs --apply
node --test scripts/auditar-genesis-vida0.spec.cjs
npm run test:architecture
```

El borrado se realiza mediante un **manifiesto SHA-256** de los archivos del ZIP original recibido. Si algún archivo ha cambiado después, `--apply` aborta sin borrar ninguno. El ZIP por sí solo no puede eliminar módulos antiguos; ejecutar el comando Node es obligatorio.

### IndexedDB
Esquema actual: **V7** (versión nativa Dexie 70). Elimina `privateBiospheres` y `privateBiosphereAudits`. Conserva las tablas de universos, galaxias, descubrimientos, observaciones, progreso, navegación y snapshots de catálogo. Mantiene las migraciones V1–V6 para permitir actualizar partidas antiguas. El formato de copia nuevo es V1 (solo partida); la importación V2 mantiene las partes de partida y omite la carga biológica obsoleta. Ninguna base se crea como parte del instalador.

### Alcance y trabajo posterior
Se retira la ciencia dedicada a decidir abiogénesis/biosignaturas/vida (33.x, 33.F, PRE-33.11a–c y PRE-33.12). Se preservan los motores físicos que **siguen siendo dependencias** de fichas, simuladores y catálogos. La reducción radical del contenido visible de las fichas es **VIDA.1**: eliminar ahora dichos productores rompería la presentación vigente antes de tener su reemplazo.

### Validaciones en tu repositorio

```powershell
node --test scripts/auditar-genesis-vida0.spec.cjs
npx ng test --watch=false --include="src/app/presentation/runtime/galaxy-planet-moon-catalog-snapshot.runtime.spec.ts" --include="src/app/data/local/indexed-db/genesis-indexed-db.spec.ts" --include="src/app/data/local/indexed-db/genesis-indexed-db-migrations.spec.ts" --include="src/app/data/local/backup/dexie-genesis-backup.service.spec.ts"
npm run test:architecture
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

**No crear una nueva partida ni abrir GENESIS hasta confirmar la compilación.** Las pruebas visuales de nueva partida comenzarán solo cuando se indique expresamente.
