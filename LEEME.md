# LUZ · Indumentaria Unisex — tienda por mayor y por menor

Sitio web completo de catálogo con carrito y cierre de pedido por WhatsApp.
Estructura de tienda mayorista, con fondo blanco y tipografía dorada oscura.

Hecho en HTML, CSS y JavaScript puro: **no necesita instalar nada** para funcionar.

---

## ⚠️ Lo primero: el logo

El logo que está cargado es una **recreación provisoria**. El original llegó
como imagen en el chat y no como archivo, así que no se pudo copiar al proyecto.

**Para poner el de verdad:** renombrá tu archivo a `logo.png`, pegalo en
`img/marca/` reemplazando el que está, y listo. No hay que tocar código.
El instructivo completo está en `img/marca/LEEME.txt`.

Hay dos versiones del logo y cada una tiene su función:

| Archivo | Dónde se usa | Por qué |
|---|---|---|
| `logo-horizontal.png` | Header | El emblema circular a 54 px de alto no deja leer "LUZ". La versión horizontal sí. |
| `logo.png` | Pie de página y al compartir el link | Ahí hay lugar de sobra para el emblema completo. |

Si solo tenés el emblema circular, poné `logoHeader: ""` en `data/config.js` y
se usa el mismo en los dos lados.

---

## ⏳ Estado actual: catálogo vacío, a propósito

La tienda está **sin productos y sin categorías**, esperando tus fotos y precios.
No está rota: está en "modo vidriera vacía".

Qué pasa mientras tanto:

| Sección | Qué se ve |
|---|---|
| Últimos ingresos, Ropa de mujer, Ropa de hombre, Ofertas | El título + un cartel "Muy pronto" con botones a Instagram y WhatsApp |
| Categorías (las 8 fichas del inicio) | Oculta |
| Tarjetas Mujer / Hombre / Ofertas | Ocultas |
| Menús Mujer, Hombre y Categorías del encabezado | Ocultos |
| Catálogo | Cartel "Muy pronto" |

**Todo lo demás sigue funcionando y a la vista:** logo, barra de anuncios,
slider, compras mínimas, beneficios, medios de pago con CVU y CBU, redes,
cómo comprar, envíos, mapa y pie de página.

### Cómo llenarla cuando tengas las fotos

1. **Definí tus categorías** en `data/config.js` --> `categorias: []`.
   En `data/ejemplos/categorias-ejemplo.js` tenés un bloque de ejemplo con el
   formato exacto: copialo, pegalo y ajustalo a tus categorías reales.
2. **Cargá los productos** en `data/productos.js`, o mejor con la planilla
   (`data/productos-plantilla.csv` + `herramientas/csv-a-productos.py`).
3. **Subí las fotos** a `img/productos/` y poné sus rutas en cada producto.

Apenas haya al menos un producto y una categoría, todas las secciones se
encienden solas. No hay que tocar nada más.

### ¿Querés volver a ver la tienda llena para probar?

Los 232 productos de demostración quedaron guardados en
`data/ejemplos/productos-ejemplo.js`. Para usarlos, en los 5 archivos `.html`
cambiá `data/productos.js` por `data/ejemplos/productos-ejemplo.js`
(y pegá las categorías de ejemplo en el config). Es solo para mirar cómo
queda con contenido: acordate de volver atrás antes de publicar.

---

## 1. Cómo abrirlo

Doble clic en **`index.html`**. Se abre en el navegador y funciona todo.

> Si vas a modificar archivos, es más cómodo usar un servidor local
> (extensión *Live Server* de VS Code, o `python3 -m http.server` desde esta carpeta).

---

## 2. Qué hay adentro

