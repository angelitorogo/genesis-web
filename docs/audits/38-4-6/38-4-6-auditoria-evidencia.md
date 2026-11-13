# GENESIS · Auditoría de evidencia 38.4–38.6

Fecha: 2026-11-13T09:13:15.097Z
Archivos revisados: 1268
Huella SHA-256 del código examinado: `ac81b533a91e36bd9a9156f7a0254266d4fd63fdd428da0d5607675e70ac2acb`

> La detección estática NO certifica cumplimiento. Ninguna fase se declara cerrada automáticamente.

| Requisito | Estado | Observación |
|---|---|---|
| 38.4.determinismo | REVISAR | El uso de semillas/ID es rastreable; falta comparar dos reconstrucciones reales y comprobar estabilidad tras serializar/restaurar. |
| 38.4.variantes-espaciales | REVISAR | La presencia de variantSeedUint32 NO demuestra que las variantes dependan de rasgos biológicos suficientes. |
| 38.5.origen | REVISAR | Se ha encontrado referencia a origen, pero hay que comprobar idioma visible, fuente VIDA y nivel de conocimiento. |
| 38.5.ecosistema | REVISAR | Se ha encontrado referencia a ecosistema, pero hay que comprobar idioma visible, fuente VIDA y nivel de conocimiento. |
| 38.5.relaciones | REVISAR | Se ha encontrado referencia a relaciones, pero hay que comprobar idioma visible, fuente VIDA y nivel de conocimiento. |
| 38.5.cultura | REVISAR | Se ha encontrado referencia a cultura, pero hay que comprobar idioma visible, fuente VIDA y nivel de conocimiento. |
| 38.5.tecnologia | REVISAR | Se ha encontrado referencia a tecnologia, pero hay que comprobar idioma visible, fuente VIDA y nivel de conocimiento. |
| 38.5.procedencia-vida | REVISAR | La representación no debe sustituir culturas/roles persistidos de VIDA por roles generados para laboratorio. |
| 38.6.luces | REVISAR | Encontradas referencias a luces; aún hay que probar la condición científica exacta que habilita el dibujo. |
| 38.6.asentamientos | REVISAR | Encontradas referencias a asentamientos; aún hay que probar la condición científica exacta que habilita el dibujo. |
| 38.6.colonias | REVISAR | Encontradas referencias a colonias; aún hay que probar la condición científica exacta que habilita el dibujo. |
| 38.6.estaciones | REVISAR | Encontradas referencias a estaciones; aún hay que probar la condición científica exacta que habilita el dibujo. |
| 38.6.gates-conocimiento | REVISAR | La existencia de campos VIDA.8/37 no prueba que el dibujo quede condicionado por ellos; se requieren tests positivos y negativos. |

## Evidencias por archivo y línea

