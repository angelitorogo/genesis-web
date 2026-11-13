# 38.2p1a — Hotfix de regresión ocular y de boca

## Síntoma reproducido por capturas
38.2p1 ocultaba el iris y la pupila detrás de una placa ocular clara, que se veía como un parche blanco en el cráneo. También la costura mandibular se proyectaba como una línea flotante sobre el hocico.

## Corrección segura
- Restauración controlada de la implementación ocular 38.2p, que el usuario ya había validado como claramente superior visualmente: superficie almendrada oscura, iris ámbar/variado y pupila vertical.
- Supresión del pequeño reflejo blanco aislado para no confundirlo con un ojo blanco.
- Retirada de las piezas ORBIT / UPPER_LID / LOWER_LID que en 38.2p1 podían tapar iris y pupila. No sustituimos estas capas por otras piezas sin verificación WebGL.
- Desactivación de la comisura tubular artificial tanto para bocas cerradas como dentadas. Conserva la geometría orgánica SDF; no cambia la morfología ni la escala del hocico.
- Conservación del renderizador de reptiles civilizados, visor con pan y resto de especies.

## Alcance de la validación
- Sintaxis/transpilación TypeScript sin errores de parser.
- Auditoría estructural Node.
- No ejecutados aquí build Angular, tests Vitest ni visualización WebGL (dependencias del proyecto ausentes).
