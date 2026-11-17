# 38.bis-a5 — Informe de control

- Origen: `record.colonization.colonies[].origin` de VIDA.8, **no nombres inferidos desde el destino**.
- Identidad del sistema y permiso: `DiscoveryState.CONFIRMED`, V3, localizador lunar coincidente y registro VIDA.9 validado; solo se busca la fuente del mismo sistema.
- Identidad fundadora: especie VIDA.6 por `founderSpeciesId`, civilización VIDA.7 por identidad y nivel, y digests comparados con origen VIDA.8.
- Discrepancias históricas: verificar de nuevo con el `reconcileColonyOrigin38Bis` productivo; cuando no es posible, no se revelan nombres.
- Nombre público: designación del planeta natal V3 por el resolver público existente.
- Privacidad: ningún nombre ni enlace se presenta en caso de fallo, ausencia de fuente o sistema sin confirmar.
- Fichas afectadas: lunar únicamente; el panel compartido mantiene comportamiento previo en las planetarias.
- Productivos modificados: `moon-detail.ts`, `moon-detail.html`, `vida9-full-system-biology-panel.ts`; nuevo lector `moon-colonial-provenance-38-bis-a5.ts`.
- Tests añadidos: `moon-colonial-provenance-38-bis-a5.spec.ts` (6 casos).
- No se modifican registros CT-0, generadores VIDA, ni renderers 3D.
