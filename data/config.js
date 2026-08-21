/* ==========================================================================
   CONFIGURACIÓN GENERAL DE LA TIENDA
   --------------------------------------------------------------------------
   Este es el ÚNICO archivo que tenés que tocar para cambiar datos de la marca:
   nombre, WhatsApp, precios mayoristas, envíos, redes, banners y textos.
   ========================================================================== */

window.CONFIG = {

  /* --- Identidad -------------------------------------------------------
     El logo se lee de "logo". Para cambiarlo, reemplazá el archivo
     img/marca/logo.png por el tuyo (mismo nombre) y listo.
     Si el archivo no existe, la web muestra el nombre en texto dorado.   */
  marca: {
    nombre: "LUZ",
    nombreAcento: "Indumentaria Unisex",
    logo: "img/marca/logo.png",                 // emblema completo: header, pie y al compartir
    logoHeader: "img/marca/logo-horizontal.png",// versión horizontal, solo para el header encogido
    logoCentrado: true,             // true = logo grande y centrado arriba
    logoAltoHeader: 220,            // alto del logo grande, en píxeles
    logoAltoCompacto: 46,           // alto al que se encoge cuando bajás la página
    logoAltoFooter: 120,            // alto del logo en el pie de página
    slogan: "Indumentaria unisex por mayor y por menor",
    descripcion: "Indumentaria unisex para todos los cuerpos. Renovamos modelos todas las semanas y enviamos a todo el país.",
    anioFundacion: 2026
  },

  /* --- Contacto -------------------------------------------------------- */
  contacto: {
    // Formato internacional SIN + ni espacios: 54 + 9 + área sin 0 + número sin 15
    whatsapp: "5491155092841",
    mensajeInicial: "¡Hola LUZ! Quiero hacer una consulta 👋",
    email: "Lvelazquez230318@gmail.com",
    telefonoVisible: "11 5509-2841",
    direccion: "Boyle 1549, Ingeniero Pablo Nogués",
    horarios: "Atención de 10 a 21 h"
  },

  /* --- El local y el mapa ----------------------------------------------
     "mapaConsulta" es lo que se busca en Google Maps. Si el pin no cae
     exacto, abrí Google Maps, buscá el local, copiá la dirección tal cual
     aparece ahí y pegala en esta línea.                                  */
  local: {
    calle: "Boyle 1549",
    entreCalles: "entre Luis Vernet y Vías",
    localidad: "Ingeniero Pablo Nogués",
    provincia: "Provincia de Buenos Aires",
    mapaConsulta: "Boyle 1549, Ingeniero Pablo Nogués, Buenos Aires, Argentina",
    mostrarMapaEnInicio: false
  },

  /* --- Redes ------------------------------------------------------------
     "usuario" es el @ que se muestra en pantalla. Si lo dejás vacío,
     igual funciona el link pero se ve menos claro.                        */
  redes: {
    instagram: "https://www.instagram.com/luz_indumentaria.a?igsh=YXg4Z2k2ZWkxdjBq",
    instagramUsuario: "@luz_indumentaria.a",
    tiktok: "https://www.tiktok.com/@luzindumentaria3?_r=1&_t=ZS-98wKrzs6khL",
    tiktokUsuario: "@luzindumentaria3",
    facebook: "",
    facebookUsuario: "",
    mostrarSeccionEnInicio: true
  },

  /* --- Comercial ------------------------------------------------------- */
  moneda: { simbolo: "$", codigo: "ARS", locale: "es-AR" },

  /* --- MAYORISTA / MINORISTA -------------------------------------------
     La tienda funciona en dos modos y el visitante elige con el selector
     que está arriba a la derecha.

       modoPorDefecto      Con qué modo abre la tienda: "minorista" o "mayorista"
       unidadesMinimas     Unidades del MISMO artículo para que sea por mayor
       compraMinima        Monto mínimo en pesos para cerrar un pedido mayorista
       mostrarAmbosPrecios true = en modo minorista se ve también el precio por mayor
     -------------------------------------------------------------------- */
  mayorista: {
    activo: false,
    modoPorDefecto: "minorista",
    unidadesMinimas: 3,
    compraMinima: 100000,          // pedido mínimo por mayor
    mostrarAmbosPrecios: true,
    textoLegal: "Los precios por mayor se aplican automáticamente al alcanzar la cantidad mínima por artículo."
  },

  /* Compra mínima también para la venta por menor.
     Poné 0 si algún día querés sacarla.                                   */
  minorista: {
    compraMinima: 30000
  },

  /* --- Envíos -----------------------------------------------------------
     aCargoDelComprador: true  → el envío NO se suma al total de la web.
     El total que ve el cliente es solo la mercadería, y el costo del envío
     se coordina por WhatsApp / lo paga al recibir.

     Si algún día querés cobrarlo desde la web, poné false y completá
     costoEnvioEstandar (y montoEnvioGratis si hacés envío gratis).        */
  envio: {
    aCargoDelComprador: true,
    costoEnvioEstandar: 0,
    montoEnvioGratis: 0,
    textoEnvio: "El costo del envío lo abona el comprador",
    textoRetiro: "Retiro en el local sin cargo",
    demoraEstandar: "3 a 6 días",
    despacho: "Despachamos todos los días por Correo Argentino",
    transportes: ["Correo Argentino", "Andreani", "Vía Cargo", "Transporte propio"],

    /* Link donde el cliente consulta cuánto le sale el envío.
       Es la tabla oficial de Correo Argentino (Encomienda Clásica):
       precios por peso, hasta 25 kg, entrega a domicilio en 3 a 6 días.  */
    calculadora: {
      texto: "Calculá tu envío",
      detalle: "Consultá la tarifa oficial de Correo Argentino según el peso y el destino",
      link: "https://www.correoargentino.com.ar/servicios/paqueteria/encomienda-correo-clasica"
    }
  },

  cuotas: { cantidad: 0, sinInteres: false },

  /* --- MEDIOS DE PAGO ---------------------------------------------------
     "marca" es el logo que se dibuja. Disponibles:
       visa · mastercard · amex · cabal · naranja · mercadopago
       transferencia · efectivo · debito · credito                        */
  mediosPago: [
    { marca: "transferencia", nombre: "Transferencia bancaria", grupo: "transferencia",
      detalle: "Sin recargo · el medio que recomendamos" },
    { marca: "mercadopago",   nombre: "Mercado Pago",           grupo: "transferencia",
      detalle: "Transferencia o dinero en cuenta" },
    { marca: "credito",       nombre: "Tarjeta de crédito",     grupo: "credito",
      detalle: "Crédito y débito" },
    { marca: "debito",        nombre: "Tarjeta de débito",      grupo: "debito",
      detalle: "Acreditación inmediata" },
    { marca: "visa",          nombre: "Visa",                   grupo: "tarjetas" },
    { marca: "mastercard",    nombre: "Mastercard",             grupo: "tarjetas" },
    { marca: "amex",          nombre: "American Express",       grupo: "tarjetas" },
    { marca: "cabal",         nombre: "Cabal",                  grupo: "tarjetas" },
    { marca: "naranja",       nombre: "Naranja",                grupo: "tarjetas" },
    { marca: "efectivo",      nombre: "Efectivo",               grupo: "efectivo",
      detalle: "Solo en el local" }
  ],

  /* --- DATOS PARA TRANSFERIR --------------------------------------------
     Es lo que se le muestra al cliente cuando elige pagar.
     Revisá que el titular sea el correcto antes de publicar.             */
  pago: {
    titular: "LUZ Indumentaria Unisex",
    cuentas: [
      {
        entidad: "Mercado Pago",
        marca: "mercadopago",
        tipo: "CVU",
        numero: "0000003100096078582289",
        alias: "luzindu.20"
      },
      {
        entidad: "Banco Nación",
        marca: "transferencia",
        tipo: "CBU",
        numero: "0110041930004129665079",
        alias: ""
      }
    ],
    aclaracion: "Mandanos el comprobante por WhatsApp y preparamos tu pedido. " +
                "Reservamos la mercadería 24 h a la espera del pago."
  },

  /* --- COPIA DE SEGURIDAD DE LOS PEDIDOS ---------------------------------
     El pedido llega por WhatsApp, pero el cliente tiene que tocar "enviar".
     Si no lo toca, el pedido se pierde y vos ni te enterás.

     Para tener una copia automática por email (recomendado):
       1. Entrá a formspree.io (o getform.io) y creá un formulario gratis.
       2. Te dan una URL tipo https://formspree.io/f/xxxxxxx
       3. Pegala acá abajo.

     Cada pedido te va a llegar también por email, aunque el cliente
     no llegue a mandar el WhatsApp. Dejalo en "" para desactivarlo.       */
  notificaciones: {
    copiaPorEmail: ""
  },

  /* --- Comportamiento del catálogo -------------------------------------- */
  catalogo: {
    productosPorTanda: 24,          // cuántos carga el botón "Mostrar más productos"
    ordenPorDefecto: "destacados"
  },

  /* --- Barra de anuncios (rota sola cada 4 segundos) -------------------- */
  anuncios: [
    "Pedidos por mayor desde $100.000 · Por menor desde $30.000",
    "Atención de 10 a 21 h · Atención personalizada",
    "Despacho de encomiendas todos los días por Correo Argentino",
    "Stock actualizado 24/7 · Últimas tendencias"
  ],

  /* --- Tira de beneficios del inicio -------------------------------------
     "icono" es el nombre del ícono ya dibujado en js/tienda.js.
     Disponibles: local · camion · tarjeta · escudo · reloj · pin · sobre
                  cambio · corazon · bolsa · busca · refresco · chispa    */
  beneficios: [
    { icono: "reloj",    titulo: "Atención de 10 a 21 h",   texto: "Atención personalizada, todos los días" },
    { icono: "camion",   titulo: "Despacho todos los días", texto: "Encomiendas por Correo Argentino" },
    { icono: "refresco", titulo: "Stock actualizado 24/7",  texto: "Lo que ves en la web es lo que hay" },
    { icono: "chispa",   titulo: "Últimas tendencias",      texto: "Ingresos nuevos todas las semanas" }
  ],

  /* --- Slider del inicio ------------------------------------------------
     Poné la ruta de la foto en "imagen" cuando la tengas.
     Mientras esté vacía, se muestra un fondo dorado con el texto.        */
  banners: [
    {
      antetitulo: "Temporada 2026",
      titulo: "Nueva colección unisex",
      bajada: "Básicos de calidad para todos los cuerpos.",
      textoBoton: "Ver catálogo",
      link: "catalogo.html",
      imagen: ""
    },
    /* Sección mayorista desactivada por ahora */
    {
      antetitulo: "Ofertas imperdibles",
      titulo: "Hasta 40% off",
      bajada: "Últimas unidades de la temporada anterior.",
      textoBoton: "Ver ofertas",
      link: "catalogo.html?oferta=1",
      imagen: ""
    }
  ],

  /* --- Secciones por género ---------------------------------------------
     Cada producto tiene un campo "genero": "mujer", "hombre" o "unisex".

     incluirUnisexEnGenero: true  → las prendas unisex aparecen TAMBIÉN en
     Mujer y en Hombre. Es lo lógico para una marca unisex: el cliente entra
     a "Mujer" y ve todo lo que le sirve, no solo lo exclusivo de mujer.
     Poné false si querés que cada sección muestre solo lo suyo.           */
  generos: {
    incluirUnisexEnGenero: true,
    lista: [
      { slug: "mujer",  nombre: "Mujer",  imagen: "img/productos/jeans-wide-leg-1.jpg" },
      { slug: "hombre", nombre: "Hombre", imagen: "img/productos/buzo-hombre-1.jpg" },
      { slug: "unisex", nombre: "Unisex", imagen: "img/productos/gorro-unisex-1.jpg" }
    ]
  },

  /* --- Categorías y subcategorías ---------------------------------------
     ⏳ VACÍO A PROPÓSITO, hasta que definas tus categorías reales.

     Mientras esté vacío, la web oculta sola la sección "Categorías" del
     inicio y los menús Mujer / Hombre / Categorías del encabezado.
     No queda ningún hueco roto.

     Cuando tengas las fotos y sepas cómo querés agrupar los productos,
     abrí  data/ejemplos/categorias-ejemplo.js  y copiá ese bloque acá.

     Formato:
       { slug: "remeras", nombre: "Remeras", imagen: "", subcategorias: [
           { slug: "manga-corta", nombre: "Manga corta" },
           { slug: "oversize",    nombre: "Oversize" }
       ]},

     El "slug" es el identificador interno: sin espacios, sin acentos y en
     minúscula. Es lo que va en el campo "categoria" de cada producto.     */
  categorias: [
    { slug: "camperas", nombre: "Camperas", imagen: "img/productos/campera-jeans-1.jpg", subcategorias: [
      { slug: "deportivas", nombre: "Deportivas" },
      { slug: "abrigo",     nombre: "De abrigo" }
    ]},
    { slug: "jeans", nombre: "Jeans", imagen: "img/productos/jeans-wide-leg-1.jpg", subcategorias: [
      { slug: "wide-leg", nombre: "Wide Leg" },
      { slug: "baggy",    nombre: "Baggy" },
      { slug: "jogger",   nombre: "Jogger" }
    ]},
    { slug: "remeras", nombre: "Remeras", imagen: "img/productos/remera-morley-cierre-1.jpg", subcategorias: [
      { slug: "estampadas", nombre: "Estampadas" },
      { slug: "con-cierre", nombre: "Con cierre" },
      { slug: "basicas",    nombre: "Básicas" },
      { slug: "puperas",    nombre: "Puperas" },
      { slug: "manga-larga", nombre: "Manga larga" }
    ]},
    { slug: "buzos", nombre: "Buzos", imagen: "img/productos/buzo-hombre-1.jpg", subcategorias: [
      { slug: "basicos", nombre: "Básicos" }
    ]},
    { slug: "calzado", nombre: "Calzado", imagen: "img/productos/zapatilla-deportiva-1.jpg", subcategorias: [
      { slug: "borcegos",    nombre: "Borcegos" },
      { slug: "zapatillas",  nombre: "Zapatillas" }
    ]},
    { slug: "ropa-interior", nombre: "Ropa interior", imagen: "img/productos/boxer-hombre-1.jpg", subcategorias: [
      { slug: "boxers", nombre: "Bóxers" }
    ]},
    { slug: "pantalones", nombre: "Pantalones", imagen: "img/productos/calza-oxford-1.jpg", subcategorias: [
      { slug: "joggers", nombre: "Joggers" },
      { slug: "calzas",  nombre: "Calzas" },
      { slug: "shorts",  nombre: "Shorts" }
    ]},
    { slug: "accesorios", nombre: "Accesorios", imagen: "img/productos/gorro-unisex-1.jpg", subcategorias: [
      { slug: "medias", nombre: "Medias y soquetes" },
      { slug: "gorras", nombre: "Gorras y viseras" }
    ]}
    /* Acá se van sumando las demás categorías a medida que carguemos productos.
       En data/ejemplos/categorias-ejemplo.js hay una lista larga de referencia. */
  ],

  /* --- Secciones destacadas del inicio ----------------------------------
     Cada bloque arma una grilla filtrando el catálogo.                   */
  seccionesHome: [
    { titulo: "Últimos ingresos",   tipo: "nuevos", cantidad: 6, link: "catalogo.html?orden=nuevos" },
    { titulo: "Ropa de mujer",      tipo: "genero", valor: "mujer",  cantidad: 6, link: "catalogo.html?genero=mujer" },
    { titulo: "Ropa de hombre",     tipo: "genero", valor: "hombre", cantidad: 6, link: "catalogo.html?genero=hombre" },
    { titulo: "Ofertas",            tipo: "oferta", cantidad: 6, link: "catalogo.html?oferta=1" }
  ],

  /* --- Paleta de colores disponible -------------------------------------- */
  colores: [
    { slug: "negro",    nombre: "Negro",    hex: "#141414" },
    { slug: "blanco",   nombre: "Blanco",   hex: "#f5f2ed" },
    { slug: "crudo",    nombre: "Crudo",    hex: "#e3d9c8" },
    { slug: "gris",     nombre: "Gris",     hex: "#8e8e8e" },
    { slug: "beige",    nombre: "Beige",    hex: "#c9b190" },
    { slug: "chocolate",nombre: "Chocolate",hex: "#5a3a26" },
    { slug: "verde",    nombre: "Verde",    hex: "#4a5b42" },
    { slug: "azul",     nombre: "Azul",     hex: "#2f4157" },
    { slug: "celeste",  nombre: "Celeste",  hex: "#9db8cc" },
    { slug: "bordo",    nombre: "Bordó",    hex: "#6d2436" },
    { slug: "oro",      nombre: "Oro viejo",hex: "#b8912f" },
    { slug: "arena",    nombre: "Arena",    hex: "#d9c9a8" },
    { slug: "militar",  nombre: "Verde militar", hex: "#4a5240" },
    { slug: "fucsia",   nombre: "Fucsia",   hex: "#b5359c" },
    { slug: "lila",     nombre: "Lila",     hex: "#c9a3d8" },
    { slug: "cremita",  nombre: "Cremita",  hex: "#efe6d5" },
    { slug: "rosa",     nombre: "Rosa",     hex: "#f4b8c8" },
    { slug: "rojo",     nombre: "Rojo",     hex: "#c0392b" },
    { slug: "amarillo", nombre: "Amarillo", hex: "#e6c84c" },
    { slug: "verde-claro", nombre: "Verde claro", hex: "#8fbf6f" },
    { slug: "rojizo",      nombre: "Rojizo",      hex: "#8b5e5e" },
    { slug: "verde-menta", nombre: "Verde menta", hex: "#98d4b5" },
    { slug: "verde-oliva", nombre: "Verde oliva", hex: "#5a6e3c" },
    { slug: "uva",         nombre: "Uva",         hex: "#4a2040" },
    { slug: "verde-oscuro",nombre: "Verde oscuro", hex: "#2a3a2a" },
    { slug: "gris-oscuro", nombre: "Gris oscuro", hex: "#4a4a4a" },
    { slug: "vino",        nombre: "Vino",        hex: "#5c2033" },
    { slug: "gris-claro", nombre: "Gris claro",  hex: "#c0c0c0" },
    { slug: "azul-marino",nombre: "Azul marino", hex: "#1a2744" },
    { slug: "marron",      nombre: "Marrón",      hex: "#6b4226" },
    { slug: "desgastado", nombre: "Desgastado", hex: "#8a9aad" },
    { slug: "rosa-viejo", nombre: "Rosa viejo", hex: "#b5808e" }
  ],

  /* --- Talles ----------------------------------------------------------- */
  talles: ["XS", "S", "M", "L", "XL", "XXL"],

  tablaTalles: {
    encabezados: ["Talle", "Pecho (cm)", "Largo (cm)", "Hombro (cm)"],
    filas: [
      ["XS",  "94",  "66", "42"],
      ["S",   "100", "68", "44"],
      ["M",   "106", "70", "46"],
      ["L",   "112", "72", "48"],
      ["XL",  "118", "74", "50"],
      ["XXL", "124", "76", "52"]
    ]
  },

  info: {
    cambios: "Tenés 30 días corridos desde que recibís el pedido para cambiar la prenda, sin uso y con su etiqueta original.",
    cuidados: [
      "Lavar a máquina con agua fría, del revés.",
      "No usar lavandina ni blanqueadores ópticos.",
      "Secar a la sombra, sin secarropas.",
      "Planchar a temperatura media."
    ]
  }
};
