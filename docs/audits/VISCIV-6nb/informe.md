# VISCIV.6n.b — Auditoría del hotfix visual

**Origen:** capturas en las que se aprecian rayas periódicas dentro de la sombra de los anillos.

**Causa:** modulación angular de opacidad (`trusses`, `nodes` y `monumentalSectors`) introducida en VISCIV.6n.a; con una frecuencia de 96 repeticiones en el caso de las vigas.

**Modificación:** se sustituye la modulación por opacidad homogénea `0.80`. Se conserva el factor `0.93`, ancho mínimo `0.155` radios planetarios, penumbra `0.024`, refuerzo de ancho según incidencia `0.030` y recorte suave `0.72`. No cambia la ecuación de intersección ni su combinación por hasta tres estrellas.

**Pruebas:** los tests previos de VISCIV.6n/6n.a dejan de exigir bandas angulares; se incorpora una regresión que prohíbe su reintroducción y una auditoría portable sobre 4.096 fases.