```
tienda/
│
├── index.html          Inicio: slider, condiciones, beneficios, secciones
│                       Mujer/Hombre/Ofertas, categorías, mapa del local
├── catalogo.html       Catálogo con árbol de categorías, filtros y "Mostrar más"
├── producto.html       Ficha: galería, doble precio, talles, colores, carrito
├── pedido.html         Formulario de pedido → WhatsApp
├── info.html           Las 7 páginas de "Antes de comprar"
│
├── css/
│   └── estilos.css     TODO el diseño. Los colores están arriba de todo.
│
├── js/
│   ├── tienda.js       Núcleo: header, mega menú, modo de precio, carrito, footer
│   ├── home.js         Slider y secciones del inicio
│   ├── catalogo.js     Filtros, búsqueda, orden, "Mostrar más productos"
│   ├── producto.js     Ficha de producto
│   ├── pedido.js       Validación y armado del mensaje de WhatsApp
│   ├── resumen.js      Genera la imagen del pedido con fotos, talles y modelos
│   └── info.js         Textos de "Antes de comprar" (editables ahí mismo)
│
├── data/
│   ├── config.js       ⭐ DATOS DE TU MARCA (empezá por acá)
│   ├── productos.js    ⭐ EL CATÁLOGO (hoy vacío, esperando tus productos)
│   ├── ejemplos/       Productos y categorías de demostración, por si querés probar
│   └── productos-plantilla.csv   Planilla para cargar productos desde Excel
│
├── img/
│   ├── productos/      Fotos de producto  (ver LEEME.txt adentro)
│   ├── banners/        Slider del inicio y fotos de categoría
│   └── marca/          Logo, favicon, imagen para compartir
│
└── herramientas/
    └── csv-a-productos.py   Convierte tu planilla en el catálogo del sitio
```

---

## 3. Cómo funciona el doble precio (mayorista / minorista)

Arriba a la derecha hay un selector **Por menor / Por mayor**. El visitante lo
cambia y **todos los precios de la tienda cambian al instante**. Se recuerda
entre visitas.

| | Por menor | Por mayor |
|---|---|---|
| Precio que se usa | `precio` | `precioMayorista` |
| Mínimo por artículo | 1 unidad | 3 unidades |
| **Compra mínima** | **$30.000** | **$100.000** |
| Datos extra en el pedido | — | comercio y CUIT |

Mientras no se cumplan las dos condiciones del modo mayorista, el botón
**Finalizar pedido** queda bloqueado y el carrito avisa exactamente cuánto falta.

En la ficha de producto se muestran **siempre los dos precios** en una caja
comparativa, con el activo resaltado.

Todo esto se configura en `data/config.js` → bloque `mayorista`:

```js
mayorista: {
  activo: true,
  modoPorDefecto: "minorista",   // con qué modo abre la tienda
  unidadesMinimas: 3,
  compraMinima: 100000,
  mostrarAmbosPrecios: true
}
```

Si querés que sea **solo minorista**, poné `activo: false` y el selector desaparece.

---

## 3.b Las secciones Mujer, Hombre y Ofertas

Cada producto tiene un campo **`genero`** con tres valores posibles:
`"mujer"`, `"hombre"` o `"unisex"`.

Con eso la tienda arma tres secciones que aparecen:

- como tres tarjetas grandes en el inicio, debajo de los beneficios;
- como bloques de productos más abajo en el inicio;
- como entradas **MUJER** y **HOMBRE** en el menú, cada una con todas las
  categorías adentro;
- como filtro **Sección** en la barra lateral del catálogo.

El filtro de género se **combina** con todo lo demás: podés entrar a
`Mujer → Remeras → Oversize`, o ver solo las ofertas de hombre.

### Lo importante: qué pasa con las prendas unisex

```js
generos: {
  incluirUnisexEnGenero: true,   // ← esta línea
  ...
}
```

Con `true`, una prenda marcada como **unisex aparece también en Mujer y en
Hombre**. Es lo que corresponde a una marca unisex: quien entra a "Mujer" ve
todo lo que le sirve, no solo lo exclusivo de mujer.

Con el catálogo de ejemplo eso da: 86 prendas de mujer + 62 unisex = **148 en
la sección Mujer**, y 84 + 62 = **146 en Hombre**.

Si preferís que cada sección muestre únicamente lo suyo, poné `false`.

---

## 4. Los 3 pasos para ponerla en marcha

### Paso 1 — Tus datos (5 minutos)

Abrí **`data/config.js`** y cambiá:

