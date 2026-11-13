# GENESIS 38.2g.d — Diversificación craneofacial procedural de humanoides

## Objetivo
Conseguir diferencias **reales de rostro** entre especies humanoides del contrato visual 38.1: anatomía, cejas, expresión, pelo, boca y dentición, sin cambiar datos VIDA ni convertir hipótesis artísticas en imágenes observadas.

## Alcance ejecutado

- Nuevo perfil puro y versionado `Vida38HumanoidFaceProfile38GD` derivado de `speciesId`, tamaño VIDA, hábitat, nicho, alimentación, cobertura, locomoción y adaptaciones. La geometría no usa ni pigmentos ni `appearanceFingerprint` para sembrar su identidad.
- Arcos supraorbitales **ausentes**, suaves, medios o desarrollados mediante el campo anatómico SDF; las **cejas pilosas** son independientes de la prominencia del hueso.
- Cinco expresiones basales discretas y deterministas. Variación de apertura ocular, párpados, inclinación, expresión bucal en reposo, pómulos, mandíbula, mentón, proyección nasal y proporciones de cráneo y rostro.
- Boca anatómica ligeramente más abierta en algunas especies. Dentición vinculada a `PREDATOR` (caninos moderados), `OMNIVORE` (mixta), `HERBIVORE` (plana) y otros metabolismos (reducida), visible únicamente en algunas bocas abiertas.
- Cabello/vello con estilos `BALD`, `SPARSE`, `MEDIUM`, `DENSE`, `DORSAL_CREST`, `LATERAL`, bajo un sesgo de plausibilidad dependiente de la cobertura VIDA. Es una reconstrucción artística, no un nuevo órgano en el generador.
- Color capilar derivado del esquema de pigmentación de la especie; **no se altera la anatomía** cuando únicamente cambian los pigmentos.
- Geometría de pelo como **una sola malla de tiras curvas**, de varios segmentos, con raíces situadas por búsqueda de isosuperficie SDF. Sin planos transparentes, sin peinados modernos, sin nuevos objetos en IndexedDB, sin aleatoriedad temporal.
- Dentición representada por una malla instanciada y material mate de marfil atenuado. No añadir dentición visible cuando el perfil tiene boca cerrada.
- LOD de fibras según calidad del humanoide; geometría generada una vez y liberada mediante el ciclo de vida de la ficha, nunca por fotograma.
- Exclusivo de la ruta humanoide. Animales, microorganismos, hongos, plantas y los renderizadores físicos de planetas no se modifican.

## Reglas de identidad

`const face = deriveVida38HumanoidFace38GD(contract);`

El contrato es puro, inmutable y versionado. El mismo conjunto de datos del mismo `speciesId` produce el mismo resultado. La pigmentación solamente afecta los colores, incluido el del pelo. Las adaptaciones se ordenan antes de calcular el hash para que su orden no modifique la apariencia.

Una variante genética o rasgo biológico con valores distintos permite un perfil nuevo, sin cambiar el ID original en VIDA.6 ni simular datos instrumentales inexistentes.

## Criterios de aceptación

1. Diversidad visible en cráneo, boca, mandíbula, pómulos, expresión, arcos y cejas, incluso con material neutro.
2. Cabello y cejas presentan variantes claras: calvicie, menor cobertura y pelo abundante, además de cresta/laterales.
3. Dentición coherente con alimentación y visible solamente cuando la anatomía lo permita.
4. El cuerpo sigue siendo una malla orgánica única, estanca y conexa; los dientes/ojos/fibras son estructuras materiales independientes justificadas.
5. No hay aparición de shimmering ni ruido digital al orbitar o hacer zoom. **Este último punto necesita validación visual WebGL en la máquina del usuario**.
6. Misma identidad → mismo rostro tras recargar; VIDA.T1 intacta; sin alterar vidas/civilizaciones/persistencia.

## Validación efectuada en el entorno de preparación

- Auditoría CPU 38.2g.d: 120 perfiles, cobertura de estilos, expresiones, cejas y nutrición; 6 mallas SDF sin bordes abiertos, no manifold ni componentes desconectadas.
- Verificación estricta TypeScript: módulo facial y generador SDF.
- Auditorías CPU anteriores 38.2g, 38.2g.a, 38.2g.b y 38.2g.c: correctas con la nueva ruta (el auditor 38.2g reconoce la revisión nueva).
- Vitest/Angular/WebGL: **no ejecutados** en el entorno de preparación por incompatibilidad/ausencia de dependencias. Ejecutar los comandos del LEEME antes de dar la subfase por cerrada.

## Limitaciones y seguimiento

El pelo por fibras de geometría propia mejora silueta, pero no pretende ser pelo cinematográfico. La densidad y la apariencia en primer plano deben examinarse en pantalla; la naturalidad facial y de la dentición tampoco pueden garantizarse únicamente con tests geométricos. La escena mantiene explícita la condición de reconstrucción hipotética y deja 38.2g.d pendiente de aceptación visual.
