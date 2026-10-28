# VIDA.0 — Reparación de instalación incompleta (V7)

**Problema:** `genesis-indexed-db-migrations.ts` ya importa VERSION_V7/STORES_V7, pero el archivo de esquema no tiene esos símbolos; y los archivos antiguos `biosphere-v3-*` y `dexie-native-biosphere-*` continúan en el proyecto. `Expand-Archive` actualiza archivos, pero **no elimina** archivos descartados.

Este paquete repite los archivos corregidos de VIDA.0 e incorpora una verificación final. No introduce nuevos motores de biología, no restaura tablas biológicas, no modifica físicos ni crea IndexedDB.

Desde la raíz del proyecto:

```powershell
Expand-Archive -Path .\genesis-VIDA0-hotfix-instalacion-completa-V7-INCREMENTAL.zip -DestinationPath .\ -Force
node scripts/reparar-genesis-vida0.cjs --apply
node --test scripts/auditar-genesis-vida0.spec.cjs
npm run test:architecture
npx ng build
```

**Protección:** el instalador solo borra los 161 archivos de la lista original cuando su SHA-256 es idéntico al origen recibido. En caso de modificaciones posteriores, se detiene y muestra las diferencias. `--check` nunca elimina archivos. Volver a ejecutar `--apply` después del éxito es idempotente.

**Nota:** si el instalador detecta hashes modificados o imports rotos, no borres archivos a mano; envía la salida para preparar un parche ajustado. No crees todavía universo o IndexedDB para VIDA.0.