| Campo | Qué es |
|---|---|
| `anuncios` | Los mensajes que rotan en la barra dorada de arriba |
| `beneficios` | La tira de 4 íconos debajo del slider. Se edita libremente |
| `minorista.compraMinima` | Compra mínima por menor ($30.000) |
| `mayorista.compraMinima` | Pedido mínimo por mayor ($100.000) |
| `marca.nombre` / `marca.nombreAcento` | El nombre va en dos partes; la segunda se pinta en dorado |
| `contacto.whatsapp` | **El más importante.** Formato: `5491155554444` (sin `+`, sin `0`, sin `15`) |
| `contacto.email`, `direccion`, `horarios` | Pie de página y páginas de info |
| `redes.instagram`, `tiktok` | Dejá `""` en las que no uses y el ícono no aparece |
| `mayorista` | Mínimos y modo por defecto (ver arriba) |
| `envio` | Transportes y modalidad del envío (ver sección 9) |
| `banners` | Los 3 slides del inicio |
| `categorias` | Categorías y subcategorías del mega menú |
| `seccionesHome` | Qué bloques de productos aparecen en el inicio |
| `generos` | Secciones Mujer / Hombre / Unisex (ver sección 3.b) |
| `mediosPago` | Qué logos de pago se muestran |
| `pago` | CVU, CBU, alias y titular (ver sección 9.b) |
| `notificaciones.copiaPorEmail` | Copia de los pedidos por email (ver sección 9.c) |

### Paso 2 — Tus productos

**Opción A · a mano** (pocos productos)
Editá `data/productos.js`. Copiá un bloque completo y cambiale los valores.

**Opción B · desde Excel** (recomendada para +200 productos)

1. Abrí `data/productos-plantilla.csv` en Excel o Google Sheets.
2. Cargá tu catálogo, una fila por producto.
3. Guardalo como `data/productos.csv`.
4. En la terminal, parado en esta carpeta:
   ```
   python3 herramientas/csv-a-productos.py
   ```

El script avisa si hay códigos repetidos, precios faltantes o si algún precio
mayorista quedó más caro que el minorista.

### Paso 3 — Las fotos

Todo el instructivo está en **`img/productos/LEEME.txt`**.
Resumen: proporción 3:4, misma luz y mismo fondo en todas, menos de 250 KB.

**Mientras no haya fotos, la web funciona igual**: muestra un marco que dice
"Foto pendiente" con el código del artículo.

---

## 5. Los colores

Todo el diseño sale del bloque `:root` al principio de `css/estilos.css`.
Los dorados están elegidos y verificados para que se lean bien sobre blanco
(norma de accesibilidad WCAG AA):

```css
--c-tinta:       #453714;   /* texto y títulos — contraste 11.6:1 */
--c-tinta-suave: #6B5620;   /* texto secundario — 7.0:1 */
--c-acento:      #8A6A14;   /* precios y botones — 5.1:1 */
--c-oro:         #C9A227;   /* dorado brillante — SOLO decorativo, nunca texto */
--c-fondo:       #ffffff;
--c-fondo-alt:   #FAF7EF;   /* fondo de secciones alternas */
```

⚠️ Si cambiás `--c-acento` por un dorado más claro, los precios dejan de leerse
bien. Cualquier color que uses para texto tiene que tener contraste 4.5:1 o más
sobre blanco. Se verifica gratis en **webaim.org/resources/contrastchecker**.

---

## 6. Las páginas "Antes de comprar"

Son 7 y están todas en **`js/info.js`**, en el objeto `CONTENIDO`.
Se editan como texto normal (aceptan HTML simple):

- Cómo comprar
- Comprar por mayor
- Envíos
- Medios de pago
- Cambios y devoluciones
- Preguntas frecuentes
- El local y contacto

Los datos que ya cargaste en `config.js` (dirección, mínimos, transportes) se
insertan solos, así no los escribís dos veces.

---

## 7. Publicarla en internet (gratis)

**Netlify Drop** es lo más rápido: entrá a `app.netlify.com/drop` y arrastrá
esta carpeta entera. En 30 segundos tenés un link público.
Después se le puede conectar un dominio propio (`tumarca.com.ar`).

Alternativas equivalentes: Vercel, GitHub Pages, Cloudflare Pages.

---

## 8. Estado actual y qué falta

**Funcionando y probado en navegador**

- [x] Inicio con slider, 8 categorías y 3 bloques de productos
- [x] Mega menú de categorías con subcategorías + menú "Antes de comprar"
- [x] Barra de anuncios rotativa
- [x] Doble precio minorista / mayorista con mínimos y bloqueo de pedido
- [x] Catálogo de 232 productos con árbol de categorías, filtros, búsqueda
      por código, 8 criterios de orden y botón "Mostrar más productos"
- [x] Ficha con caja comparativa de precios, talles, colores y relacionados
- [x] Carrito lateral persistente con cálculo de envío
- [x] Pedido por WhatsApp con validación y datos de comercio
- [x] 7 páginas de información
- [x] Responsive real (celular, tablet, escritorio), sin desbordes horizontales
- [x] Contraste verificado en todos los textos

