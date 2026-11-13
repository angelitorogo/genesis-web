# GENESIS 38.5 — auditoría no destructiva de ficha real

Archivo: `src/app/presentation/life-species-detail/life-species-detail.ts`

## VIDA.6 ecosistema
Coincidencias: 4
- L60: `<div class="dato"><span>Hábitat</span><strong>{{etiqueta(e.habitat)}}</strong></div>`
- L181: `readonly especie=computed(():Vida6Species|null=>this.registro()?.ecosystem.species.find(e=>e.id===this.especieId)??null);`
- L183: `readonly relaciones=computed(()=>this.registro()?.ecosystem.relations.filter(r=>r.sourceSpeciesId===this.especieId || r.targetSpeciesId===this.especieId)??[]);`
- L184: `nombreEspecie(id:string):string {return this.registro()?.ecosystem.species.find(e=>e.id===id)?.proceduralName??'Especie no disponible';}`

## VIDA.6 relaciones
Coincidencias: 3
- L97: `@if (relaciones().length===0) {<p class="info">Sin relaciones interespecíficas registradas.</p>}`
- L99: `@for (relacion of relaciones(); track relacion.sourceSpeciesId+'|'+relacion.targetSpeciesId+'|'+relacion.kind) {`
- L183: `readonly relaciones=computed(()=>this.registro()?.ecosystem.relations.filter(r=>r.sourceSpeciesId===this.especieId || r.targetSpeciesId===this.especieId)??[]);`

## VIDA.7 cultura
Coincidencias: 3
- L120: `<div class="dato"><span>Tradición de gobierno</span><strong>{{etiqueta(civ.culture.governingTradition)}}</strong></div>`
- L121: `<div class="dato"><span>Enfoque cultural</span><strong>{{etiqueta(civ.culture.culturalFocus)}}</strong></div>`
- L122: `<div class="dato"><span>Organización</span><strong>{{etiqueta(civ.culture.socialOrganization)}}</strong></div>`

## VIDA.7 tecnología
Coincidencias: 1
- L124: `<h2>Tecnologías</h2><ul class="lista">@for (tecnologia of civ.technology; track tecnologia) {<li>{{etiqueta(tecnologia)}}</li>}</ul>`

## Orígenes sin fecha inventada
Coincidencias: 1
- L133: `<p class="info">Los datos pertenecen al universo simulado. No se ha generado una fecha histórica certificada de origen.</p>`

## Control de acceso explícito
Coincidencias: 6
- L4: `import { ArchiveDiscoveryDetailFacade, ArchiveDiscoveryLocatorKind } from '../genesis-archive/archive-discovery-detail.facade';`
- L22: `/** Ficha independiente de especie: consulta la misma realidad CONFIRMED que la ficha anfitriona. */`
- L46: `<p class="info">Información generada del sistema confirmado, correspondiente al estado CT-0.</p>`
- L139: `<section role="status">La ficha de esta especie no está disponible. El sistema debe estar confirmado.</section>`
- L172: `return resultado?.kind==='AVAILABLE'?resultado.card.confirmedBiologyVIDA9??null:null;`
- L179: `return resultado?.kind==='AVAILABLE'?resultado.card.confirmedBiologyVIDA9??null:null;`

## Riesgo de laboratorio
Coincidencias: 0

## Acceso directo a Ground Truth
Coincidencias: 0

## Estado
No certificada la política de navegación hasta integrar/verificar el proyector en la ficha real.
