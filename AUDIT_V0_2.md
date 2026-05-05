# Alicyn Piercing Map V0.2 Audit

## Funciona

- Navegacion principal: Mapa, Oreja, Evaluacion, Inspo, Comunidad y Piercer.
- Navegacion inferior mobile: Mapa, Oreja, Evaluar, Comunidad/Resenas y Piercer.
- Mapa corporal con zonas clickeables y panel de piercings por zona.
- Drawer de detalle con guardar en plan, consultar con piercer e inspo curada.
- Ear Planner con puntos clickeables, seleccion visual, carga Alicyn, fases, export, compartir y limpiar.
- Evaluacion anatomica con foto local, puntos por porcentaje, herramientas add/move/delete, editor, resumen, copiar, descargar e imprimir.
- Comunidad local con filtros, ordenamiento, experiencias, modal de publicacion, XP, reportes, feedback y export de dataset.
- Inspo como galeria local filtrable por zona, preparada para imagenes curadas.
- Piercer landing con CTAs conectados a Mapa, Planner y Evaluacion.

## Conectado parcialmente

- Login social Google/Facebook muestra estado "proximamente"; requiere backend seguro.
- Fotos de comunidad se mantienen como placeholder/local queue; no se suben a servidor.
- Dataset se exporta como JSON local; todavia no existe pipeline real de backend/ML.

## Assets actuales

- `assets/body-map.png`
- `assets/ear.png`
- `assets/ear-green.png`

No se detectan assets faltantes para V0.2.

## Verificacion tecnica

- `node --check data.js`
- `node --check app.js`
- `node --check community.js`

Los tres pasan sin errores de sintaxis.

## Pendiente para V0.3

- Backend para auth, experiencias, consentimiento, curaduria de fotos y dataset anonimizado.
- Moderacion real de contenido e inspo.
- Tests automatizados de browser para GitHub Pages.
- Integracion Shopify sin mezclar datos sensibles con tienda.
