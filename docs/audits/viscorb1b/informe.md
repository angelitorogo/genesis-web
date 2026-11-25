# Auditoría GENESIS VISCORB.1b

## Alcance

Reajuste visual del radio aparente lunar de la vista conjunta y de `SystemScene` local; manteniendo la proyección orbital y el conocimiento científico. Parte de VISCORB.1a (ya validado por el usuario).

## Contrato matemático

Para cualquier radio lunar físico positivo y encuadre local válido, el radio visual nuevo `R_1b` satisface `R_1b = 0.85 × R_1a`, también cuando interviene el suelo de legibilidad o los límites de tamaño de la luna mayor. La escala mínima/máxima transitoria de `SystemScene` se multiplica por 0.85 para no neutralizarlo en casos extremos. Las funciones de órbita no cambian.

## Pruebas disponibles

- Auditoría VISCORB.1b con escenarios de dos lunas, luna única, luna exterior lejana y luna de tamaño diminuto, comparando con la ecuación real de VISCORB.1a.
- Auditoría VISCORB.1a actualizada para admitir la segunda reducción; conserva su prueba de fixture lunar completo.
- Vitest anterior actualizado y Vitest nuevo con comprobación de reducción exacta del 15 %.
- Auditoría VISCORB.1 sin cambios.

**Pendiente de ejecución en instalación real:** Vitest Angular, compilación completa, baterías generales, WebGL y revisión de proporciones en Xephus B-11.
