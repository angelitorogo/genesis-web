# GENESIS · Fase 38.2r — Civilizaciones humanoides MUY AVANZADAS

## Alcance

Nueva rama visual **HUMANOID/VERY_ADVANCED** con SDF humanoide continuo heredado de 38.2e/38.2g.e. Variaciones de anatomía, seis culturas, ocho roles, diez familias de indumentaria, seis acabados materiales y accesorios deterministas.

La rama se conecta en `BIPED_BODY` exclusivamente mediante un selector de civilización tipado `civilizationTier` para no modificar humanoides sin civilización ni los futuros ADVANCED/PRIMITIVE.

La galería del Laboratorio «Civilizaciones» añade la tercera pestaña «Humanoides · Muy avanzados», 12/24 especies ficticias, tres vistas y apertura en el visor real.

## Pruebas

- Auditor CT-0 Node: selección reproducible y cobertura de variantes.
- Vitest: selector, variedad, continuidad SDF, vestuario técnico y prendas blandas, finitud geométrica.
- Integrador idempotente y con copia de seguridad.

## Limitaciones

No se deducen culturas, atuendos ni rasgos sociales como observaciones científicas: son hipótesis artísticas proceduralmente derivadas de la identidad.
