# VIDA.8 — Colonización tecnológica / contrato y límites

- Solo Ground Truth V3. Vida nativa, vida introducida confinada y colonos son atributos **distintos**.
- La única fuente admisible es una civilización VIDA.7 avanzada o muy avanzada **real** y una especie fundadora existente en VIDA.6.
- En esta revisión, colonización dentro del **mismo sistema estelar**; no inferir viajes interestelares ni inventar civilizaciones extrapoladas.
- Colonización de planetas/lunas con ficha física V3 y evidencia de superficie sólida; excluye gigantes sin base definida.
- Hábitats: módulos sellados, recintos excavados y protección ambiental activa. Soporte vital obligatorio.
- Transporte de civilizaciones avanzadas: viabilidad de la misión restringida, calculada independientemente de los niveles de VIDA.7. Muy avanzadas ya cuentan con capacidad orbital.
- Proyectos de terraformación muy avanzados: solo planetas incompatibles y etapas de viabilidad/piloto cerrado. No cambian presión, temperatura, O2, fauna ni agua del motor V3.
- Organismos importados deben enlazar a especies VIDA.6 de la civilización origen, permanecen confinados. Nunca insertarlos en el catálogo ecológico nativo del destino.
- Poblamiento: bandas y rangos de población colonial, sin modificar población nativa ni conocimiento del jugador.
- Persistencia: `VIDA.8/technological-colonization/v1` en `privateEcologicalBiospheres`, IndexedDB V9, sin migración.
- Runtime: fichas confirmadas planeta/luna → VIDA.3/4/5c/6/7 → VIDA.8, guardado privado idempotente.
- Si no hay civilizaciones elegibles dentro de un sistema, resultado legítimo: sin colonias. No hay cuotas por galaxia.
- La colonización de lunas menores sin caracterización V3 y entre sistemas queda explícitamente fuera de este alcance.