**Pendiente**

- [ ] **Archivo original del logo** → reemplazar `img/marca/logo.png`
- [ ] **Unidades mínimas por artículo en mayorista** → hoy 3, valor tentativo.
      Está en `config.js` → `mayorista.unidadesMinimas`
- [ ] **Catálogo real**: fotos, stock, precios y el género de cada prenda
      ← *lo que trae Ivan*
- [ ] Fotos del slider y de cada categoría
- [ ] Verificar que el pin del mapa caiga exacto (ver más abajo)
- [ ] **Confirmar el titular de las cuentas bancarias** (ver sección 9.b)
- [ ] Opcional pero recomendado: activar la copia por email (sección 9.c)

**Ya cargado y verificado**

- [x] WhatsApp 11 5509-2841 → todos los botones derivan ahí
- [x] Email Lvelazquez230318@gmail.com
- [x] Instagram @luz_indumentaria.a y TikTok @luzindumentaria3
- [x] Dirección Boyle 1549, Ingeniero Pablo Nogués + mapa de Google
- [x] Compra mínima $30.000 por menor y $100.000 por mayor, **controladas
      por el carrito**: no deja cerrar el pedido si no se llega
- [x] Envío a cargo del comprador: no se suma al total de la web
- [x] Botón "Calculá tu envío" con la tarifa oficial de Correo Argentino
- [x] Sección "¿Cómo funcionan los envíos?" con las dos modalidades
- [x] Sección "Cómo comprar" con los 6 pasos
- [x] Atención de 10 a 21 h · atención personalizada
- [x] Despacho de encomiendas todos los días por Correo Argentino
- [x] Stock actualizado 24/7 y últimas tendencias
- [x] Secciones Mujer, Hombre y Ofertas, combinables con categorías y filtros
- [x] Medios de pago con logos + CVU/CBU con botón de copiar
- [x] Carrito arriba a la derecha con cantidad y total en vivo
- [x] Imagen del pedido con fotos, modelos y talles + envío del comprobante
- [x] Pedido completo al WhatsApp 11 5509-2841 + paso de pago

---

## 9. Los envíos

**El costo del envío lo paga el comprador.** La web no lo cobra ni lo suma al
total: el carrito muestra "Total mercadería", y el envío se cotiza y se cobra
aparte cuando confirmás el pedido por WhatsApp.

En el mensaje que te llega por WhatsApp figura el transporte que eligió el
cliente y la dirección completa, así podés cotizarle el envío directamente.

```js
envio: {
  aCargoDelComprador: true,        // ← esto es lo que activa la modalidad
  costoEnvioEstandar: 0,
  montoEnvioGratis: 0,
  textoRetiro: "Retiro en el local sin cargo",
  demoraEstandar: "3 a 6 días",
  despacho: "Despachamos todos los días por Correo Argentino",
  transportes: ["Correo Argentino", "Andreani", "Vía Cargo", "Transporte propio"],
  calculadora: {
    texto: "Calculá tu envío",
    detalle: "Consultá la tarifa oficial de Correo Argentino...",
    link: "https://www.correoargentino.com.ar/servicios/paqueteria/encomienda-correo-clasica"
  }
}
```

### Las secciones "Cómo comprar" y "¿Cómo funcionan los envíos?"

Las dos están al final del inicio y también son páginas propias
(`info.html?tema=como-comprar` y `?tema=envios`). Cada texto vive en **una sola
función** de `js/tienda.js` (`bloqueComoComprar` y `bloqueComoEnviamos`), así el
inicio y la página nunca se desincronizan: lo editás una vez y cambia en los dos.

Los montos de las compras mínimas **no están escritos a mano** en esos textos:
salen de `config.js`. Si mañana cambiás el mínimo a $40.000, se actualiza solo
en los 6 lugares donde aparece.

### Sobre "¿Cómo funcionan los envíos?"

Está al final del inicio y también es la página de envíos (`info.html?tema=envios`).
El texto vive en **una sola función** (`bloqueComoEnviamos` en `js/tienda.js`),
así los dos lugares nunca se desincronizan: lo editás una vez y cambia en ambos.

