# StereoLab — Visor estereoscópico SBS

Guía de trabajo y entrega para la práctica del visor estereoscópico. El proyecto permite visualizar fotografías **Side by Side (SBS)** en un teléfono con gafas tipo Google Cardboard. Está construido con HTML, CSS, Bootstrap 5, Three.js y lil-gui.

## Objetivo de la actividad

Preparar y analizar una aplicación web que distribuye las dos mitades de una fotografía SBS en vistas para los ojos izquierdo y derecho; cargar y calibrar una fotografía propia; probar el resultado en un teléfono con Cardboard; y publicar el proyecto en GitHub Pages.

Antes de comenzar, distingue los formatos: **SBS** contiene dos perspectivas contiguas, una para cada ojo; un **anaglifo** combina colores (por ejemplo, rojo y cian) y necesita filtros de color. Son formatos diferentes y este visor está diseñado para SBS.

## 1. Preparar el entorno de trabajo

1. Recupera las fotografías estereoscópicas que desarrollaste previamente. Identifica qué mitad corresponde a L (izquierdo) y cuál a R (derecho). Recuerda que el desplazamiento digital no cambia la separación física entre las lentes.
2. Descomprime el proyecto base `visor_sbs_threejs_lilgui.zip` en una carpeta de trabajo.
3. Abre la carpeta completa `visor-sbs/` en Visual Studio Code, no solo `index.html`.
4. Localiza `index.html`, `css/`, `js/`, `assets/` y `README.md`. En `js/` están los seis módulos JavaScript; las demostraciones están en `assets/images/`.
5. Inicia la aplicación con **Open with Live Server**. También puedes usar `python -m http.server 5500` desde la carpeta del proyecto y abrir <http://localhost:5500/>.
6. Confirma que aparece la primera demostración en las dos regiones L/R, que se muestran el panel y los botones, y que la consola del navegador no reporte errores.

**Punto de control — Proyecto local:** continúa cuando el visor abra desde un servidor local, muestre las dos mitades SBS y hayas localizado los seis módulos JavaScript. No abras el proyecto con `file://`; los módulos ES requieren HTTP o HTTPS.

### Organización del proyecto

```text
visor-sbs/
├── index.html                 # Interfaz y dependencias CDN
├── css/
│   └── styles.css             # Estilos propios y diseño responsivo
├── js/
│   ├── main.js                # Inicio, eventos y coordinación
│   ├── scene.js               # Renderer y vistas para ambos ojos
│   ├── viewer.js              # Textura SBS, recorte UV y calibración
│   ├── controls.js            # Panel lil-gui
│   ├── fileLoader.js          # Carga local de fotografías
│   └── ui.js                  # Pantalla completa y modo Cardboard
├── assets/
│   ├── images/                # demo-sbs-1.jpg y demo-sbs-2.jpg
│   └── icons/                 # Iconos de la interfaz
└── README.md
```

Bootstrap y las bibliotecas de Three.js y lil-gui se cargan por CDN; `css/styles.css` contiene los estilos del proyecto.

## 2. Comprender HTML, Bootstrap y CSS

- En `index.html`, identifica el encabezado, el selector de fotografía, los botones, el contenedor del visor, los enlaces CDN y el script `type="module"` que inicia `js/main.js`.
- Reconoce contenedores, filas, columnas y utilidades de Bootstrap. Revisa las media queries en `css/styles.css` y cambia el tamaño de la ventana para observar el diseño responsivo.
- Comprueba que las rutas a estilos, módulos e imágenes sean relativas (`./css/`, `./js/`, `./assets/`). No uses rutas de tu computadora; GitHub Pages necesita encontrar los archivos dentro del repositorio.
- Personaliza el título visible, la descripción y al menos un elemento visual. Mantén buen contraste y asegúrate de que los controles se puedan leer y tocar en un teléfono.

## 3. Analizar el renderizado SBS con Three.js

