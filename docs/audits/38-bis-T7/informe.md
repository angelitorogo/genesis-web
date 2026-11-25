# GENESIS 38.bis-T7 — Ordenación por población colonial

## Alcance implementado

El Archivo GENESIS ahora admite ordenación numérica `population` en tres categorías:

| Categoría | Magnitud indexada | Dato mostrado |
| --- | --- | --- |
| Colonias | Punto medio del intervalo VIDA.8 individual | `[mínimo, máximo]` de la colonia |
| Planetas colonizados | Punto medio del intervalo agregado de todas sus colonias verificadas | Suma de mínimos y suma de máximos |
| Lunas colonizadas | Punto medio del intervalo agregado de todas sus colonias verificadas | Suma de mínimos y suma de máximos |

Las tres opciones se presentan como estimaciones. No se publican habitantes exactos inexistentes. Un intervalo inválido o ausente no equivale a cero: se muestra `No evaluable` y se ordena al final, en ambos sentidos.

Ejemplo: OUTPOST `[12,150]`, SETTLEMENT `[151,5000]` y CITY `[5001,120000]` producen el intervalo total **5.164–125.150 habitantes**; el criterio de ordenación es **65.157**. El solapamiento de intervalos significa que este orden **no prueba** que una colonia tenga necesariamente más habitantes reales que otra.

## Origen de los datos y garantía científica

- Fuente: `settlement.colonialPopulationRange` de cada colonia VIDA.8 contenida en un registro persistido VIDA.9.
- Solo se proyectan registros de **sistemas confirmados** con identidad/CT-0/VIDA.8 y digest validados por la lógica que ya utilizaba el Archivo (`validatedColonies38Bis`).
- La población agregada incluye exclusivamente las colonias de ese cuerpo. **No incluye civilizaciones nativas, otras lunas ni otros planetas**.
- La existencia de una colonia en un destino certificado permite publicar su intervalo aunque la identidad del mundo de origen no resulte verificable; nunca se publica un fundador no certificado.
- No se alteran snapshots, persistencia, descubrimientos ni estados de confirmación.
- La agregación devuelve `null` si hay cualquier intervalo inválido, en lugar de mostrar una suma parcial como total del cuerpo.

## Índice y rendimiento

- Se reutiliza la columna derivada `sortRows` de Dexie y el orden numérico global antes de paginar, con dirección ascendente/descendente, límites numéricos, galaxia, filtros y búsqueda.
- La columna solo se construye al seleccionar **Habitantes (estimación)**, igual que las otras magnitudes indexadas.
- La revisión `population-t7-v1` afecta exclusivamente a `colonies`, `colonized-planets` y `colonized-moons`. La comprobación de revisión ya existente publica cada fragmento de forma atómica e invalida índices derivados del fragmento anterior.
- La proyección colonial de las tres categorías comparte caché por galaxia y revisión biológica confirmada; no hace tres reconstrucciones biológicas para el mismo censo.
- Las nuevas confirmaciones siguen los eventos e invalidaciones existentes del Archivo. Si la ordenación por población está seleccionada, `ensureSortField` reconstruye el índice derivado al cargar la nueva revisión.
- **No hay migración IndexedDB** ni recuperación total obligatoria de otros catálogos.

## Casos de prueba

1. OUTPOST, SETTLEMENT, CITY, NETWORK: preservación de extremos reales y punto medio.
2. Planeta/luna con varias colonias: suma exacta de ambos límites del intervalo, sin habitantes nativos.
3. Rangos ausentes, invertidos, negativos, no finitos y desbordamiento de enteros seguros: `No evaluable`.
4. Misma lectura pública en filas individuales, planetas y lunas; sin atribuir procedencias no verificadas.
5. Las tres opciones nuevas son numéricas y no aparecen en las categorías de planetas/lunas no colonizados.
6. Pruebas de integración Dexie por categoría con dos galaxias, orden asc/desc, filtro mínimo/máximo, galaxia, paginación e invalidación tras publicación.
7. Auditoría portable que ejecuta el helper y la **proyección real** de `projectColonyRow` mediante extracción AST, sin Angular/Dexie.

## Validaciones realizadas en el entorno de preparación

- `node scripts/auditar-genesis-38bis-t7.spec.cjs`: **PASS, 68 comprobaciones**.
- Comprobación aislada de tipos estrictos del helper: **PASS**.
- Transpilación sintáctica de TypeScript modificado: **PASS**.
- Validación del ZIP y sus rutas: **PASS**.

**Pendiente en el equipo del usuario:** Vitest con fake-indexeddb, Angular completo, E2E y comprobación visual contra su censo real confirmado. Las pruebas portátiles no equivalen a una ejecución completa del navegador.

## Archivos de producción afectados

- Nuevo helper `genesis-universal-archive-colonial-population-38bis-t7.ts`.
- `genesis-universal-archive-38-bis.index.ts`: proyección de intervalos, cifras de ordenación, revisión y caché colonial.
- `genesis-universal-archive-sort-38-bis-b3.ts`: tres opciones numéricas y rechazo de parsear un intervalo como si fuera un valor único.
- `genesis-universal-archive-list-layout-38-bis-b1.ts`: visualización del rango individual y agregado.
- `genesis-archive.html`: nota aclaratoria al seleccionar el criterio de población.

## No modificaciones

- Sin cambios en VIDA.8, VIDA.9, IndexedDB CT-0 o índice de descubrimientos.
- Sin cambios en COLVIS.2, escenarios 3D, cámaras, superficies VISSURF/LUNSURF ni modelos científicos.
- Sin cambios en `package.json` ni scripts PowerShell.
