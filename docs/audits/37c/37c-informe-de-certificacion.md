# GENESIS Web — Fase 37.C · Auditoría integral de tecnofirmas

**Fecha:** 29 de octubre de 2026  
**Ámbito:** 37.A (perfil cualitativo y aviso local), 37.B (escucha regional de 10×10 sectores), contratos VIDA.7/VIDA.9 y mapa galáctico V3.  
**Resultado de preparación:** `AUDITORIA_37C_EJECUCION_LOCAL_OK_PENDIENTE_ANGULAR`.

## 1. Alcance cerrado

37.C no introduce nuevos tipos de tecnofirmas, civilizaciones, misiones ni mecánicas de detección. Comprueba que:

1. Los niveles tecnológicos provienen de VIDA.7; no se recalibran probabilidades ni se inventan transmisiones reales.
2. Una civilización `PRIMITIVE` tiene `radio: NONE`; `ADVANCED` y `VERY_ADVANCED` tienen capacidades **potenciales**, no detecciones radioeléctricas instrumentales confirmadas.
3. La alerta **local 37.A** se limita a sistemas `CONFIRMED`, sin señalar planeta, especie ni origen en la notificación; los registros privados VIDA.9 se consultan mediante el sistema confirmado.
4. La **escucha regional 37.B** examina exclusivamente la ventana determinista de 10×10 sectores dentro de la malla galáctica. No requiere que el sistema emisor haya sido confirmado, pero tampoco entrega su identidad.
5. Solo VIDA.7 `VERY_ADVANCED` produce `DETECTED`. Los estados `PRIMITIVE`/`ADVANCED` producen `NO_SIGNAL` si la evaluación se ha completado.
6. Un error físico aislado produce `INCOMPLETE`, nunca un falso negativo; un resultado positivo verificable prevalece aun si falla otro mundo.
7. El Worker de tipo módulo es independiente del hilo de interfaz, no persiste resultados privados, no confirma sistemas, no descubre nuevos objetos y no concede PD.
8. La caché se aísla por semilla, generador, galaxia y región, limitada a 16 ventanas. Un resultado incompleto no se memoriza. Las escuchas antiguas quedan canceladas y su resultado no puede mostrarse en otro foco.
9. Se mantiene el principio de **revelación completa de la biología** cuando un sistema ha sido confirmado, sin introducir desbloqueos nuevos para 37.A o 37.B.

## 2. Cambio técnico localizado de la auditoría

Al comprobar la caché regional se detectó que conservaba un orden de **inserción (FIFO)**, aunque se había documentado como **LRU**. La lectura de una ventana ya cacheada no renovaba su antigüedad.

Se ha corregido `regional-technosignature-37b.scanner.ts` para mover la ventana recién consultada al final del `Map`. Las pruebas nuevas distinguen entre FIFO y LRU. El cambio **solo afecta a la reutilización en RAM**, sin cambiar el resultado, la ventana, el Worker, la persistencia, los niveles de VIDA ni la UI.

## 3. Matriz de evidencia

