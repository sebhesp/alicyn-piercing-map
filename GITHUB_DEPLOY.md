# GitHub Deploy

## Archivo listo para publicar

La version autocontenida para GitHub Pages vive en:

```text
dist/index.html
```

Ese archivo incluye HTML, CSS, JavaScript y las imagenes del mapa embebidas. Puede abrirse directo en un navegador o subirse como pagina estatica.

## Ruta recomendada

1. Crear un repositorio en GitHub, por ejemplo `alicyn-body-map`.
2. Instalar o dar acceso al conector de GitHub sobre ese repositorio.
3. Subir `dist/index.html` a la rama principal.
4. Activar GitHub Pages desde `Settings > Pages`, usando la rama principal y carpeta root.

## Evolucion

El sitio fuente sigue separado en `index.html`, `styles.css`, `styles-v2.css`, `data.js`, `app.js` y `community.js`. La version de publicacion se regenera en `dist/index.html` para que sea facil correrla en celular y compartirla.
