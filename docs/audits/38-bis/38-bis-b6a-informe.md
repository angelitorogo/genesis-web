# Auditoría 38.bis-b6a — reparación de transacciones

**Síntoma:** cambios en DiscoveryState persistidos sin refresco de UI; `Transaction has already completed or failed` tras introducir la cola b6.

**Contratos protegidos:**
- DiscoveryState, puntos globales y búsqueda extragaláctica: commit o rollback conjunto.
- La caché del Archivo solo puede recibir eventos de commits realizados.
- Un rollback científico no encola trabajos en el Archivo.
- No se ejecutan operaciones en una segunda IndexedDB durante una transacción científica.
- Avisos repetidos dentro del mismo commit se agrupan, sin mezclar universos.

**Cobertura añadida:** transacción científica con escritura posterior al evento, rollback sin publicación, deduplicación y aislamiento, error del índice sin propagación, catalogación galáctica real de 250 PD con persistencia atómica.

**Validación externa pendiente:** Vitest, build Angular, clics reales en galaxia/sector/sistema y auditoría read-only de acciones realizadas durante la versión defectuosa.
