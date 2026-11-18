# VISCIV.6i.b — Informe de regresión

**Síntoma:** `expected 4.3703829348390935 to be greater than 4.411478851546125`
(con 6.672/6.673 tests en verde).

**Causa:** la caja envolvente medía parte de la extensión de un anillo inclinado.
La prueba anulaba la rotación de los objetos, pero no actualizaba las matrices
mundiales que Three.js había calculado previamente.

**Arreglo:** actualizar la jerarquía antes de medir en el plano local y restaurar
las rotaciones tras la medición. Se mantienen los límites inferiores y la
comparación de alturas industriales y de transporte, añadiendo un límite
superior de regresión para detectar contaminación por radio orbital.

**Alcance:** solo el fichero del test; ninguna modificación de producción.

**Pendiente:** ejecutar Vitest Angular en el proyecto del usuario, ya que este
entorno no incluye las dependencias del proyecto completo.
