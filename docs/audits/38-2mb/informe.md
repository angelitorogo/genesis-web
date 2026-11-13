# GENESIS Web — 38.2m.b

## Incidencia
Los modelos con hábitat `SURFACE_ROCK_SHELTER` recibían cuatro piedras decorativas, con mallas `THREE.DodecahedronGeometry`, en `addBaseCue(...)`. Estaban fuera de la geometría científica del organismo y aparecían a los pies de especies de cualquier grupo.

## Corrección
- Se elimina globalmente la generación de esas piedras de atrezzo.
- El escenario mantiene exclusivamente su plataforma, así como los otros recursos de hábitats no afectados.
- Se preservan 28 consumos de RNG legado (4 piedras × 7 sorteos cada una) para no alterar la anatomía procedural de especies con hábitat rocoso.
- Se conserva el hotfix 38.2m.a que eliminó el palo CANOPY.
- Se añade regresión para ocho grupos y auditoría CJS.

## Alcance
Exclusivamente el escenario decorativo del visor 38.2. No altera procedencia científica, taxonomía, medidas, geom. anatómica ni persistencia.

## Validación
Ejecutar los comandos del LEEME en el árbol completo de GENESIS Web. Las pruebas Angular y el build finales requieren el proyecto local del usuario.
