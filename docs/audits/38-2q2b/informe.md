# 38.2q2b — Informe de corrección de test

- Incidencia reproducida conceptualmente: `bounds.max.y` esperado `>1.38`, observado `1.25`.
- Origen: `VIDA38_Q2_COLONIAL_WORK_SKIRT`, prenda secundaria cuya definición establece `top:1.25`.
- Contrato de test corregido: validación de mallas individuales contra sus cotas declaradas; test de altura global reservado a la prenda exterior principal.
- Cambios en runtime: ninguno.
- Verificación local: compilación sintáctica TypeScript del archivo de test, sin diagnósticos.
- Pendiente: ejecutar Vitest y Angular build dentro de `genesis-web`.