1. En `js/main.js`, localiza la creación del visor y los eventos que enlazan los botones, el cargador y la configuración. Al seleccionar otra fotografía, el módulo la carga y actualiza la textura y los datos visibles.
2. En `js/scene.js`, identifica `WebGLRenderer`, `OrthographicCamera`, `setViewport()` y `setScissor()`. El renderer divide el lienzo en dos regiones y dibuja una vista en cada una.
3. En `js/viewer.js`, revisa `PlaneGeometry` y las coordenadas UV que recortan las mitades izquierda y derecha de una misma textura.
4. Compara SBS completo y Half-SBS. El visor conserva la proporción de cada perspectiva y corrige la compresión horizontal de Half-SBS cuando seleccionas ese formato.
5. Prueba **DEMO 01** y **DEMO 02**. Observa objetos cercanos, intermedios y del fondo; verifica que las perspectivas L/R sean diferentes.

> **Idea clave:** el proyecto distribuye dos perspectivas que ya existen en la fotografía. No necesita `StereoCamera` para generar imágenes SBS ni puede crear profundidad a partir de una fotografía 2D.

## 4. Cargar una fotografía propia

- En `js/fileLoader.js`, observa cómo se leen imágenes locales en el navegador.
- Pulsa **Cargar SBS** y selecciona una fotografía con las dos perspectivas contiguas. El selector admite JPG, JPEG, PNG, WebP y AVIF; el límite del proyecto es 30 MB. En una computadora también puedes arrastrar la imagen al visor.
- Comprueba que L esté en la mitad izquierda y R en la derecha. Si el orden está invertido o la profundidad se percibe al revés, prueba **Intercambiar L/R**.
- Comprueba la validación seleccionando un archivo que no sea una imagen o que exceda el límite.

Las fotografías elegidas se procesan únicamente en el navegador: no se envían a una API ni a un servidor. Las bibliotecas del visor sí requieren conexión a Internet para cargarse desde el CDN.

## 5. Calibrar con lil-gui

En `js/controls.js` se crea el panel de calibración. Sus cambios se aplican al instante y también puedes mover o escalar la imagen directamente en el área del visor.

| Control | Función | Rango | Inicial |
|---|---|---:|---:|
| Paralaje (px) | Desplaza las vistas en sentidos opuestos y cambia su separación aparente. | −100 a 100 | 0 |
| Escala (%) | Cambia el tamaño de las dos perspectivas sin deformarlas. | 40 a 180 | 100 |
| Mover X (px) | Desplaza ambas vistas horizontalmente. | −400 a 400 | 0 |
| Mover Y (px) | Desplaza ambas vistas verticalmente. | −400 a 400 | 0 |
| Desnivel L/R (px) | Corrige una diferencia de altura entre las dos perspectivas. | −50 a 50 | 0 |
| Tipo de SBS | Elige formato completo o Half-SBS, según el archivo. | Completo / Half-SBS | Completo |
| Intercambiar L/R | Invierte qué mitad se presenta a cada ojo. | Activado / desactivado | Desactivado |

**Punto de partida:** usa Paralaje 0, Escala 100% y alineación 0; luego cambia el paralaje en incrementos pequeños. En una prueba con un teléfono y visor específicos, funcionaron **Escala 100% y Paralaje −57 px**. Es una referencia personal, no un valor universal: depende de la foto, el teléfono y las gafas.

En pantallas táctiles, arrastra con un dedo para mover la imagen y pellizca con dos dedos para escalarla. Con ratón, arrastra para mover y utiliza la rueda sobre el visor para acercar o alejar.

**Guardar la calibración:**

- **Guardar para próximas fotos** conserva los ajustes en el navegador y dispositivo actuales. El perfil se carga al volver a abrir el sitio en ese mismo navegador.
- **Guardar ajustes (JSON)** descarga `calibracion-sbs.json` con los parámetros y los datos de la fotografía; no incluye sus píxeles.
- **Restablecer calibración** vuelve a los valores iniciales y reemplaza el perfil local por esos valores.

El perfil local no se sincroniza entre navegadores ni dispositivos. Descarga el JSON si necesitas conservar o compartir una copia.

> **Comodidad visual:** prueba en intervalos breves. Si aparece visión doble persistente, dolor de cabeza o incomodidad, retira las gafas y detén la prueba. El paralaje no corrige por sí solo una fotografía mal generada.

## 6. Adaptar el visor a teléfonos y gafas Cardboard