Explica las dos modalidades: **Correo Argentino** (costo según peso y código
postal, se abona junto con la mercadería) y **Vía Cargo** (lo cotiza el
transporte y se abona en destino). Más el plazo de despacho de 48 horas hábiles
y el retiro por el local.

### El botón "Calculá tu envío"

Aparece en tres lugares: en el carrito, en el formulario de pedido (solo si
eligió envío, no si retira) y en la página de envíos. Abre en una pestaña nueva
la tarifa oficial de **Correo Argentino — Encomienda Clásica**.

Ojo con una cosa: esa página **no es una calculadora interactiva**, es una
tabla de precios por peso (hasta 25 kg). El cliente ve el rango de peso y el
destino (regional o nacional) y saca la cuenta. Igual sirve, porque le da una
idea del costo antes de comprar.

Por esa misma página ajusté la demora a **3 a 6 días**, que es lo que informa
Correo Argentino para ese servicio (antes decía "3 a 5 días hábiles", que me
lo había inventado yo).

Si algún día querés cobrar el envío desde la web, poné `aCargoDelComprador: false`
y completá `costoEnvioEstandar`. Si además querés hacer envío gratis a partir de
cierto monto, cargá ese monto en `montoEnvioGratis`. Todo el resto se acomoda solo.

Quien retira por el local nunca paga envío, en cualquiera de las dos modalidades.

---

## 9.b Medios de pago y datos bancarios

La sección **Medios de pago** aparece en el inicio y tiene su propia página
(`info.html?tema=medios-pago`). Muestra los logos de todos los medios y, debajo,
las cuentas para transferir con botón **Copiar** en cada dato.

### Los datos cargados

| Entidad | Tipo | Número | Alias |
|---|---|---|---|
| Mercado Pago | CVU | `0000003100096078582289` | `luzindu.20` |
| Banco Nación | CBU | `0110041930004129665079` | — |

Los dos números fueron **verificados con el algoritmo de dígito verificador del
CBU** y dan válidos. El código de entidad también corresponde: `000` es CVU de
billetera virtual y `011` es Banco de la Nación Argentina.

⚠️ Lo único que no puedo verificar es el **titular**. En `config.js` figura como
"LUZ Indumentaria Unisex". Si la cuenta está a nombre de una persona física,
cambialo por el nombre y apellido tal cual aparece en el banco: si no coincide,
el cliente desconfía y muchos homebanking lo marcan como alerta.

```js
pago: {
  titular: "LUZ Indumentaria Unisex",   // ← revisá esto
  cuentas: [
    { entidad: "Mercado Pago", marca: "mercadopago", tipo: "CVU",
      numero: "0000003100096078582289", alias: "luzindu.20" },
    { entidad: "Banco Nación", marca: "transferencia", tipo: "CBU",
      numero: "0110041930004129665079", alias: "" }
  ],
  aclaracion: "Mandanos el comprobante por WhatsApp..."
}
```

### Cuándo ve el cliente los datos bancarios

En tres momentos: en la sección del inicio, en la página de medios de pago, y
**apenas envía el pedido** — ahí se abre un panel dorado con las cuentas, el
total a transferir y un botón para mandarte el comprobante por WhatsApp.

### Sobre los logos

Están dibujados en SVG dentro de `js/tienda.js` (objeto `MARCAS_PAGO`), así que
no dependen de archivos de imagen ni pesan nada. Son representaciones simples
en los colores de cada marca, no los logos oficiales. Si querés los oficiales,
bajalos de la página de cada empresa, guardalos en `img/marca/pagos/` y
reemplazá el SVG por un `<img>`.

---

## 9.c Cómo te llega el pedido (leer esto)

El carrito está **arriba a la derecha**, muestra la cantidad de productos y el
total en vivo. El cliente puede sumar todos los productos que quiera y pagar
todo junto.

### El circuito completo

1. El cliente arma el carrito y toca **Finalizar pedido**.
2. Completa nombre, teléfono y dirección.
3. Al enviar, **se le abre WhatsApp con el pedido ya escrito**, dirigido a
   tu número (11 5509-2841).
4. En la misma página le aparece un panel con los datos para transferir.
5. Cuando transfiere, toca **"Ya transferí"** y te llega un segundo mensaje
   para que le mandes el comprobante.

### ⚠️ La limitación que tenés que conocer

Una web hecha con archivos sueltos (sin servidor) **no puede mandarte un
WhatsApp sola**. Lo que hace es abrir WhatsApp en el celular del cliente con
el mensaje escrito. **El cliente tiene que tocar "enviar".**

