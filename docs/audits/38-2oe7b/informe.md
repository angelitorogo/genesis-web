# GENESIS Web — 38.2o.e7b · Continuidad de prendas blandas

## Motivo
La galería 38.2o.e7 mostró franjas claras sobre hombros, torsos parcialmente desnudos y faldones rígidos sin verdadera continuidad dorsal. Los paneles frontales/back se eliminan **como estructura principal** para las familias de ropa blanda.

## Implementación
- Módulo independiente `vida38-reptilian-organic-garments-38-2oe7b.ts`.
- Superficie de vestido envolvente **360°** que cubre torso, espalda y caderas, con longitud hasta muslo, rodilla o tobillo.
- Geometría interna y externa con **paredes perimetrales** en cuello, dobladillo y abertura de cola; costuras cerradas en el grafo de triángulos.
- Recorte **elíptico posterior** a la altura de la raíz caudal, sin modificar la cola SDF.
- Pliegues por ángulo, por caída y por semilla, con proporciones anatómicas interpoladas de hombros a cintura y bajo.
- Capas dorsales en **dos paños** para dejar pasar la cola, palas frontales curvas y velos pelágicos.
- Acentos diferenciados por cultura y rol, sin rosa, rojo ni amarillo neón.
- No cambia `TECH_SUIT` ni el motor ocular o de cola.
- `COLONIAL_RIG` mantiene su equipamiento y recibe faldones posteriores, sin sustituir el chaleco ya aprobado.

## Validación
- Auditoría local de topología independiente: comprueba ausencia de aristas expuestas o no-manifold y que existe la abertura caudal.
- Test Vitest comprueba plan determinista, malla de dos superficies, vista frontal/trasera, abertura y familias de prenda.
- Compatibilidad de etiquetas `garmentGeom38OE7` y prefijos `BASILICA_`/`PELAGIC_` con las pruebas de 38.2o.e7a y 38.2o.e6a.

## Limitaciones
La verificación topológica **no equivale a validación visual WebGL**. El ajuste geométrico y la caída visual de túnicas y mantos deben inspeccionarse en la galería del usuario, de frente, de perfil y por detrás. No se ejecutó build Angular en este entorno.
