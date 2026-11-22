# Auditoría 38.bis-T3d — Regreso a Home

- Ruta verificada en `app.routes.ts`: `path: ''` corresponde a `Home`.
- Navegación Angular declarativa: `routerLink="/"` (ya importado `RouterLink` en `GenesisArchive`).
- Link fuera de ramas `@if` para que esté disponible incluso en `loading`, `empty` y `error`.
- Interfaz: cabecera flex responsive, estilo consistente con otras pantallas y foco de teclado visible.
- Prueba unitaria añadida a `genesis-archive.spec.ts` para comprobar destino y disponibilidad en estados vacío y listo.
- Sin cambios de producción en Typescript, modelos de conocimiento, motor de consultas ni bases IndexedDB.
- El auditor portable comprueba los contratos de código. Angular/Vitest y navegador se verifican en la instalación del usuario.