| Contrato | Evidencia en esta entrega | Estado |
|---|---|---|
| Positivo 37.B con `VERY_ADVANCED` | Prueba ejecutable del Worker real con dependencias controladas + validación visual aportada por el usuario | OK en entorno local / validado en juego anteriormente |
| Negativo con `PRIMITIVE` y `ADVANCED` | Prueba ejecutable 37.C/02 y perfil 37.A | OK local |
| Positivo pese a incidencia aislada | Prueba ejecutable 37.C/03b | OK local |
| Fallos sector/sistema/planeta/evaluación VIDA.7 | Prueba ejecutable 37.C/03 | OK local |
| Respuesta anónima del Worker | Prueba ejecutable 37.C/04, sin origen ni recuentos | OK local |
| Repetibilidad de una región | Pruebas ejecutables 37.C/05 y 37.C/06 | OK local |
| Bordes de la cuadrícula | Prueba ejecutable 37.C/06 | OK local |
| V3 y validación de solicitudes | Prueba ejecutable 37.C/08 | OK local |
| Restricción de consulta local a CONFIRMED | Pruebas de 37.A existentes y comprobación cruzada 37.C/09 | OK local |
| Sin escritura en conocimiento ni PD | Comprobación estructural del Worker/escáner y separación del flujo de exploración | OK local; no equivale a traza E2E de almacenamiento |
| LRU de 16 regiones | Ejecución real del escáner en VM controlada 37.C/11 + nueva suite Vitest | OK local |
| Aislamiento por galaxia | Ejecución real del escáner en VM controlada 37.C/12 + nueva suite Vitest | OK local |
| Cancelación y descartes tardíos | Ejecución real del escáner en VM controlada 37.C/13 + nueva suite Vitest | OK local |
| ANGULAR + Worker real en Chromium | Pruebas Vitest, arquitectura, worker, build, E2E suministrados abajo | **Pendientes en equipo del usuario** |

El resultado positivo real comunicado por el usuario en la galaxia **Phaguium** forma parte de la validación funcional previa de 37.B. Las dos capturas del sector (3,2) no son contradictorias: el aviso negativo pertenecía a una consulta anterior cuyo panel seguía abierto; **no existe incidencia pendiente por ese motivo**.

## 4. Ejecución local de esta entrega

Se han ejecutado las auditorías portables 37.A, 37.B y 37.C sobre una reconstrucción del código disponible: **23/23 comprobaciones superadas** (37.A y 37.B: 9; 37.C: 14). La auditoría 37.C ejecuta mediante VM el **mismo código del Worker 37.B y del escáner**, con dependencias controladas para cubrir niveles y casos de fallo sin tener que generar una galaxia completa.

La ejecución con dependencias controladas **no sustituye** la compilación Angular, los tests con IndexedDB real ni la comprobación E2E en el navegador. No se ha ejecutado `ng build` ni Vitest en este contenedor porque la reconstrucción no incluye `node_modules` del proyecto.

## 5. Pruebas de cierre en el equipo de desarrollo

```powershell
node --test scripts/auditar-genesis-37a.spec.cjs scripts/auditar-genesis-37b.spec.cjs scripts/auditar-genesis-37c.spec.cjs

npx ng test --watch=false `
  --include="src/app/domain/life/technosignatures-37a.spec.ts" `
  --include="src/app/domain/life/technosignatures-37c.audit.spec.ts" `
  --include="src/app/presentation/system/system-technosignature-37a.data-source.spec.ts" `
  --include="src/app/presentation/system/system-technosignature-alert-37a.spec.ts" `
  --include="src/app/presentation/galaxy-map/regional-technosignature-37b.spec.ts" `
  --include="src/app/presentation/galaxy-map/regional-technosignature-37b.scanner.spec.ts" `
  --include="src/app/presentation/galaxy-map/regional-technosignature-37c.audit.spec.ts" `
  --include="src/app/presentation/galaxy-map/galaxy-map.spec.ts" `
  --include="src/app/presentation/galaxy-map/galactic-map-scene.spec.ts"

npm run test:architecture
npm run test:worker
npm run test:e2e:typecheck
npx ng build
npm run test:e2e
```

## 6. Decisión de cierre

**Propuesta de certificación:** `37C_PREPARADA_PENDIENTE_REGRESIONES_ANGULAR`.

Tras recibir del usuario la confirmación de las pruebas Angular, build, worker y E2E, y dado que **37.A y 37.B ya se validaron visualmente** —incluida detección positiva de una civilización muy avanzada—, se podrá declarar la **FASE 37 CERRADA** sin añadir funciones ni retocar las probabilidades de VIDA.

La auditoría estadística global de las civilizaciones (VIDA.F) permanece como tarea científica independiente. No es necesario repetirla ni modificar las distribuciones para cerrar el alcance funcional de tecnofirmas 37.