Si no lo toca, el pedido no te llega y vos ni te enterás.

Para reducir eso hice tres cosas:

- Un cartel verde arriba del botón que avisa que hay que tocar enviar.
- En el panel de después, un recordatorio y un botón **"Volver a abrir WhatsApp"**.
- Un botón **"Copiar el pedido"**, por si WhatsApp le falla y quiere pegarlo
  en otro lado.

### La red de seguridad: copia por email

Para no depender de que el cliente toque enviar, podés recibir **una copia
automática de cada pedido por email**:

1. Entrá a **formspree.io** (o getform.io) y creá un formulario gratis.
2. Te dan una URL tipo `https://formspree.io/f/xxxxxxx`.
3. Pegala en `config.js`:

```js
notificaciones: {
  copiaPorEmail: "https://formspree.io/f/xxxxxxx"
}
```

Listo. A partir de ahí, cada pedido te llega también al correo con todos los
datos del cliente, **aunque no toque enviar en WhatsApp**. Está desactivado
por defecto porque necesita que crees la cuenta.

Si más adelante querés que el aviso sea 100% automático y sin intervención del
cliente, hace falta un servidor y la API de WhatsApp Business, que ya es otro
tipo de proyecto (tiene costo mensual y aprobación de Meta).

---

## 9.d Cómo le llegan las fotos y el comprobante

### El límite que hay que conocer

Un link de WhatsApp (`wa.me`) **solo puede llevar texto**. No existe forma de
que una página web adjunte archivos a un mensaje de WhatsApp. Ninguna tienda
online lo hace, ni siquiera las plataformas grandes.

### Cómo lo resolvimos

Cuando el cliente termina el pedido, el navegador **dibuja una imagen** con el
pedido completo: la foto de cada prenda, el modelo con su código, el talle,
el color, la cantidad, los precios y los datos del cliente.

Después, según el dispositivo:

| Dónde | Qué pasa al tocar "Enviar pedido y comprobante" |
|---|---|
| **Celular** (Android / iPhone) | Se abre el menú de compartir del sistema. El cliente elige WhatsApp y se mandan **la imagen del pedido y el comprobante juntos**, en un solo paso. |
| **Computadora** | La imagen se descarga y se abre WhatsApp Web para que la adjunte junto al comprobante. |

El cliente adjunta su comprobante con el botón 📎 antes de enviar. El
comprobante lo tiene que poner él: ninguna web puede leer su app del banco.

### Si el producto no tiene foto cargada

La imagen igual se genera: en lugar de la foto muestra un recuadro con el
**código del artículo**. Así el pedido nunca queda incompleto.

### Dónde se toca

Todo está en `js/resumen.js`. Los colores, el tamaño de las fotos y el texto
del pie se cambian ahí arriba, en las constantes del principio.

---

## 10. El mapa del local

El mapa está en dos lugares: la sección "Dónde estamos" del inicio y la página
**El local y contacto**. Es un mapa embebido de Google que **no necesita cuenta
ni clave de API**, así que no tiene costo ni vencimiento.

La dirección que se busca está en `data/config.js`:

```js
local: {
  calle: "Boyle 1549",
  entreCalles: "entre Luis Vernet y Vías",
  localidad: "Ingeniero Pablo Nogués",
  provincia: "Provincia de Buenos Aires",
  mapaConsulta: "Boyle 1549, Ingeniero Pablo Nogués, Buenos Aires, Argentina",
  mostrarMapaEnInicio: true
}
```

**Si el pin no cae exactamente en la puerta del local:** abrí Google Maps,
buscá el local, y copiá la dirección tal cual aparece en Google. Pegala en
`mapaConsulta` y el pin se corrige. También podés pegar directamente las
coordenadas (ej: `"-34.4785,-58.7012"`), que es lo más exacto de todo.

Debajo del mapa siempre hay una barra con la dirección y un link a Google Maps,
así que aunque el mapa no cargue (sin internet, o un navegador que bloquee
Google) el cliente igual puede llegar.
- [ ] Precios mayoristas reales (hoy están calculados como ~65% del minorista)
- [ ] Revisar los textos legales de las páginas de info con tu criterio comercial
- [ ] Opcional: pasarela de pago (Mercado Pago) en vez de cerrar por WhatsApp
