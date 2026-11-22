# GENESIS 38.bis-T6 — Corrección de giro desmesurado en SystemScene

## Diagnóstico

`SystemScene` invoca `systemSceneBodyDisplaySpinRadians` para girar los planetas; esta función excluía expresamente `isSynchronized` de su compresión y devolvía la fase de rotación física sometida al reloj de simulación acelerado. La ficha científica ya había sido corregida en T5 para presentar planetas sincronizados a un ciclo visual de 240 segundos.

En Chakos B-2, cuyo período físico es 318,913 h (13,288 días), un reloj hipotético de 5 días simulados por segundo ocasionaría 22,6 rpm antes de la corrección. Este valor es una ilustración cuantitativa, no una medida del reloj real.

## Solución

Se mantiene la rotación física `systemSceneBodySpinRadians` sin modificaciones. La rotación visual `systemSceneBodyDisplaySpinRadians` utiliza para los planetas sincronizados (`PLANET_19_3` y `COMPACT_31_4F`) un techo asintótico de una vuelta cada 240 s (0,25 rpm). Conserva el mismo algoritmo de compresión `tanh` y el límite anterior de 30 s por vuelta para planetas no sincronizados. No acelera un período real que, con un reloj lento, ya estuviera por debajo del límite.

La animación sigue calculándose desde tiempo absoluto; no acumula desplazamientos dependientes de FPS. `SystemScene` ya invoca este proyector, por lo que no requiere tocar el renderizador. El planeta y las construcciones ancladas comparten `spinPivot`. Las lunas mantienen su propio proyector.

**Alcance y advertencia:** el límite es únicamente visual. `rotationPeriodHours`, clasificación mareal, órbitas y simulación no cambian. Como la órbita permanece acelerada, la orientación animada del planeta sincronizado ya no representa estrictamente una cara fija hacia la estrella durante la reproducción acelerada; corresponde a una visualización de inspección, igual que las lunas de la escena.

## Regresiones cubiertas

- Chakos B-2: avance en 1, 30, 60, 180 s; comparación con ficha T5.
- Diferentes velocidades de reloj; determinismo absoluto.
- No acelerar cuando el reloj es lento.
- Mantener rotaciones libres, lunas y objetos sin período.
- Validación de tiempo inválido y conservación de datos científicos.

Se entrega auditoría portable que ejecuta el módulo real y comprueba sintaxis y enlace con SystemScene. Vitest/Angular/WebGL reales se validan en el proyecto del usuario.