1. Prueba la interfaz en tamaño móvil y en orientaciones vertical y horizontal. Antes del modo Cardboard, verifica que puedas usar los controles táctiles.
2. Para la prueba definitiva, abre desde el teléfono la URL HTTPS de GitHub Pages y carga una fotografía SBS guardada en el dispositivo.
3. Pulsa **Entrar en modo Cardboard**. Comprueba que solo queden las dos perspectivas en pantalla. Si el navegador no activa pantalla completa u orientación automáticamente, gira el teléfono manualmente.
4. Coloca el teléfono en horizontal dentro de las gafas. Revisa centrado, fusión, escala, encuadre y profundidad. Ajusta físicamente las lentes si el visor lo permite.
5. Compara el resultado antes y después de calibrar. Identifica si el problema era tamaño, encuadre, desnivel o paralaje.

Si la imagen está borrosa al mirar cada vista por separado, centra el teléfono y limpia las lentes. Si ambas vistas se ven nítidas por separado pero cuesta fusionarlas, prueba primero el paralaje y la alineación vertical.

**Punto de control — Validación móvil:** el sitio debe abrir en el teléfono, cargar una fotografía y mostrar las dos perspectivas sin controles superpuestos en modo Cardboard. La percepción estereoscópica debe comprobarse físicamente con las gafas.

## 7. Publicar en GitHub Pages

### Subir el repositorio

Abre una terminal en `visor-sbs/` y ejecuta:

```bash
git init
git add .
git commit -m "Visor SBS 3D"
git branch -M main
git remote add origin https://github.com/USUARIO/visor-sbs-3d.git
git push -u origin main
```

Crea primero el repositorio vacío en GitHub y reemplaza `USUARIO` y `visor-sbs-3d` por los datos reales. Antes de publicar, confirma que `index.html`, `README.md`, `css/`, `js/` y `assets/` estén incluidos y que no agregaste fotografías personales ni credenciales.

### Activar GitHub Pages

1. En el repositorio, abre **Settings → Pages → Build and deployment**.
2. Selecciona **Deploy from a branch**, la rama `main` y la carpeta `/(root)`.
3. Pulsa **Save** y espera a que GitHub muestre la URL publicada.
4. Abre la URL en una ventana privada y comprueba que carguen Three.js, lil-gui, Bootstrap, los estilos y las demostraciones.
5. Prueba el sitio publicado en el teléfono y, si la opción está disponible, activa **Enforce HTTPS**.

La URL de una página de proyecto suele ser `https://USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`. Las rutas relativas del proyecto permiten publicarlo como página de proyecto sin reemplazarlas por rutas absolutas. Después de cada `push` a la rama configurada, GitHub Pages volverá a publicar los cambios.

## 8. Evidencias y entrega

Verifica estos criterios antes de entregar:

- El repositorio incluye HTML, CSS, assets y los módulos JavaScript organizados.
- El visor carga una fotografía SBS local, permite calibrarla y ofrece el modo Cardboard.
- El sitio es responsivo, está publicado en GitHub Pages y abre desde el teléfono mediante HTTPS.
- Las conclusiones explican Three.js, lil-gui, Bootstrap, los módulos y el efecto del paralaje, la escala y la alineación.

Entrega **exactamente estos tres elementos** en la plataforma:

1. **URL del repositorio de GitHub**, con el código fuente.
2. **URL funcional de GitHub Pages**, probada desde el teléfono.
3. **Conclusiones individuales** sobre las tecnologías, los ajustes estereoscópicos, la validación con Cardboard y los retos encontrados.

No se requiere un documento adicional ni entregar fotografías como evidencia independiente; la aplicación se revisa mediante los enlaces y la demostración correspondiente.

## Referencias

- [Three.js](https://threejs.org/docs/)
- [Instalación de Three.js con import map](https://threejs.org/manual/#en/installation)
- [lil-gui](https://lil-gui.georgealways.com/)
- [Bootstrap 5](https://getbootstrap.com/)
- [GitHub Pages: configurar la fuente de publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Google Cardboard: distorsión de lentes](https://developers.google.com/cardboard/reference/c/group/lens-distortion)

**Uso educativo:** el código puede adaptarse para actividades académicas. Las imágenes de demostración forman parte de este proyecto.
