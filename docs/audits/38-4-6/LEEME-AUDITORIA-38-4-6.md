# GENESIS Web · Auditoría de cierre 38.4–38.6 (incremental CT-0)

**Alcance deliberado:** auditoría no destructiva. Este paquete no modifica ninguna ficha, lógica VIDA.8/37, renderer, persistencia o módulo de civilizaciones. No declare fases cerradas por la mera presencia de campos.

## Incluido

- `src/app/presentation/life-species-visual/vida38-audit-determinism-38-4.spec.ts`: 9 pruebas Vitest, una por combinación linaje/nivel; verifica las doce primeras muestras de cada galería, igualdad del plan derivado, identidad, fingerprint, semilla y descriptor ante reconstrucción y metadatos espaciales ajenos al contrato.
- `scripts/auditar-genesis-38-4-38-6.cjs`: auditoría estática de las implementaciones efectivas existentes en la instalación del usuario. Recorre `src/app` y emite líneas concretas de evidencia y revisión, sin bloquear el proceso si encuentra tareas pendientes.
- `scripts/auditar-genesis-38-4-38-6.spec.cjs`: pruebas Node de que el auditor no confunde una mención textual con conformidad.

## Comandos (en raíz de genesis-web)

```powershell
npx ng test --watch=false --include="src/app/presentation/life-species-visual/vida38-audit-determinism-38-4.spec.ts"
node --test scripts/auditar-genesis-38-4-38-6.spec.cjs
node scripts/auditar-genesis-38-4-38-6.cjs
npx ng build
```

Los resultados del auditor se guardan aquí:

- `docs/audits/38-4-6/38-4-6-auditoria-evidencia.json`
- `docs/audits/38-4-6/38-4-6-auditoria-evidencia.md`

## Interpretación correcta

- `INDICIOS`: encontramos señales de determinismo o un componente relevante, **no** certificación funcional.
- `REVISAR`: hay que comprobar la condición de negocio en el punto de renderizado y con un fixture negativo/positivo.
- `SIN_EVIDENCIA`: el auditor no localizó información suficiente; no significa que la función no exista.

### Cierre 38.4

1. Dos renders de **un mismo contrato persistido** deben tener iguales materiales, geometría derivada y rasgos tras backup/restore; cambios de LOD no alteran la identidad.
2. Una localización espacial distinta no puede por sí sola producir variantes no sustentadas por rasgos de VIDA.
3. Verificar también mutaciones legítimas del fingerprint que correspondan a rasgos adicionales **demostrables**, no solo a una semilla nueva.

### Cierre 38.5

En fichas **reales** (no fixtures LAB_ONLY): origen, ecosistema, relaciones, cultura y tecnología deben estar en español y proceder de VIDA.6/7/8/9, respetando ausencia de datos y conocimiento observado. La visualización reconstruida no es observación instrumental.

### Cierre 38.6

Revisar cuatro clases de elementos: luces nocturnas, estaciones, colonias, asentamientos. Cada aparición debe estar vinculada a un dato habilitador vigente de VIDA.8/37 y al conocimiento permitido; fixtures sin prueba científica deben dibujar cero objetos.

## Decisión de intervención

**No se han encontrado defectos reproducidos en el repositorio completo** porque este no estaba disponible durante el empaquetado. El objetivo de esta entrega es obtener evidencia desde la instalación real antes de corregir. No se debe modificar el dominio científico ni reducir umbrales de la simulación para conseguir tests verdes.

## Precaución

Los nueve tests de la fase 38.4 certifican solo la repetición de los **planes/contratos** de las galerías. No equivalen por sí solos a certificación gráfica de todo el universo. 38.5 y 38.6 permanecen pendientes de revisar hasta que haya informe y pruebas de integración con VIDA.