### 38.4.determinismo
- `src/app/presentation/life-species-visual/life-species-visual-preview.ts:81`: <app-vida38-reptilian-gallery-38-2oe5 [selectedSpeciesId]="comparisonContract?.speciesId ?? null" (open)="openGallerySpecimen($event)"></app-vida38-reptilian-gallery-38-2oe5>
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:11`: const speciesId='LAB-38W-HUMANOID-${String(serial).padStart(5,'0')}';
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:12`: const skin=SKINS[hashVida38W(speciesId+'skin')%SKINS.length]!;
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:13`: const contract:Vida38SpeciesVisualContract={revision:VIDA38_SPECIES_VISUAL_REVISION,speciesId,
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:14`: speciesName:'Humanoide avanzado de laboratorio ${serial}',variantSeedUint32:hashVida38W(speciesId+'seed'),appearanceFingerprint:'LAB_ONLY/38W/${speciesId}',
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:2`: import {deriveVida38AdvancedHumanoidPlan38W,hashVida38W,type Vida38AdvancedHumanoidPlan38W} from './vida38-advanced-humanoid-plan-38-2w';
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:12`: const skin=SKINS[hashVida38W(speciesId+'skin')%SKINS.length]!;
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:14`: speciesName:'Humanoide avanzado de laboratorio ${serial}',variantSeedUint32:hashVida38W(speciesId+'seed'),appearanceFingerprint:'LAB_ONLY/38W/${speciesId}',
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:17`: locomotion:'WALKING',bodyLengthMeters:1.55+(hashVida38W(speciesId+'height')%125)/100,
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:18`: pigmentation:{primaryColorHex:skin[0],secondaryColorHex:skin[1],pattern:(['SOLID','MOTTLED','SPOTS','BANDS'] as const)[hashVida38W(speciesId+'pattern')%4]!,bioluminescent:false},
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-identity-38-2oe2.ts:4`: * No usa Math.random(), estado global, ni requiere acceso a IndexedDB. */
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-variation-38-2oe1.ts:2`: * No usa Math.random(), estado global ni orden de enumeración del catálogo. */
- `src/app/presentation/life-species-visual/vida38-humanoid-torso-38-2ge.ts:56`: // Sin cromatismo, orden de carga, appearanceFingerprint ni Math.random().
- `src/app/presentation/life-species-visual/vida38-reptilian-organic-garments-38-2oe7c.ts:6`: * No hay Math.random(), texturas externas ni escrituras persistentes.
- **Pendiente:** Ejecutar Vitest CT-0 con 2 modelos del mismo contrato y comparar geometría/materiales/plan. Revisar cualquier Math.random de las rutas productivas.

### 38.4.variantes-espaciales
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-fixtures-38-2w.ts:14`: speciesName:'Humanoide avanzado de laboratorio ${serial}',variantSeedUint32:hashVida38W(speciesId+'seed'),appearanceFingerprint:'LAB_ONLY/38W/${speciesId}',
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-plan-38-2w.ts:43`: const seed=[c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,'38.2w'].join('|');
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-thumbnails-38-2w.ts:6`: const key=(c:Vida38SpeciesVisualContract)=>[VIDA38_ADV_HUMANOID_RENDERER_REVISION_38W,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32].join('|');
- `src/app/presentation/life-species-visual/vida38-advanced-insectoid-fixtures-38-2t.ts:28`: variantSeedUint32:vida38Hash38T(speciesId+'|seed'),appearanceFingerprint,
- `src/app/presentation/life-species-visual/vida38-advanced-insectoid-plan-38-2t.ts:120`: const seed = '${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}|38.2t';
- `src/app/presentation/life-species-visual/vida38-advanced-insectoid-thumbnails-38-2t.ts:9`: VIDA38_ADV_INSECT_RENDERER_REVISION_38T,c.speciesId,c.appearanceFingerprint,c.variantSeedUint32,
- `src/app/presentation/life-species-visual/vida38-advanced-reptilian-fixtures-38-2s.ts:27`: variantSeedUint32:vida38Hash38S('${speciesId}|seed'),
- `src/app/presentation/life-species-visual/vida38-advanced-reptilian-thumbnails-38-2s3.ts:23`: contract.variantSeedUint32,
- `src/app/presentation/life-species-visual/vida38-bird-morphology-38-2i.ts:95`: const seed=hash([VIDA38_BIRD_REVISION,c.speciesId,c.variantSeedUint32,c.morphology.bodyPlan,
- `src/app/presentation/life-species-visual/vida38-civilized-humanoid-fixtures-38-2r.ts:23`: variantSeedUint32:vida38Hash38R('${speciesId}|seed'),appearanceFingerprint:fingerprint,
- `src/app/presentation/life-species-visual/vida38-civilized-humanoid-plan-38-2r.ts:114`: const seed='38.2r|${contract.speciesId}|${contract.appearanceFingerprint}|${contract.variantSeedUint32}';
- `src/app/presentation/life-species-visual/vida38-civilized-insectoid-fixtures-38-2q.ts:33`: variantSeedUint32:hash32('seed:'+speciesId),appearanceFingerprint,
- **Pendiente:** Inspeccionar el mapper contrato VIDA→render: mismo ID y rasgos idénticos deben mantener apariencia aunque cambie la localización; variante distinta solo con evidencia biológica explícita.

### 38.5.origen
- `src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-civilizations-catalog.data-source.ts:17`: description:'Civilizaciones nativas identificadas en sistemas confirmados. Las colonias tecnológicas se distinguen de las civilizaciones de origen.',
- `src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-civilizations-catalog.data-source.ts:21`: {key:'planet',label:'Planeta de origen'},{key:'system',label:'Sistema anfitrión'},
- `src/app/presentation/galaxy-knowledge-catalog/galaxy-knowledge-civilizations-catalog.data-source.ts:24`: {key:'planet',label:'PLANETA DE ORIGEN'}, {key:'system',label:'SISTEMA'},
- `src/app/presentation/life-species-detail/life-species-detail.ts:133`: <p class="info">Los datos pertenecen al universo simulado. No se ha generado una fecha histórica certificada de origen.</p>
- `src/app/presentation/life-species-visual/vida38-bird-organic-field-38-2i.ts:498`: for(let origin=0;origin<triangleCount;origin++){
- `src/app/presentation/life-species-visual/vida38-bird-organic-field-38-2i.ts:499`: if(flips[origin]!==-1)continue;
- **Pendiente:** Validar en fichas de especie y civilización reales: texto español, propiedad VIDA trazable, nulos explícitos y no revelar datos no observados.

### 38.5.ecosistema
- `src/app/domain/life/vida6-ecosystems-species.ts:5`: import type { Vida4Group } from './procedural-ecology-vida4';
- `src/app/domain/life/vida6-ecosystems-species.ts:39`: readonly habitat: Vida6HabitatKind;
- `src/app/domain/life/vida6-ecosystems-species.ts:62`: readonly habitat: Vida3MicrobialSnapshot['habitat'];
- `src/app/domain/life/vida7-intelligence-civilizations.ts:36`: /** Modelo de emplazamiento compatible con el habitat realmente ocupado en VIDA.6. */
- `src/app/domain/life/vida7-intelligence-civilizations.ts:37`: readonly habitat: Vida6HabitatKind;
- `src/app/presentation/life-species-detail/life-species-detail.ts:60`: <div class="dato"><span>Hábitat</span><strong>{{etiqueta(e.habitat)}}</strong></div>
- **Pendiente:** Validar en fichas de especie y civilización reales: texto español, propiedad VIDA trazable, nulos explícitos y no revelar datos no observados.

### 38.5.relaciones
- `src/app/presentation/life-species-detail/life-species-detail.ts:96`: <h2>Relaciones ecológicas</h2>
- `src/app/presentation/life-species-detail/life-species-detail.ts:97`: @if (relaciones().length===0) {<p class="info">Sin relaciones interespecíficas registradas.</p>}
- `src/app/presentation/life-species-detail/life-species-detail.ts:99`: @for (relacion of relaciones(); track relacion.sourceSpeciesId+'|'+relacion.targetSpeciesId+'|'+relacion.kind) {
- `src/app/presentation/life-species-detail/life-species-detail.ts:100`: <li>{{etiqueta(relacion.kind)}} · {{nombreEspecie(relacion.sourceSpeciesId)}} y {{nombreEspecie(relacion.targetSpeciesId)}}
- `src/app/presentation/life-species-detail/life-species-detail.ts:101`: · intensidad {{relacion.intensity01}}</li>
- `src/app/presentation/life-species-detail/life-species-detail.ts:183`: readonly relaciones=computed(()=>this.registro()?.ecosystem.relations.filter(r=>r.sourceSpeciesId===this.especieId || r.targetSpeciesId===this.especieId)??[]);
- **Pendiente:** Validar en fichas de especie y civilización reales: texto español, propiedad VIDA trazable, nulos explícitos y no revelar datos no observados.

### 38.5.cultura
- `src/app/domain/life/vida7-intelligence-civilizations.ts:46`: readonly culture: {
- `src/app/presentation/life-species-detail/life-species-detail.ts:120`: <div class="dato"><span>Tradición de gobierno</span><strong>{{etiqueta(civ.culture.governingTradition)}}</strong></div>
- `src/app/presentation/life-species-detail/life-species-detail.ts:121`: <div class="dato"><span>Enfoque cultural</span><strong>{{etiqueta(civ.culture.culturalFocus)}}</strong></div>
- `src/app/presentation/life-species-detail/life-species-detail.ts:122`: <div class="dato"><span>Organización</span><strong>{{etiqueta(civ.culture.socialOrganization)}}</strong></div>
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-plan-38-2w.ts:15`: readonly culture:Vida38AdvancedHumanoidCulture38W;readonly role:Vida38AdvancedHumanoidRole38W;
- `src/app/presentation/life-species-visual/vida38-advanced-humanoid-plan-38-2w.ts:45`: const culture=VIDA38_ADV_HUMANOID_CULTURES_38W[hashVida38W(seed+'|culture')%6]!;
- **Pendiente:** Validar en fichas de especie y civilización reales: texto español, propiedad VIDA trazable, nulos explícitos y no revelar datos no observados.

### 38.5.tecnologia
- `src/app/domain/life/vida7-intelligence-civilizations.ts:53`: readonly technology: readonly string[];
- `src/app/presentation/life-species-detail/life-species-detail.ts:124`: <h2>Tecnologías</h2><ul class="lista">@for (tecnologia of civ.technology; track tecnologia) {<li>{{etiqueta(tecnologia)}}</li>}</ul>
- `src/app/presentation/life-species-visual/vida38-civilized-reptilian-preview-38-2o.ts:582`: /** Revestimiento continuo de 360° para tecnología interestelar.
- `src/app/presentation/life-species-visual/vida38-reptilian-wardrobe-coherence-38-2oe8b.ts:145`: : 'Vestimenta previa a la tecnología muy avanzada.',
- `src/app/presentation/moon-detail/moon-scientific-card.ts:9`: import { Vida8TechnologicalColonization } from '../../simulation/life/vida8-technological-colonization';
- `src/app/presentation/moon-detail/moon-scientific-card.ts:11`: import type { Vida8ColonizationSnapshot } from '../../domain/life/vida8-technological-colonization';
- **Pendiente:** Validar en fichas de especie y civilización reales: texto español, propiedad VIDA trazable, nulos explícitos y no revelar datos no observados.

### 38.5.procedencia-vida
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:2`: import { VIDA6_REVISION, type Vida6EcosystemSnapshot } from '../../../domain/life/vida6-ecosystems-species';
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:5`: export class DexieVida6EcosystemsSpeciesRepository {
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:8`: async ensure(snapshot: Vida6EcosystemSnapshot): Promise<Vida6EcosystemSnapshot> {
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:9`: if (snapshot.revision !== VIDA6_REVISION || snapshot.identity.generatorVersionCode !== 3)
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:10`: throw Error('VIDA.6 private persistence requires V3 and the current revision');
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:15`: const same = (row: {snapshotJson:string;digest:string;modelRevision:string}):Vida6EcosystemSnapshot => {
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:16`: const previous = JSON.parse(row.snapshotJson) as Vida6EcosystemSnapshot;
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:22`: throw Error('VIDA.6 immutable ecosystem mismatch; no overwrite');
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:26`: return await this.db.transaction('rw',this.db.privateEcologicalBiospheres,async()=>{
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:27`: const previous = await this.db.privateEcologicalBiospheres.get(key);
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:29`: await this.db.privateEcologicalBiospheres.add({universeSeed:identity.universeSeed,
- `src/app/data/local/repository/dexie-vida6-ecosystems-species.repository.ts:36`: const previous = await this.db.privateEcologicalBiospheres.get(key);
- **Pendiente:** Trazar campos de ficha a VIDA.6/VIDA.7 y verificar que los labels de laboratorio LAB_ONLY nunca aparecen como conocimiento observado.

### 38.6.luces
- `src/app/domain/life/technosignatures-37a.ts:7`: export type Technosignature37aNightLight = 'LOCAL_POSSIBLE' | 'URBAN_POSSIBLE' | 'EXTENSIVE_POSSIBLE';
- `src/app/domain/life/technosignatures-37a.ts:12`: readonly nightLight: Technosignature37aNightLight;
- `src/app/domain/life/technosignatures-37a.ts:25`: nightLight:'LOCAL_POSSIBLE',sceneAlert:false,observedRadioSignal:false});
- `src/app/domain/life/technosignatures-37a.ts:28`: nightLight:'URBAN_POSSIBLE',sceneAlert:true,observedRadioSignal:false});
- `src/app/domain/life/technosignatures-37a.ts:31`: nightLight:'EXTENSIVE_POSSIBLE',sceneAlert:true,observedRadioSignal:false});
- `src/app/presentation/system/system-scene-atmosphere-material.ts:60`: * suppresses ambient light on the night side and softens the visible terminator
- `src/app/presentation/system/system-scene-atmosphere-material.ts:67`: nightLightsTexture: THREE.DataTexture | null = null,
- `src/app/presentation/system/system-scene-atmosphere-material.ts:113`: if (nightLightsTexture !== null) {
- `src/app/presentation/system/system-scene-atmosphere-material.ts:115`: value: nightLightsTexture,
- `src/app/presentation/system/system-scene-atmosphere-material.ts:130`: nightLightsTexture !== null,
- `src/app/presentation/system/system-scene-atmosphere-material.ts:136`: '${upstreamProgramKey}|GENESIS-25.6-DAY-NIGHT-V1-${profile.atmospherePresent ? 'ATM' : 'VAC'}-${nightLightsTexture === null ? 'NO-CIV' : 'CIV-LIGHTS-V1'}';
- `src/app/presentation/system/system-scene-atmosphere-optics.ts:43`: * parameters for the GLSL atmosphere shell, terminator and night-side response;
- **Pendiente:** Revisar render + fuente de datos: construir solo con evidencia VIDA.8/37 y conocimiento permitido; si falta evidencia, 0 objetos visibles.

### 38.6.asentamientos
- `src/app/domain/life/vida7-intelligence-civilizations.ts:34`: export interface Vida7Settlement {
- `src/app/domain/life/vida7-intelligence-civilizations.ts:54`: readonly settlementPatterns: readonly Vida7Settlement[];
- `src/app/domain/life/vida8-technological-colonization.ts:11`: export type Vida8PopulationBand = 'OUTPOST' | 'SETTLEMENT' | 'CITY' | 'NETWORK';
- `src/app/domain/life/vida8-technological-colonization.ts:23`: export interface Vida8ColonialSettlement {
- `src/app/domain/life/vida8-technological-colonization.ts:48`: readonly settlement: Vida8ColonialSettlement;
- `src/app/presentation/life-species-detail/life-species-detail.ts:125`: <h2>Asentamientos</h2><ul class="lista">@for (sitio of civ.settlementPatterns; track sitio.id) {
- `src/app/presentation/planet-detail/planet-vegetation-preview-profile-visbio.ts:3`: * civilization-night settlement geography at every camera scale. */
- `src/app/presentation/scientific/vida9-etiquetas-es.ts:53`: SETTLEMENT:'Asentamiento', CITY:'Ciudad', NETWORK:'Red de asentamientos',
- `src/app/presentation/scientific/vida9-full-system-biology-panel.ts:67`: <p><strong>Colonia {{ $index + 1 }}</strong> · {{etiqueta(colonia.settlement.habitatTechnology)}} · {{etiqueta(colonia.settlement.populationBand)}}</p>
- `src/app/presentation/scientific/vida9-full-system-biology-panel.ts:68`: <p>Población colonial: {{colonia.settlement.colonialPopulationRange[0]}}–{{colonia.settlement.colonialPopulationRange[1]}} habitantes.</p>
- `src/app/presentation/scientific/vida9a-physical-biology-coherence.ts:95`: 'La población colonial se deriva exclusivamente de los asentamientos coloniales VIDA.8.'));
- `src/app/presentation/system/system-scene-planet-night-lights-visciv1.ts:2`: * No population, road or settlement coordinates are added to scientific state.
- **Pendiente:** Revisar render + fuente de datos: construir solo con evidencia VIDA.8/37 y conocimiento permitido; si falta evidencia, 0 objetos visibles.

### 38.6.colonias
- `src/app/data/local/entity/private-ecological-biosphere-vida4.entity.ts:6`: readonly modelRevision: 'VIDA.4/ecology/v1' | 'VIDA.4/ecology/v2-advanced-calibration' | 'VIDA.5c/advanced-biosphere/v1' | 'VIDA.6/ecosystems-species/v1' | 'VIDA.7/intelligence-civilizations/v1' | 'VIDA.8/technological-colonization/v1';
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:2`: import { VIDA8_REVISION, type Vida8ColonizationSnapshot } from '../../../domain/life/vida8-technological-colonization';
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:8`: snapshot.colonialPopulationPresent!==(snapshot.colonies.length>0) ||
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:9`: snapshot.introducedLifePresent!==snapshot.colonies.some(c=>c.introducedOrganisms.length>0) ||
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:10`: snapshot.colonies.some(c=>c.terraform?.environmentChanged ||
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:26`: prior.colonies.length!==snapshot.colonies.length)
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:27`: throw Error('VIDA.8 immutable colonization mismatch; no overwrite');
- `src/app/domain/life/vida8-technological-colonization.ts:2`: * No convierte colonias en biosferas naturales ni aplica terraformacion a la fisica V3.
- `src/app/domain/life/vida8-technological-colonization.ts:7`: export const VIDA8_REVISION = 'VIDA.8/technological-colonization/v1' as const;
- `src/app/domain/life/vida8-technological-colonization.ts:8`: export const VIDA8_NAMESPACE = 'VIDA.8/technological-colonization/v1' as const;
- `src/app/domain/life/vida8-technological-colonization.ts:69`: readonly colonies: readonly Vida8Colony[];
- `src/app/domain/life/vida9-biology-exploration.ts:6`: import type { Vida8ColonizationSnapshot } from './vida8-technological-colonization';
- **Pendiente:** Revisar render + fuente de datos: construir solo con evidencia VIDA.8/37 y conocimiento permitido; si falta evidencia, 0 objetos visibles.

### 38.6.estaciones
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:47`: export interface SystemSceneOrbitalStationPlanV1 {
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:159`: export function buildSystemSceneOrbitalStationPlansV1(
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:163`: ): readonly SystemSceneOrbitalStationPlanV1[] {
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:165`: const plans: SystemSceneOrbitalStationPlanV1[] = [];
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:280`: export function createSystemSceneOrbitalStationVisualV1(
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:281`: plan: SystemSceneOrbitalStationPlanV1,
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:285`: return createSpecializedOrbitalStationVisualV1(plan, seedUint32);
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:437`: function createSpecializedOrbitalStationVisualV1(
- `src/app/presentation/system/system-scene-artificial-satellites-visciv2.ts:438`: plan: SystemSceneOrbitalStationPlanV1,
- `src/app/presentation/system/system-scene.ts:120`: buildSystemSceneOrbitalStationPlansV1,
- `src/app/presentation/system/system-scene.ts:124`: createSystemSceneOrbitalStationVisualV1,
- `src/app/presentation/system/system-scene.ts:1009`: ).length + buildSystemSceneOrbitalStationPlansV1(
- **Pendiente:** Revisar render + fuente de datos: construir solo con evidencia VIDA.8/37 y conocimiento permitido; si falta evidencia, 0 objetos visibles.

### 38.6.gates-conocimiento
- `src/app/data/local/entity/galaxy-knowledge-snapshot.entity.ts:19`: /** Materialized *observed* civilizational knowledge from CONFIRMED systems.
- `src/app/data/local/entity/galaxy-knowledge-snapshot.entity.ts:22`: /** Revision of the canonical set of confirmed systems. */
- `src/app/data/local/entity/private-ecological-biosphere-vida4.entity.ts:6`: readonly modelRevision: 'VIDA.4/ecology/v1' | 'VIDA.4/ecology/v2-advanced-calibration' | 'VIDA.5c/advanced-biosphere/v1' | 'VIDA.6/ecosystems-species/v1' | 'VIDA.7/intelligence-civilizations/v1' | 'VIDA.8/technological-colonization/v1';
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:2`: import { VIDA8_REVISION, type Vida8ColonizationSnapshot } from '../../../domain/life/vida8-technological-colonization';
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:4`: export class DexieVida8TechnologicalColonizationRepository {
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:6`: async ensure(snapshot:Vida8ColonizationSnapshot):Promise<Vida8ColonizationSnapshot>{
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:7`: if(snapshot.revision!==VIDA8_REVISION || snapshot.identity.generatorVersionCode!==3 ||
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:14`: throw Error('VIDA.8 invalid private colonial state');
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:20`: const prior=JSON.parse(row.snapshotJson) as Vida8ColonizationSnapshot;
- `src/app/data/local/repository/dexie-vida8-technological-colonization.repository.ts:27`: throw Error('VIDA.8 immutable colonization mismatch; no overwrite');
- `src/app/data/local/repository/dexie-vida9-biology-exploration.repository.ts:85`: record.revision!==VIDA9_REVISION || record.revealPolicy!=='FULL_SYSTEM_REVEAL_ON_CONFIRMED' ||
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:2`: CataloguedToConfirmedScientificProfile,
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:4`: } from './catalogued-to-confirmed-scientific-profile';
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:7`: DetectedToDiscoveredScientificDimension,
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:8`: DetectedToDiscoveredScientificProfile,
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:9`: } from './detected-to-discovered-scientific-profile';
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:58`: DetectedToDiscoveredScientificDimension
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:69`: DetectedToDiscoveredScientificDimension
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:80`: DetectedToDiscoveredScientificDimension
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:122`: const CONFIRMED_CLASSIFICATION =
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:133`: const CONFIRMED_PHYSICAL_PROPERTIES =
- `src/app/domain/discovery/stellar-system-scientific-profile.ts:144`: const CONFIRMED_ORBITAL_ARCHITECTURE =
- **Pendiente:** Crear fixture sin civilización/colonización: 0 luces y estructuras; fixture con justificación y conocimiento: aparecen exactamente los elementos autorizados.

## Criterio de cierre
38.4 requiere dos renders con igual contrato y resultados equivalentes y una prueba negativa de variante espacial injustificada.
38.5 requiere cinco bloques en español, trazabilidad VIDA y separación de conocimiento observado.
38.6 requiere casos positivos y negativos de VIDA.8/37 en cada categoría (luces, estaciones, colonias, asentamientos).
No se modificaron los nueve renderers de civilizaciones.
