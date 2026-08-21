/* ==========================================================================
   NÚCLEO DE LA TIENDA
   Se carga en TODAS las páginas: utilidades, header con mega menú,
   selector minorista/mayorista, footer, carrito, favoritos y avisos.
   ========================================================================== */
(function () {
  "use strict";

  const CFG = window.CONFIG;
  const PRODS = window.PRODUCTOS || [];
  const MAY = CFG.mayorista;
  const MIN = CFG.minorista || { compraMinima: 0 };

  /* ---------------------------------------------------------------- Utils */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const precio = (n) =>
    CFG.moneda.simbolo + new Intl.NumberFormat(CFG.moneda.locale, {
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Math.round(n || 0));

  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const paramURL = (k) => new URLSearchParams(location.search).get(k);

  const colorPorSlug = (slug) =>
    CFG.colores.find((c) => c.slug === slug) || { slug, nombre: slug, hex: "#cccccc" };

  const catPorSlug = (slug) =>
    CFG.categorias.find((c) => c.slug === slug) || { slug, nombre: slug, subcategorias: [] };

  const subPorSlug = (catSlug, subSlug) => {
    const c = catPorSlug(catSlug);
    return (c.subcategorias || []).find((s) => s.slug === subSlug) || { slug: subSlug, nombre: subSlug };
  };

  /* ------------------------------------------------------------- Géneros */
  const GEN = CFG.generos || { incluirUnisexEnGenero: true, lista: [] };

  const generoPorSlug = (slug) =>
    (GEN.lista || []).find((g) => g.slug === slug) || { slug, nombre: slug };

  /* ¿Este producto entra en la sección de género pedida?
     Con incluirUnisexEnGenero activado, las prendas unisex entran en
     Mujer y en Hombre además de en su propia sección.                    */
  const esDelGenero = (p, slug) => {
    if (!slug) return true;
    if (p.genero === slug) return true;
    if (GEN.incluirUnisexEnGenero && p.genero === "unisex" && slug !== "unisex") return true;
    return false;
  };

  const stockTotal = (p) => Object.values(p.stock || {}).reduce((a, b) => a + b, 0);
  const tallesDe = (p) => Object.keys(p.stock || {});
  const descuento = (p) => p.precioAnterior ? Math.round((1 - p.precio / p.precioAnterior) * 100) : 0;

  const linkWsp = (texto) =>
    "https://wa.me/" + CFG.contacto.whatsapp + "?text=" + encodeURIComponent(texto);

  /* ------------------------------------------------------- Local y mapa */
  const LOCAL = CFG.local || {};

  const direccionCompleta = () =>
    [LOCAL.calle, LOCAL.localidad, LOCAL.provincia].filter(Boolean).join(", ");

  const consultaMapa = () => LOCAL.mapaConsulta || direccionCompleta() || CFG.contacto.direccion;

  /* Link para abrir Google Maps / la app de mapas del celular */
  const linkMapa = () =>
    "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(consultaMapa());

  /* Mapa embebido. No necesita clave de API ni cuenta de Google.
     Debajo lleva una barra con la dirección y el link directo, que sirve
     igual si el mapa no carga (sin internet, bloqueado por el navegador...). */
  const mapaHTML = (clase) => `
    <div class="mapa ${clase || ""}">
      <iframe title="Ubicación del local de ${esc(CFG.marca.nombre)}"
              src="https://www.google.com/maps?q=${encodeURIComponent(consultaMapa())}&output=embed"
              loading="lazy" allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"></iframe>
      <a class="mapa__pie" href="${linkMapa()}" target="_blank" rel="noopener">
        ${ICO.pin}<span>${esc(direccionCompleta())}</span>
        <strong>Abrir en Google Maps →</strong>
      </a>
    </div>`;

  /* ------------------------------------------------- Almacenamiento local */
  const guardar = (clave, valor) => {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* modo privado */ }
  };
  const leer = (clave, porDefecto) => {
    try {
      const v = localStorage.getItem(clave);
      return v == null ? porDefecto : JSON.parse(v);
    } catch (e) { return porDefecto; }
  };

  /* ==========================================================================
     MODO DE PRECIO — minorista / mayorista
     ========================================================================== */
  const Modo = {
    valor: (function () {
      const forzado = new URLSearchParams(location.search).get("modo");
      if (forzado === "mayorista" || forzado === "minorista") return forzado;
      return leer("tienda_modo", MAY.activo ? MAY.modoPorDefecto : "minorista");
    })(),

    esMayorista() { return MAY.activo && this.valor === "mayorista"; },

    cambiar(nuevo) {
      if (this.valor === nuevo) return;
      this.valor = nuevo;
      guardar("tienda_modo", nuevo);
      Carrito.recalcular();
      document.dispatchEvent(new CustomEvent("modo:cambio"));
    },

    /* Precio unitario que corresponde según el modo activo */
    precioDe(p) { return this.esMayorista() ? p.precioMayorista : p.precio; },

    /* Cantidad mínima por artículo que exige el modo activo */
    minimoPorArticulo() { return this.esMayorista() ? MAY.unidadesMinimas : 1; },

    etiqueta() { return this.esMayorista() ? "Por mayor" : "Por menor"; }
  };

  /* ==========================================================================
     CARRITO
     ========================================================================== */
  const Carrito = {
    items: leer("tienda_carrito", []),

    _persistir() {
      guardar("tienda_carrito", this.items);
      document.dispatchEvent(new CustomEvent("carrito:cambio"));
    },

    llave(id, talle, color) { return `${id}__${talle}__${color}`; },

    /* Vuelve a leer los precios del catálogo según el modo activo */
    recalcular() {
      this.items.forEach((i) => {
        const p = PRODS.find((x) => x.id === i.id);
        if (p) { i.precio = Modo.precioDe(p); i.modo = Modo.valor; }
      });
      this._persistir();
    },

    agregar(producto, talle, color, cantidad = 1) {
      const k = this.llave(producto.id, talle, color);
      const disponible = producto.stock[talle] || 0;
      const existente = this.items.find((i) => i.llave === k);

      if (existente) {
        existente.cantidad = Math.min(existente.cantidad + cantidad, disponible);
        existente.precio = Modo.precioDe(producto);
      } else {
        this.items.push({
          llave: k, id: producto.id, codigo: producto.codigo,
          nombre: producto.nombre, slug: producto.slug,
          precio: Modo.precioDe(producto), modo: Modo.valor,
          talle, color,
          imagen: (producto.imagenes && producto.imagenes[0]) || "",
          cantidad: Math.min(cantidad, disponible)
        });
      }
      this._persistir();
    },

    cambiarCantidad(llave, delta) {
      const it = this.items.find((i) => i.llave === llave);
      if (!it) return;
      const prod = PRODS.find((p) => p.id === it.id);
      const max = prod ? (prod.stock[it.talle] || 99) : 99;
      const nueva = it.cantidad + delta;
      if (nueva <= 0) { this.quitar(llave); return; }
      it.cantidad = Math.min(nueva, max);
      this._persistir();
    },

    quitar(llave) {
      this.items = this.items.filter((i) => i.llave !== llave);
      this._persistir();
    },

    vaciar() { this.items = []; this._persistir(); },

    unidades() { return this.items.reduce((a, i) => a + i.cantidad, 0); },
    subtotal() { return this.items.reduce((a, i) => a + i.precio * i.cantidad, 0); },

    /* El envío queda a cargo del comprador: no se suma al total de la web. */
    envioACargoDelComprador() { return CFG.envio.aCargoDelComprador !== false; },

    costoEnvio() {
      if (!this.items.length || this.envioACargoDelComprador()) return 0;
      const gratis = CFG.envio.montoEnvioGratis || 0;
      if (gratis && this.subtotal() >= gratis) return 0;
      return CFG.envio.costoEnvioEstandar || 0;
    },

    /* Lo que se muestra en la línea "Envío" del carrito y del resumen */
    textoEnvio(retira) {
      if (retira) return "Sin cargo";
      if (this.envioACargoDelComprador()) return "A cargo del comprador";
      return this.costoEnvio() === 0 ? "Sin cargo" : precio(this.costoEnvio());
    },

    total() { return this.subtotal() + this.costoEnvio(); },

    /* --- Compra mínima (rige en los dos modos) -------------------------- */

    /* Monto mínimo que corresponde al modo activo */
    compraMinima() {
      return Modo.esMayorista() ? (MAY.compraMinima || 0) : (MIN.compraMinima || 0);
    },

    /* Cuánto falta en pesos para poder cerrar el pedido */
    faltaParaMinimo() {
      const min = this.compraMinima();
      if (!min) return 0;
      return Math.max(0, min - this.subtotal());
    },

    /* Artículos que no llegan a la cantidad mínima (solo aplica por mayor) */
    articulosBajoMinimo() {
      if (!Modo.esMayorista()) return [];
      return this.items.filter((i) => i.cantidad < MAY.unidadesMinimas);
    },

    puedeCerrar() {
      return this.items.length > 0 &&
             this.faltaParaMinimo() === 0 &&
             this.articulosBajoMinimo().length === 0;
    },

    /* --- Texto del pedido para WhatsApp -------------------------------- */
    textoPedido(datos) {
      const L = [];
      L.push(`*NUEVO PEDIDO ${Modo.esMayorista() ? "MAYORISTA" : "MINORISTA"}*`);
      L.push(`${CFG.marca.nombre} ${CFG.marca.nombreAcento}`);
      L.push("");
      this.items.forEach((i) => {
        L.push(`• ${i.cantidad}x ${i.nombre} (${i.codigo})`);
        L.push(`   Talle ${i.talle} · ${colorPorSlug(i.color).nombre}`);
        L.push(`   ${precio(i.precio)} c/u = ${precio(i.precio * i.cantidad)}`);
      });
      L.push("");
      L.push(`Unidades: ${this.unidades()}`);
      L.push(`Subtotal: ${precio(this.subtotal())}`);
      const retira = datos && datos.entrega && datos.entrega.indexOf("Retiro") === 0;
      if (retira) {
        L.push("Entrega: retira en el local (sin cargo)");
        L.push(`*TOTAL MERCADERÍA: ${precio(this.subtotal())}*`);
      } else if (this.envioACargoDelComprador()) {
        L.push("Envío: a cargo del comprador (se coordina aparte)");
        L.push(`*TOTAL MERCADERÍA: ${precio(this.subtotal())}*`);
      } else {
        L.push(`Envío: ${this.costoEnvio() === 0 ? "sin cargo" : precio(this.costoEnvio())}`);
        L.push(`*TOTAL: ${precio(this.total())}*`);
      }
      if (datos) {
        L.push("");
        L.push("*Datos del cliente*");
        L.push(`Nombre: ${datos.nombre}`);
        if (datos.empresa) L.push(`Comercio: ${datos.empresa}`);
        if (datos.cuit) L.push(`CUIT: ${datos.cuit}`);
        L.push(`Teléfono: ${datos.telefono}`);
        if (datos.email) L.push(`Email: ${datos.email}`);
        L.push(`Entrega: ${datos.entrega}`);
        if (datos.transporte) L.push(`Transporte: ${datos.transporte}`);
        if (datos.direccion) L.push(`Dirección: ${datos.direccion}`);
        if (datos.localidad) L.push(`Localidad / CP: ${datos.localidad}`);
        if (datos.notas) L.push(`Notas: ${datos.notas}`);
      }
      return L.join("\n");
    }
  };

  /* ------------------------------------------------------------ Favoritos */
  const Favoritos = {
    ids: leer("tienda_favoritos", []),
    tiene(id) { return this.ids.indexOf(id) !== -1; },
    alternar(id) {
      this.ids = this.tiene(id) ? this.ids.filter((x) => x !== id) : this.ids.concat(id);
      guardar("tienda_favoritos", this.ids);
      document.dispatchEvent(new CustomEvent("favoritos:cambio"));
      return this.tiene(id);
    }
  };

  /* ---------------------------------------------------------------- Aviso */
  let avisoTimer;
  function aviso(msg) {
    let el = $(".aviso");
    if (!el) {
      el = document.createElement("div");
      el.className = "aviso";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.dataset.visible = "true";
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(() => { el.dataset.visible = "false"; }, 2800);
  }

  /* --------------------------------------------------------------- Iconos */
  const ICO = {
    busca: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
    bolsa: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7L6 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    corazon: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20z"/></svg>',
    menu: '<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    cerrar: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chevron: '<svg class="flecha" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
    izq: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    der: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    mas: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    local: '<svg viewBox="0 0 24 24"><path d="M4 10l1.5-5h13L20 10M4 10h16v9H4z"/><path d="M9 19v-5h6v5"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/></svg>',
    sobre: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 6.5 12 13l8.5-6.5"/></svg>',
    reloj: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5.5l3.5 2"/></svg>',
    refresco: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.4-5.7"/><path d="M20 4v4h-4"/><path d="M9.5 12.3l1.8 1.8 3.4-3.6"/></svg>',
    chispa: '<svg viewBox="0 0 24 24"><path d="M12 3l2.1 5.4L19.5 10l-5.4 2.1L12 17.5l-2.1-5.4L4.5 10l5.4-1.6z"/><path d="M18.5 15.5l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>',
    camion: '<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17.5" cy="18" r="1.6"/></svg>',
    cambio: '<svg viewBox="0 0 24 24"><path d="M4 9h13l-3-3M20 15H7l3 3"/></svg>',
    tarjeta: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    escudo: '<svg viewBox="0 0 24 24"><path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M9.5 12l1.8 1.8 3.4-3.6"/></svg>',
    ig: '<svg viewBox="0 0 24 24" style="stroke:none"><defs><linearGradient id="igG" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#feda75"/><stop offset="25%" stop-color="#fa7e1e"/><stop offset="50%" stop-color="#d62976"/><stop offset="75%" stop-color="#962fbf"/><stop offset="100%" stop-color="#4f5bd5"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#igG)"/><circle cx="12" cy="12" r="4" fill="none" stroke="#fff" stroke-width="1.5"/><circle cx="17" cy="7" r="1.2" fill="#fff"/></svg>',
    tt: '<svg viewBox="0 0 24 24" style="stroke:none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#000"/><path d="M16.5 6.5c-.4-.8-.5-1.5-.5-2.5h-2.5v10.5a2.25 2.25 0 1 1-1.5-2.12v-2.63a4.75 4.75 0 1 0 4 4.7V9.5c.9.6 2 1 3 1V8a4.2 4.2 0 0 1-2.5-1.5z" fill="#fff"/><path d="M16.5 6.5c-.4-.8-.5-1.5-.5-2.5h-2.5v10.5a2.25 2.25 0 0 1-2.25 2.25 2.25 2.25 0 0 1-.75-4.37v-2.63a4.75 4.75 0 0 0 0 9.5 4.75 4.75 0 0 0 4.75-4.75V9.5c.9.6 2 1 3 1V8a4.2 4.2 0 0 1-2.5-1.5z" fill="#25F4EE" opacity=".6"/><path d="M13.5 4h2.5c0 1 .1 1.7.5 2.5A4.2 4.2 0 0 0 19 8v2.5" fill="none" stroke="#FE2C55" stroke-width=".8"/></svg>',
    fb: '<svg viewBox="0 0 24 24" style="stroke:none"><rect x="2" y="2" width="20" height="20" rx="4" fill="#1877F2"/><path d="M14 8h2V5h-2a3 3 0 0 0-3 3v2H9v3h2v6h3v-6h2l1-3h-3V9a1 1 0 0 1 1-1z" fill="#fff"/></svg>',
    wsp: '<svg viewBox="0 0 24 24" style="stroke:none"><circle cx="12" cy="12" r="10" fill="#25D366"/><path d="M12.04 4.5A7.4 7.4 0 0 0 4.6 11.9a7.3 7.3 0 0 0 1.01 3.72L4.5 19.5l3.96-1.04a7.4 7.4 0 0 0 3.57.91h.01a7.4 7.4 0 0 0 7.43-7.43A7.4 7.4 0 0 0 12.04 4.5zm4.35 10.55c-.18.51-1.05.98-1.46 1.01-.37.04-.73.17-2.47-.52-2.09-.83-3.41-2.96-3.52-3.09-.1-.14-.84-1.12-.84-2.13 0-1.01.52-1.51.71-1.72.19-.2.41-.25.55-.25l.39.01c.13 0 .3-.05.47.36.18.43.6 1.49.65 1.59.05.11.08.23.02.36-.07.14-.1.22-.2.35l-.3.35c-.1.1-.2.22-.09.42.11.2.5.82 1.07 1.33.72.65 1.34.85 1.54.96.2.1.32.08.44-.05.12-.14.5-.59.64-.79.14-.2.27-.17.45-.1.19.07 1.18.56 1.38.66.2.1.34.15.39.23.05.08.05.49-.14 1z" fill="#fff"/></svg>'
  };

  /* ------------------------------------------------------------ Logo -----
     Si existe el archivo de imagen se usa ese; si falla la carga, se
     reemplaza solo por el nombre en texto. Así nunca queda un hueco.      */
  function logoHTML(contexto) {
    const m = CFG.marca;
    const esFooter = contexto === "footer";
    const textoFallback = `<span class="logo__texto">${esc(m.nombre)} <span>${esc(m.nombreAcento)}</span></span>`;
    const alt = `${esc(m.nombre)} ${esc(m.nombreAcento)}`;
    const respaldo = `onerror="var c=this.closest('.logo'); this.remove(); if(!c.querySelector('.logo__texto')) c.insertAdjacentHTML('beforeend', ${JSON.stringify(textoFallback).replace(/"/g, "&quot;")});"`;

    /* Pie de página: el emblema completo */
    if (esFooter) {
      if (!m.logo) return `<a class="logo" href="index.html">${textoFallback}</a>`;
      return `<a class="logo" href="index.html" aria-label="${alt} — Inicio">
        <img class="logo__img" src="${esc(m.logo)}" alt="${alt}"
             style="height:${m.logoAltoFooter || 110}px" ${respaldo}>
      </a>`;
    }

    /* Header sin logo centrado: comportamiento simple, versión horizontal */
    if (!m.logoCentrado) {
      const archivo = m.logoHeader || m.logo;
      if (!archivo) return `<a class="logo" href="index.html">${textoFallback}</a>`;
      return `<a class="logo" href="index.html" aria-label="${alt} — Inicio">
        <img class="logo__img" src="${esc(archivo)}" alt="${alt}"
             style="height:${m.logoAltoCompacto || 54}px" ${respaldo}>
      </a>`;
    }

    /* Header con logo centrado:
       el emblema grande arriba y, al bajar la página, se encoge a la
       versión horizontal para no comerse la pantalla. */
    if (!m.logo) return `<a class="logo logo--centrado" href="index.html">${textoFallback}</a>`;

    return `<a class="logo logo--centrado" href="index.html" aria-label="${alt} — Inicio">
      <img class="logo__img logo__img--emblema" src="${esc(m.logo)}" alt="${alt}"
           style="height:${m.logoAltoHeader || 132}px" ${respaldo}>
      ${m.logoHeader ? `<img class="logo__img logo__img--compacto" src="${esc(m.logoHeader)}" alt=""
           style="height:${m.logoAltoCompacto || 46}px" aria-hidden="true">` : ""}
    </a>`;
  }

  /* =========================================================================
     LOGOS DE MEDIOS DE PAGO
     Marcas dibujadas en SVG, sin archivos de imagen. Si querés usar los
     logos oficiales, bajalos de la marca y reemplazá el SVG por un <img>.
     ========================================================================= */
  const MARCAS_PAGO = {
    visa: `<svg viewBox="0 0 60 38" role="img" aria-label="Visa">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <text x="30" y="25" text-anchor="middle" font-family="Georgia,serif" font-style="italic"
            font-size="16" font-weight="700" fill="#1A1F71" letter-spacing="1">VISA</text>
    </svg>`,

    mastercard: `<svg viewBox="0 0 60 38" role="img" aria-label="Mastercard">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <circle cx="25" cy="19" r="10" fill="#EB001B"/>
      <circle cx="35" cy="19" r="10" fill="#F79E1B" opacity=".85"/>
    </svg>`,

    amex: `<svg viewBox="0 0 60 38" role="img" aria-label="American Express">
      <rect width="60" height="38" rx="5" fill="#2E77BC"/>
      <text x="30" y="24" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
            font-size="11" font-weight="700" fill="#fff" letter-spacing=".5">AMEX</text>
    </svg>`,

    cabal: `<svg viewBox="0 0 60 38" role="img" aria-label="Cabal">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <text x="30" y="24" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
            font-size="12" font-weight="700" fill="#0C4DA2" letter-spacing=".5">CABAL</text>
    </svg>`,

    naranja: `<svg viewBox="0 0 60 38" role="img" aria-label="Naranja">
      <rect width="60" height="38" rx="5" fill="#FF5A00"/>
      <text x="30" y="25" text-anchor="middle" font-family="Helvetica,Arial,sans-serif"
            font-size="15" font-weight="700" fill="#fff">X</text>
    </svg>`,

    mercadopago: `<svg viewBox="0 0 60 38" role="img" aria-label="Mercado Pago">
      <rect width="60" height="38" rx="5" fill="#00B1EA"/>
      <ellipse cx="30" cy="19" rx="16" ry="10" fill="#FFE600"/>
      <path d="M23 20c2.4 2.6 5 3.8 7 3.8s4.6-1.2 7-3.8" fill="none" stroke="#00B1EA" stroke-width="2.2" stroke-linecap="round"/>
      <circle cx="25" cy="16" r="1.6" fill="#00B1EA"/>
      <circle cx="35" cy="16" r="1.6" fill="#00B1EA"/>
    </svg>`,

    transferencia: `<svg viewBox="0 0 60 38" role="img" aria-label="Transferencia bancaria">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <path d="M30 9l12 6H18z" fill="#8A6A14"/>
      <rect x="20" y="16" width="3.5" height="10" fill="#8A6A14"/>
      <rect x="28.2" y="16" width="3.5" height="10" fill="#8A6A14"/>
      <rect x="36.5" y="16" width="3.5" height="10" fill="#8A6A14"/>
      <rect x="17" y="27" width="26" height="3" rx="1.2" fill="#8A6A14"/>
    </svg>`,

    efectivo: `<svg viewBox="0 0 60 38" role="img" aria-label="Efectivo">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <rect x="14" y="12" width="32" height="15" rx="2.5" fill="none" stroke="#2F6B3D" stroke-width="2"/>
      <circle cx="30" cy="19.5" r="4" fill="none" stroke="#2F6B3D" stroke-width="2"/>
    </svg>`,

    credito: `<svg viewBox="0 0 60 38" role="img" aria-label="Tarjeta de crédito">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <rect x="13" y="11" width="34" height="17" rx="3" fill="none" stroke="#8A6A14" stroke-width="2"/>
      <rect x="13" y="15.5" width="34" height="3.5" fill="#8A6A14"/>
      <rect x="17" y="23" width="9" height="2" rx="1" fill="#8A6A14"/>
    </svg>`,

    debito: `<svg viewBox="0 0 60 38" role="img" aria-label="Tarjeta de débito">
      <rect width="60" height="38" rx="5" fill="#fff" stroke="#E3E3E3"/>
      <rect x="13" y="11" width="34" height="17" rx="3" fill="none" stroke="#2F6B3D" stroke-width="2"/>
      <rect x="16" y="14.5" width="7" height="5.5" rx="1" fill="#2F6B3D"/>
      <rect x="27" y="23" width="16" height="2" rx="1" fill="#2F6B3D"/>
    </svg>`
  };

  const PAGO = CFG.pago || { cuentas: [] };

  /* Bloque "Calculá tu envío" — link a la tarifa oficial del correo */
  function bloqueCalculadora(compacto) {
    const c = (CFG.envio || {}).calculadora;
    if (!c || !c.link) return "";

    if (compacto) {
      return `<a class="calc-envio calc-envio--mini" href="${esc(c.link)}" target="_blank" rel="noopener">
                ${ICO.camion}<span>${esc(c.texto)}</span><strong>→</strong>
              </a>`;
    }

    return `
      <a class="calc-envio" href="${esc(c.link)}" target="_blank" rel="noopener">
        ${ICO.camion}
        <span class="calc-envio__texto">
          <strong>${esc(c.texto)}</strong>
          <span>${esc(c.detalle || "")}</span>
        </span>
        <span class="calc-envio__flecha">→</span>
      </a>`;
  }

  /* Grilla de logos con nombre debajo */
  function bloqueMediosPago(soloTarjetas) {
    const lista = (CFG.mediosPago || []).filter((m) =>
      soloTarjetas ? m.grupo === "tarjetas" : true);
    return `
      <div class="pagos-grilla">
        ${lista.map((m) => `
          <div class="pago-item">
            <span class="pago-item__logo">${MARCAS_PAGO[m.marca] || MARCAS_PAGO.credito}</span>
            <span class="pago-item__nombre">${esc(m.nombre)}</span>
            ${m.detalle ? `<span class="pago-item__detalle">${esc(m.detalle)}</span>` : ""}
          </div>`).join("")}
      </div>`;
  }

  /* Tarjetas con CVU / CBU y botón de copiar */
  function bloqueCuentas() {
    if (!PAGO.cuentas || !PAGO.cuentas.length) return "";
    return `
      <div class="cuentas">
        ${PAGO.cuentas.map((c, i) => `
          <div class="cuenta">
            <div class="cuenta__cabecera">
              <span class="cuenta__logo">${MARCAS_PAGO[c.marca] || MARCAS_PAGO.transferencia}</span>
              <div>
                <strong>${esc(c.entidad)}</strong>
                <span>Titular: ${esc(PAGO.titular || "")}</span>
              </div>
            </div>
            <div class="cuenta__dato">
              <span class="cuenta__etiqueta">${esc(c.tipo)}</span>
              <code class="cuenta__valor" id="cuenta-${i}-num">${esc(c.numero)}</code>
              <button class="btn-copiar" data-copiar="${esc(c.numero)}" type="button">Copiar</button>
            </div>
            ${c.alias ? `
              <div class="cuenta__dato">
                <span class="cuenta__etiqueta">Alias</span>
                <code class="cuenta__valor">${esc(c.alias)}</code>
                <button class="btn-copiar" data-copiar="${esc(c.alias)}" type="button">Copiar</button>
              </div>` : ""}
          </div>`).join("")}
      </div>
      ${PAGO.aclaracion ? `<p class="cuentas__nota">${esc(PAGO.aclaracion)}</p>` : ""}`;
  }

  /* Activa los botones "Copiar" (con respaldo para navegadores viejos) */
  function activarCopiar(ctx = document) {
    $$("[data-copiar]", ctx).forEach((b) => {
      b.addEventListener("click", async () => {
        const texto = b.dataset.copiar;
        let ok = false;
        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(texto);
            ok = true;
          }
        } catch (e) { ok = false; }

        if (!ok) {
          // Respaldo: campo temporal + execCommand
          const t = document.createElement("textarea");
          t.value = texto;
          t.style.cssText = "position:fixed;top:-1000px;opacity:0";
          document.body.appendChild(t);
          t.select();
          try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
          document.body.removeChild(t);
        }

        if (ok) {
          const antes = b.textContent;
          b.textContent = "¡Copiado!";
          b.classList.add("btn-copiar--ok");
          setTimeout(() => { b.textContent = antes; b.classList.remove("btn-copiar--ok"); }, 1800);
          aviso("Copiado al portapapeles");
        } else {
          aviso("No se pudo copiar. Seleccionalo y copialo a mano.");
        }
      });
    });
  }

  /* =========================================================================
     SECCIÓN "CÓMO FUNCIONAN LOS ENVÍOS"
     Se usa igual en el inicio y en la página de envíos, así el texto vive
     en un solo lugar y no se desincroniza.
     ========================================================================= */
  function bloqueComoEnviamos() {
    const E = CFG.envio || {};
    const L = CFG.local || {};
    const calc = E.calculadora || {};

    return `
      <p class="envios-intro">
        En <strong>${esc(CFG.marca.nombre)} ${esc(CFG.marca.nombreAcento)}</strong> sabemos que
        cuando comprás mercadería para tu negocio querés que te llegue rápido, segura y al mejor
        costo posible. Por eso hacemos envíos a todo el país con las empresas más confiables
        del mercado. Manejamos <strong>dos modalidades</strong>: elegí la que mejor te venga
        según tu zona.
      </p>

      <div class="envios-opciones">
        <article class="envio-op">
          <span class="envio-op__icono">${ICO.camion}</span>
          <h3>Opción 1 · Correo Argentino</h3>
          <p class="envio-op__bajada">A domicilio o a sucursal</p>
          <dl>
            <dt>¿Cómo se calcula el costo?</dt>
            <dd>Según el <strong>peso del paquete y tu código postal</strong>.
                Podés consultar la tarifa oficial antes de comprar.</dd>
            <dt>¿Cómo se paga?</dt>
            <dd>Cuando confirmamos tu pedido por WhatsApp te pasamos el
                <strong>costo exacto</strong> y lo abonás junto con la mercadería.
                Después no pagás nada más al recibir.</dd>
            <dt>Seguimiento</dt>
            <dd>Apenas despachamos te mandamos el <strong>código de seguimiento</strong>
                para que veas en tiempo real por dónde va tu paquete.</dd>
          </dl>
          ${calc.link ? `<a class="btn btn--linea btn--chico" href="${esc(calc.link)}"
             target="_blank" rel="noopener">Ver tarifas de Correo Argentino</a>` : ""}
        </article>

        <article class="envio-op">
          <span class="envio-op__icono">${ICO.local}</span>
          <h3>Opción 2 · Vía Cargo</h3>
          <p class="envio-op__bajada">A terminal de micros o agencia</p>
          <dl>
            <dt>¿Cómo se calcula el costo?</dt>
            <dd>Lo cotiza <strong>directamente Vía Cargo</strong> al momento de despachar,
                según el peso y el tamaño de la caja.</dd>
            <dt>¿Cómo se paga?</dt>
            <dd>El transporte lo abonás <strong>en destino</strong>, cuando retirás el paquete
                de la terminal o agencia de tu localidad.
                <em>A nosotros solo nos pagás el valor de la ropa.</em></dd>
            <dt>Ideal si…</dt>
            <dd>Ya trabajás con transportes o preferís abonar el envío más adelante.</dd>
          </dl>
        </article>
      </div>

      <div class="envios-extra">
        <div class="envio-nota">
          <span class="envio-nota__icono">${ICO.reloj}</span>
          <div>
            <h3>¿Cuánto tardamos en despachar?</h3>
            <p>Una vez confirmado tu pago, armamos y embalamos tu pedido con el máximo cuidado
               para que todo viaje protegido. <strong>Despachamos en un plazo de hasta 48 horas
               hábiles</strong> y salimos todos los días por Correo Argentino. Hacemos todo lo
               posible para que la mercadería esté en tu perchero lo antes posible.</p>
          </div>
        </div>

        <div class="envio-nota">
          <span class="envio-nota__icono">${ICO.pin}</span>
          <div>
            <h3>¿Sos de la zona? Comprá directo en el local</h3>
            <p>Si estás cerca de <strong>${esc(L.localidad || "nuestro local")}</strong>,
               elegí la opción <strong>“Retiro en el local”</strong> al hacer el pedido.
               Comprás online y, en cuanto te avisamos por WhatsApp que está listo y empaquetado,
               pasás a buscarlo por ${esc(L.calle || "")} <strong>sin pagar ningún costo de envío</strong>.</p>
          </div>
        </div>
      </div>

      <div class="envios-cierre">
        <p>¿Listo para recibir tus prendas ${esc(CFG.marca.nombre)}?</p>
        <p class="envios-cierre__sub">Armá tu pedido y consultá la tarifa de Correo Argentino,
           o elegí Vía Cargo para pagar el envío al recibir.
           Hacer crecer tu negocio nunca fue tan fácil.</p>
        <a class="btn btn--acento" href="catalogo.html">👉 Armar mi pedido</a>
      </div>`;
  }

  /* -------------------------------------------------------------------------
     Cartel para las secciones que todavía no tienen productos cargados.
     Evita que quede un hueco en blanco que parezca un error.
     ------------------------------------------------------------------------- */
  const hayCatalogo = () => PRODS.length > 0;
  const hayCategorias = () => (CFG.categorias || []).length > 0;

  function bloqueProximamente(texto) {
    const r = CFG.redes || {};
    return `
      <div class="proximamente">
        <span class="proximamente__icono">${ICO.bolsa}</span>
        <p class="proximamente__titulo">Muy pronto</p>
        <p class="proximamente__texto">${esc(texto)}</p>
        <div class="proximamente__botones">
          ${r.instagram ? `<a class="btn btn--linea btn--chico" href="${esc(r.instagram)}"
             target="_blank" rel="noopener">Ver novedades en Instagram</a>` : ""}
          <a class="btn btn--wsp btn--chico" href="${linkWsp(CFG.contacto.mensajeInicial)}"
             target="_blank" rel="noopener">Consultar por WhatsApp</a>
        </div>
      </div>`;
  }

  /* =========================================================================
     SECCIÓN "SEGUINOS EN REDES"
     Tarjetas grandes con el @usuario a la vista. Para una marca de ropa
     Instagram suele ser el catálogo vivo, así que no puede quedar
     escondido en un ícono de 18 px en el pie.
     ========================================================================= */
  function bloqueRedes() {
    const r = CFG.redes || {};
    const items = [];

    if (r.instagram) items.push({
      clase: "red-card--ig", icono: ICO.ig, nombre: "Instagram",
      usuario: r.instagramUsuario || "", link: r.instagram,
      texto: "Mirá los ingresos nuevos, combinaciones y lo que se viene"
    });
    if (r.tiktok) items.push({
      clase: "red-card--tt", icono: ICO.tt, nombre: "TikTok",
      usuario: r.tiktokUsuario || "", link: r.tiktok,
      texto: "Videos de las prendas puestas, para ver cómo caen de verdad"
    });
    if (r.facebook) items.push({
      clase: "red-card--fb", icono: ICO.fb, nombre: "Facebook",
      usuario: r.facebookUsuario || "", link: r.facebook,
      texto: "Novedades y comunidad"
    });

    items.push({
      clase: "red-card--wsp", icono: ICO.wsp, nombre: "WhatsApp",
      usuario: CFG.contacto.telefonoVisible, link: linkWsp(CFG.contacto.mensajeInicial),
      texto: "Consultas, asesoramiento y pedidos. Te responde una persona"
    });

    if (!items.length) return "";

    return `
      <div class="redes-grilla">
        ${items.map((i) => `
          <a class="red-card ${i.clase}" href="${esc(i.link)}" target="_blank" rel="noopener">
            <span class="red-card__icono">${i.icono}</span>
            <span class="red-card__nombre">${esc(i.nombre)}</span>
            ${i.usuario ? `<span class="red-card__usuario">${esc(i.usuario)}</span>` : ""}
            <span class="red-card__texto">${esc(i.texto)}</span>
            <span class="red-card__cta">Seguir →</span>
          </a>`).join("")}
      </div>`;
  }

  /* =========================================================================
     SECCIÓN "CÓMO COMPRAR"
     Igual que la de envíos: vive en un solo lugar y se usa en el inicio
     y en la página "Cómo comprar".
     ========================================================================= */
  function bloqueComoComprar() {
    const L = CFG.local || {};
    const marca = `${CFG.marca.nombre} ${CFG.marca.nombreAcento}`;

    const pasos = [
      {
        icono: "🛒",
        titulo: "Armá tu carrito a tu medida",
        cuerpo: `Navegá la web y elegí las prendas que más te gusten. Lo mejor de
          ${esc(marca)} es la flexibilidad: elegís <strong>color, talle y cantidad exacta</strong>
          de cada artículo, según lo que de verdad te piden tus clientes.
          <strong>Sin obligación de llevar curvas cerradas</strong>: dentro de un mismo
          artículo combinás los talles y colores que quieras.`,
        nota: `Compra mínima: <strong>${precio(MIN.compraMinima)} por menor</strong> y
               <strong>${precio(MAY.compraMinima)} por mayor</strong>, en productos iguales o surtidos.`
      },
      {
        icono: "🔎",
        titulo: "Revisá tu pedido",
        cuerpo: `Cuando termines, tocá el ícono del <strong>carrito (arriba a la derecha)</strong>
          para revisar que esté todo perfecto. Vas a ver el detalle de tus prendas, el
          <strong>stock actualizado</strong> y el total. Si está todo listo, tocá
          <strong>“Finalizar pedido”</strong>.`
      },
      {
        icono: "📦",
        titulo: "Completá tus datos y el envío",
        cuerpo: `Dejanos tus datos de contacto y elegí cómo querés recibirlo.
          <strong>Llegamos a todo el país.</strong> También podés elegir
          <strong>retirar gratis por nuestro local</strong> en
          ${esc(L.localidad || "nuestra zona")}.`
      },
      {
        icono: "💳",
        titulo: "Elegí tu forma de pago",
        cuerpo: `Podés pagar por <strong>transferencia</strong> al CVU de Mercado Pago o al
          CBU de Banco Nación, o con <strong>tarjeta y efectivo en el local</strong>.
          Los datos para transferir te aparecen apenas enviás el pedido, con botón para copiarlos.`,
        alerta: `Importante: las transferencias se abonan por el <strong>monto EXACTO</strong>.
                 Si no coincide, el pedido puede demorar más en procesarse.`
      },
      {
        icono: "🎉",
        titulo: "Listo, nosotros nos encargamos del resto",
        cuerpo: `Una vez confirmado el pago, nuestro equipo se pone manos a la obra:
          armamos tu pedido de forma minuciosa, lo empaquetamos con todo el amor y
          te avisamos apenas esté en camino o listo para retirar.`
      },
      {
        icono: "🚚",
        titulo: "Una vez despachado",
        cuerpo: `Te mandamos el <strong>código de seguimiento por WhatsApp</strong> para que
          sigas tu paquete en tiempo real. Y ante cualquier duda,
          <strong>pedinos asesoramiento por WhatsApp</strong>: te respondemos una persona
          de verdad, ${esc((CFG.contacto.horarios || "").toLowerCase())}.`
      }
    ];

    return `
      <p class="envios-intro">
        ¡Hola! Queremos que abastecer tu negocio sea la parte más fácil y rápida de tu día.
        Por eso armamos una tienda online simple, para que hagas tu pedido en minutos,
        sin vueltas y desde la comodidad de tu casa.
      </p>

      <p class="comprar-video">
        🎬 Próximamente vas a encontrar acá un video tutorial paso a paso.
        Mientras tanto, mirá qué simple es:
      </p>

      <ol class="pasos">
        ${pasos.map((p, i) => `
          <li class="paso">
            <span class="paso__num">${i + 1}</span>
            <div class="paso__cuerpo">
              <h3>${p.icono} ${esc(p.titulo)}</h3>
              <p>${p.cuerpo}</p>
              ${p.nota ? `<p class="paso__nota">${p.nota}</p>` : ""}
              ${p.alerta ? `<p class="paso__alerta">⚠️ ${p.alerta}</p>` : ""}
            </div>
          </li>`).join("")}
      </ol>

      <div class="envios-cierre">
        <p>¿Empezamos?</p>
        <p class="envios-cierre__sub">Armá tu pedido en minutos. Si te trabás en algún paso,
           escribinos por WhatsApp y te acompañamos.</p>
        <div style="display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap">
          <a class="btn btn--acento" href="catalogo.html">👉 Ver el catálogo</a>
          <a class="btn btn--wsp" href="${linkWsp(CFG.contacto.mensajeInicial)}"
             target="_blank" rel="noopener">Consultar por WhatsApp</a>
        </div>
      </div>`;
  }

  /* ------------------------------- Páginas del menú "Antes de comprar" --- */
  const TEMAS_INFO = [
    { slug: "como-comprar",  titulo: "Cómo comprar" },
    { slug: "mayorista",     titulo: "Comprar por mayor" },
    { slug: "envios",        titulo: "Envíos" },
    { slug: "medios-pago",   titulo: "Medios de pago" },
    { slug: "cambios",       titulo: "Cambios y devoluciones" },
    { slug: "preguntas",     titulo: "Preguntas frecuentes" },
    { slug: "nosotros",      titulo: "El local y contacto" }
  ];

  /* ==========================================================================
     HEADER
     ========================================================================== */
  function montarHeader(paginaActual) {
    const cont = $("#header");
    if (!cont) return;
    const m = CFG.marca;

    /* Menús de Mujer y Hombre: las mismas categorías, filtradas por género */
    const menuGenero = (g) => `
      <li data-abierto="false">
        <a href="catalogo.html?genero=${g.slug}">${esc(g.nombre)} ${ICO.chevron}</a>
        <div class="submenu submenu--mega">
          ${CFG.categorias.map((c) => `
            <div class="mega-col">
              <a href="catalogo.html?genero=${g.slug}&categoria=${c.slug}">${esc(c.nombre)}</a>
              <ul>
                ${(c.subcategorias || []).map((s) =>
                  `<li><a href="catalogo.html?genero=${g.slug}&categoria=${c.slug}&sub=${s.slug}">${esc(s.nombre)}</a></li>`).join("")}
              </ul>
            </div>`).join("")}
          <div class="mega-pie">
            <a href="catalogo.html?genero=${g.slug}">Ver todo ${esc(g.nombre).toLowerCase()}</a>
            <a href="catalogo.html?genero=${g.slug}&orden=nuevos">Últimos ingresos</a>
            <a href="catalogo.html?genero=${g.slug}&oferta=1">Ofertas</a>
          </div>
        </div>
      </li>`;

    /* Sin categorías cargadas no tiene sentido mostrar estos menús */
    const menusGenero = hayCategorias()
      ? (GEN.lista || []).filter((g) => g.slug !== "unisex").map(menuGenero).join("")
      : "";

    /* Mega menú: todas las categorías en columnas, con sus subcategorías */
    const megaMenu = !hayCategorias() ? "" : `
      <li data-abierto="false">
        <a href="catalogo.html">Categorías ${ICO.chevron}</a>
        <div class="submenu submenu--mega">
          ${CFG.categorias.map((c) => `
            <div class="mega-col">
              <a href="catalogo.html?categoria=${c.slug}">${esc(c.nombre)}</a>
              <ul>
                ${(c.subcategorias || []).map((s) =>
                  `<li><a href="catalogo.html?categoria=${c.slug}&sub=${s.slug}">${esc(s.nombre)}</a></li>`).join("")}
              </ul>
            </div>`).join("")}
          <div class="mega-pie">
            <a href="catalogo.html">Ver todo el catálogo</a>
            <a href="catalogo.html?orden=nuevos">Últimos ingresos</a>
            <a href="catalogo.html?oferta=1">Ofertas</a>
            <a href="catalogo.html?modo=mayorista">Precios por mayor</a>
          </div>
        </div>
      </li>`;

    cont.innerHTML = `
      <div class="anuncio" id="anuncio" aria-live="polite">
        ${CFG.anuncios.map((a, i) =>
          `<span class="anuncio__msj" data-activo="${i === 0}">${esc(a)}</span>`).join("")}
      </div>

      <header class="header ${CFG.marca.logoCentrado ? "header--logo-centrado" : ""}" id="cabecera">
        <div class="contenedor header__superior">
          <!-- Izquierda: menú y selector de precio -->
          <div class="header__lado header__lado--izq">
            <button class="icono-btn btn-menu" id="abrirMenu" aria-label="Abrir menú">${ICO.menu}</button>
            ${MAY.activo ? `
              <div class="modo-precio" role="group" aria-label="Tipo de precio">
                <button data-modo="minorista" aria-pressed="${!Modo.esMayorista()}">Por menor</button>
                <button data-modo="mayorista" aria-pressed="${Modo.esMayorista()}">Por mayor</button>
              </div>` : ""}
          </div>

          <!-- Centro: el logo -->
          ${logoHTML("header")}

          <!-- Derecha: redes, favoritos y carrito -->
          <div class="header__acciones">
            <!-- Redes siempre visibles arriba (se ocultan en pantallas chicas) -->
            ${CFG.redes.instagram ? `
              <a class="icono-btn icono-btn--red" href="${esc(CFG.redes.instagram)}"
                 target="_blank" rel="noopener" aria-label="Instagram"
                 title="Seguinos en Instagram ${esc(CFG.redes.instagramUsuario || "")}">${ICO.ig}</a>` : ""}
            ${CFG.redes.tiktok ? `
              <a class="icono-btn icono-btn--red" href="${esc(CFG.redes.tiktok)}"
                 target="_blank" rel="noopener" aria-label="TikTok"
                 title="Seguinos en TikTok ${esc(CFG.redes.tiktokUsuario || "")}">${ICO.tt}</a>` : ""}

            <a class="icono-btn" href="catalogo.html?favoritos=1" aria-label="Favoritos" title="Favoritos">
              ${ICO.corazon}<span class="burbuja" id="burbujaFav" data-vacio="true">0</span>
            </a>

            <!-- Carrito: arriba a la derecha, con cantidad y total a la vista -->
            <button class="carrito-btn" id="abrirCarrito" aria-label="Abrir carrito de compras">
              <span class="carrito-btn__icono">
                ${ICO.bolsa}
                <span class="burbuja" id="burbujaCarrito" data-vacio="true">0</span>
              </span>
              <span class="carrito-btn__texto">
                <span>Mi carrito</span>
                <strong id="carritoTotalHeader">$0</strong>
              </span>
            </button>
          </div>
        </div>

        <div class="header__nav">
          <div class="contenedor">
            <ul class="nav">
              <li><a href="index.html" ${paginaActual === "home" ? 'aria-current="page"' : ""}>Inicio</a></li>
              <li data-abierto="false">
                <a href="info.html?tema=como-comprar">Antes de comprar ${ICO.chevron}</a>
                <div class="submenu">
                  <p class="submenu__titulo">Información</p>
                  ${TEMAS_INFO.map((t) => `<a href="info.html?tema=${t.slug}">${esc(t.titulo)}</a>`).join("")}
                </div>
              </li>
              ${menusGenero}
              ${megaMenu}
              <li><a href="catalogo.html" ${paginaActual === "catalogo" ? 'aria-current="page"' : ""}>Ver todo</a></li>
              <li><a href="catalogo.html?oferta=1">Ofertas</a></li>
              <li><a href="catalogo.html?modo=mayorista">Por mayor</a></li>
              <li><a href="info.html?tema=nosotros">Local</a></li>
              <li><a href="${linkWsp(CFG.contacto.mensajeInicial)}" target="_blank" rel="noopener">Contacto</a></li>
            </ul>
          </div>
        </div>
      </header>

      <div class="velo" id="veloMenu" data-abierto="false"></div>
      <aside class="panel" id="panelMenu" data-abierto="false"
             style="left:0;right:auto;transform:translateX(-100%)" aria-label="Menú">
        <div class="panel__cabecera">
          <span class="panel__titulo">Menú</span>
          <button class="icono-btn" id="cerrarMenu" aria-label="Cerrar">${ICO.cerrar}</button>
        </div>
        <div class="panel__cuerpo">
          <ul class="arbol-cat">
            <li><a href="index.html">Inicio</a></li>
            <li><a href="catalogo.html">Ver todo el catálogo</a></li>
            ${!hayCategorias() ? "" : (GEN.lista || []).filter((g) => g.slug !== "unisex").map((g) => `
              <li><a href="catalogo.html?genero=${g.slug}"><strong>Ropa de ${esc(g.nombre).toLowerCase()}</strong></a></li>`).join("")}
            ${(CFG.categorias || []).map((c) => `
              <li>
                <a href="catalogo.html?categoria=${c.slug}">${esc(c.nombre)}</a>
                ${(c.subcategorias || []).length ? `<ul>${c.subcategorias.map((s) =>
                  `<li><a href="catalogo.html?categoria=${c.slug}&sub=${s.slug}">${esc(s.nombre)}</a></li>`).join("")}</ul>` : ""}
              </li>`).join("")}
            <li><a href="catalogo.html?oferta=1">Ofertas</a></li>
            <li><a href="catalogo.html?favoritos=1">Mis favoritos</a></li>
          </ul>
          <p class="submenu__titulo" style="margin-top:1.5rem;padding-left:0">Antes de comprar</p>
          <ul class="arbol-cat">
            ${TEMAS_INFO.map((t) => `<li><a href="info.html?tema=${t.slug}">${esc(t.titulo)}</a></li>`).join("")}
          </ul>

          <p class="submenu__titulo" style="margin-top:1.5rem;padding-left:0">Seguinos</p>
          <div class="redes">
            ${CFG.redes.instagram ? `<a href="${esc(CFG.redes.instagram)}" target="_blank" rel="noopener">
              ${ICO.ig}<span>${esc(CFG.redes.instagramUsuario || "Instagram")}</span></a>` : ""}
            ${CFG.redes.tiktok ? `<a href="${esc(CFG.redes.tiktok)}" target="_blank" rel="noopener">
              ${ICO.tt}<span>${esc(CFG.redes.tiktokUsuario || "TikTok")}</span></a>` : ""}
            <a href="${linkWsp(CFG.contacto.mensajeInicial)}" target="_blank" rel="noopener">
              ${ICO.wsp}<span>${esc(CFG.contacto.telefonoVisible)}</span></a>
          </div>
        </div>
      </aside>`;

    const cab = $("#cabecera");

    /* Publicamos el alto real del header en --alto-header.
       Así los elementos que quedan fijos (filtros del catálogo, ficha de
       producto, resumen del pedido) se ubican siempre justo debajo,
       sin importar el tamaño del logo ni la pantalla. */
    function medirHeader() {
      const alto = Math.round(cab.getBoundingClientRect().height);
      if (alto > 0) document.documentElement.style.setProperty("--alto-header", alto + "px");
    }

    /* Al bajar la página, el header se encoge para no tapar el contenido */
    if (CFG.marca.logoCentrado) {
      const umbral = 90;
      let ultimo = null;
      const revisar = () => {
        const compacto = window.scrollY > umbral;
        if (compacto !== ultimo) {
          cab.classList.toggle("header--compacto", compacto);
          ultimo = compacto;
          setTimeout(medirHeader, 260);   // después de la animación
        }
      };
      window.addEventListener("scroll", revisar, { passive: true });
      revisar();
    }

    medirHeader();
    window.addEventListener("resize", medirHeader);
    window.addEventListener("load", medirHeader);

    /* Rotación de la barra de anuncios */
    const msjs = $$("#anuncio .anuncio__msj");
    if (msjs.length > 1) {
      let idx = 0;
      setInterval(() => {
        msjs[idx].dataset.activo = "false";
        idx = (idx + 1) % msjs.length;
        msjs[idx].dataset.activo = "true";
      }, 4000);
    }

    /* Selector minorista / mayorista */
    $$("[data-modo]").forEach((b) => b.addEventListener("click", () => {
      Modo.cambiar(b.dataset.modo);
      $$("[data-modo]").forEach((x) => x.setAttribute("aria-pressed", x.dataset.modo === Modo.valor));
      aviso(Modo.esMayorista()
        ? `Precios por mayor · mínimo ${MAY.unidadesMinimas} unidades por artículo`
        : "Precios por menor");
    }));

    /* Submenús con teclado / touch */
    $$(".nav > li[data-abierto]").forEach((li) => {
      const enlace = li.querySelector(":scope > a");
      enlace.addEventListener("click", (e) => {
        if (window.matchMedia("(hover: none)").matches && li.dataset.abierto === "false") {
          e.preventDefault();
          $$(".nav > li[data-abierto]").forEach((o) => { o.dataset.abierto = "false"; });
          li.dataset.abierto = "true";
        }
      });
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".nav")) $$(".nav > li[data-abierto]").forEach((o) => { o.dataset.abierto = "false"; });
    });

    /* Menú lateral en mobile */
    const velo = $("#veloMenu"), panel = $("#panelMenu");
    const abrir = (v) => {
      panel.dataset.abierto = v;
      velo.dataset.abierto = v;
      panel.style.transform = v === "true" ? "translateX(0)" : "translateX(-100%)";
      document.body.style.overflow = v === "true" ? "hidden" : "";
    };
    $("#abrirMenu").addEventListener("click", () => abrir("true"));
    $("#cerrarMenu").addEventListener("click", () => abrir("false"));
    velo.addEventListener("click", () => abrir("false"));
  }

  /* ==========================================================================
     FOOTER
     ========================================================================== */
  function montarFooter() {
    const cont = $("#footer");
    if (!cont) return;
    const c = CFG.contacto, r = CFG.redes, m = CFG.marca;
    const red = (url, ico, nombre) =>
      url ? `<a href="${esc(url)}" target="_blank" rel="noopener" aria-label="${nombre}">${ico}</a>` : "";

    cont.innerHTML = `
      <footer class="footer">
        <div class="contenedor">
          <div class="footer__grilla">
            <div>
              ${logoHTML("footer")}
              <p class="footer__desc">${esc(m.descripcion)}</p>
              <h4 style="margin-top:1.25rem">Seguinos</h4>
              <div class="redes">
                ${r.instagram ? `<a href="${esc(r.instagram)}" target="_blank" rel="noopener">
                  ${ICO.ig}<span>${esc(r.instagramUsuario || "Instagram")}</span></a>` : ""}
                ${r.tiktok ? `<a href="${esc(r.tiktok)}" target="_blank" rel="noopener">
                  ${ICO.tt}<span>${esc(r.tiktokUsuario || "TikTok")}</span></a>` : ""}
                ${r.facebook ? `<a href="${esc(r.facebook)}" target="_blank" rel="noopener">
                  ${ICO.fb}<span>${esc(r.facebookUsuario || "Facebook")}</span></a>` : ""}
                <a href="${linkWsp(c.mensajeInicial)}" target="_blank" rel="noopener">
                  ${ICO.wsp}<span>${esc(c.telefonoVisible)}</span></a>
              </div>
            </div>

            <div>
              <h4>${hayCategorias() ? "Categorías" : "La tienda"}</h4>
              <ul>
                ${hayCategorias()
                  ? CFG.categorias.map((x) =>
                      `<li><a href="catalogo.html?categoria=${x.slug}">${esc(x.nombre)}</a></li>`).join("")
                  : `<li><a href="catalogo.html">Ver catálogo</a></li>
                     <li><a href="info.html?tema=como-comprar">Cómo comprar</a></li>
                     <li><a href="info.html?tema=mayorista">Comprar por mayor</a></li>
                     <li><a href="info.html?tema=envios">Envíos</a></li>`}
              </ul>
            </div>

            <div>
              <h4>Antes de comprar</h4>
              <ul>
                ${TEMAS_INFO.map((t) => `<li><a href="info.html?tema=${t.slug}">${esc(t.titulo)}</a></li>`).join("")}
              </ul>
            </div>

            <div>
              <h4>Contacto</h4>
              <ul>
                <li><a href="${linkWsp(c.mensajeInicial)}" target="_blank" rel="noopener">
                  WhatsApp ${esc(c.telefonoVisible)}</a></li>
                <li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>
                <li><a href="${linkMapa()}" target="_blank" rel="noopener">
                  ${esc(direccionCompleta() || c.direccion)}</a></li>
                <li><span style="font-size:var(--t-base);color:var(--c-tinta-suave)">${esc(c.horarios)}</span></li>
              </ul>
              <h4 style="margin-top:1.5rem">Medios de pago</h4>
              <div class="pagos-mini">
                ${(CFG.mediosPago || []).map((p) =>
                  `<span class="pago-mini" title="${esc(p.nombre)}">${MARCAS_PAGO[p.marca] || ""}</span>`).join("")}
              </div>
              <p style="margin-top:.5rem">
                <a href="info.html?tema=medios-pago" style="font-size:var(--t-sm);text-decoration:underline">Ver todos los medios de pago</a>
              </p>
              <h4 style="margin-top:1.25rem">Envíos</h4>
              <div class="pagos">
                ${CFG.envio.transportes.map((t) => `<span class="pago-badge">${esc(t)}</span>`).join("")}
              </div>
            </div>
          </div>

          <div class="footer__base">
            <span>© ${new Date().getFullYear()} ${esc(m.nombre)} ${esc(m.nombreAcento)}. Todos los derechos reservados.</span>
            <span>Defensa de las y los consumidores · <a href="https://autogestion.produccion.gob.ar/consumidores" target="_blank" rel="noopener">Ver más</a></span>
          </div>
        </div>
      </footer>

      <a class="wsp-flotante" href="${linkWsp(c.mensajeInicial)}" target="_blank" rel="noopener"
         aria-label="Escribinos por WhatsApp">${ICO.wsp}</a>`;
  }

  /* ==========================================================================
     PANEL DEL CARRITO
     ========================================================================== */
  function montarCarrito() {
    const cont = $("#carrito");
    if (!cont) return;
    cont.innerHTML = `
      <div class="velo" id="veloCarrito" data-abierto="false"></div>
      <aside class="panel" id="panelCarrito" data-abierto="false" aria-label="Carrito de compras">
        <div class="panel__cabecera">
          <span class="panel__titulo">Tu pedido (<span id="carritoUnidades">0</span>)</span>
          <button class="icono-btn" id="cerrarCarrito" aria-label="Cerrar carrito">${ICO.cerrar}</button>
        </div>
        <div class="panel__cuerpo" id="carritoCuerpo"></div>
        <div class="panel__pie" id="carritoPie"></div>
      </aside>`;

    const velo = $("#veloCarrito"), panel = $("#panelCarrito");
    const abrir = (v) => {
      panel.dataset.abierto = v; velo.dataset.abierto = v;
      document.body.style.overflow = v === "true" ? "hidden" : "";
    };
    window.abrirCarrito = () => abrir("true");
    $("#cerrarCarrito").addEventListener("click", () => abrir("false"));
    velo.addEventListener("click", () => abrir("false"));
    const btn = $("#abrirCarrito");
    if (btn) btn.addEventListener("click", () => abrir("true"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") abrir("false"); });

    pintarCarrito();
    document.addEventListener("carrito:cambio", pintarCarrito);
    document.addEventListener("modo:cambio", pintarCarrito);
  }

  function pintarCarrito() {
    const cuerpo = $("#carritoCuerpo"), pie = $("#carritoPie"), uni = $("#carritoUnidades");
    actualizarBurbujas();
    if (!cuerpo) return;
    uni.textContent = Carrito.unidades();

    if (!Carrito.items.length) {
      cuerpo.innerHTML = `
        <div class="vacio">
          ${ICO.bolsa}
          <p>Todavía no agregaste nada.</p>
          <p style="margin-top:1rem"><a class="btn btn--principal" href="catalogo.html">Ver catálogo</a></p>
        </div>`;
      pie.innerHTML = "";
      return;
    }

    cuerpo.innerHTML = Carrito.items.map((i) => {
      const falta = Modo.esMayorista() && i.cantidad < MAY.unidadesMinimas;
      return `
      <div class="item-carrito">
        <div class="item-carrito__foto">${i.imagen ? `<img src="${esc(i.imagen)}" alt="">` : ""}</div>
        <div>
          <p class="item-carrito__nombre">${esc(i.nombre)}</p>
          <p class="item-carrito__variante">(${esc(i.codigo || "")}) · Talle ${esc(i.talle)} · ${esc(colorPorSlug(i.color).nombre)}</p>
          <div class="cantidad cantidad--mini">
            <button data-menos="${esc(i.llave)}" aria-label="Quitar uno">−</button>
            <input value="${i.cantidad}" readonly aria-label="Cantidad">
            <button data-mas="${esc(i.llave)}" aria-label="Agregar uno">+</button>
          </div>
          <p class="item-carrito__precio">${precio(i.precio * i.cantidad)}</p>
          ${falta ? `<p style="font-size:var(--t-xs);color:var(--c-alerta)">
                       Mínimo ${MAY.unidadesMinimas} u. por artículo</p>` : ""}
        </div>
        <button class="item-carrito__quitar" data-quitar="${esc(i.llave)}">Quitar</button>
      </div>`;
    }).join("");

    const faltaMin = Carrito.faltaParaMinimo();
    const bajoMin = Carrito.articulosBajoMinimo().length;

    const minActual = Carrito.compraMinima();
    let avisoHTML = "";

    if (faltaMin > 0) {
      avisoHTML = `<div class="aviso-minimo">
        <strong>Compra mínima ${Modo.esMayorista() ? "por mayor" : "por menor"}: ${precio(minActual)}</strong>
        Te faltan ${precio(faltaMin)} para poder cerrar el pedido.</div>`;
    } else if (bajoMin > 0) {
      avisoHTML = `<div class="aviso-minimo">
        <strong>Revisá las cantidades</strong>
        ${bajoMin} artículo${bajoMin === 1 ? "" : "s"} no llega${bajoMin === 1 ? "" : "n"} al mínimo de ${MAY.unidadesMinimas} unidades por artículo.</div>`;
    } else if (minActual > 0) {
      avisoHTML = `<div class="aviso-minimo aviso-minimo--ok">
        <strong>Pedido habilitado ✓</strong>
        Superás la compra mínima de ${precio(minActual)}.</div>`;
    }

    pie.innerHTML = `
      ${avisoHTML}
      <div class="fila-total"><span>Subtotal (${Modo.etiqueta().toLowerCase()})</span><strong>${precio(Carrito.subtotal())}</strong></div>
      <div class="fila-total"><span>Envío</span><strong>${esc(Carrito.textoEnvio(false))}</strong></div>
      <div class="fila-total fila-total--grande">
        <span>${Carrito.envioACargoDelComprador() ? "Total mercadería" : "Total"}</span>
        <span>${precio(Carrito.total())}</span>
      </div>
      <a class="btn btn--acento btn--bloque ${Carrito.puedeCerrar() ? "" : "btn--bloqueado"}"
         href="pedido.html" ${Carrito.puedeCerrar() ? "" : 'aria-disabled="true"'}>Finalizar pedido</a>
      <button class="btn btn--linea btn--bloque" id="btnSeguirComprando" style="margin-top:.5rem">Seguir comprando</button>
      <p class="nota-envio">${Carrito.envioACargoDelComprador()
        ? "El costo del envío lo abona el comprador. Lo coordinamos por WhatsApp."
        : "Envío calculado según el monto de tu compra."}</p>
      ${Carrito.envioACargoDelComprador() ? bloqueCalculadora(true) : ""}`;

    $$("[data-mas]", cuerpo).forEach((b) => b.addEventListener("click", () => Carrito.cambiarCantidad(b.dataset.mas, 1)));
    $$("[data-menos]", cuerpo).forEach((b) => b.addEventListener("click", () => Carrito.cambiarCantidad(b.dataset.menos, -1)));
    $$("[data-quitar]", cuerpo).forEach((b) => b.addEventListener("click", () => { Carrito.quitar(b.dataset.quitar); aviso("Producto eliminado"); }));
    const btnSeguir = $("#btnSeguirComprando");
    if (btnSeguir) btnSeguir.addEventListener("click", () => {
      const panel = $("#panelCarrito"), velo = $("#veloCarrito");
      if (panel) panel.dataset.abierto = "false";
      if (velo) velo.dataset.abierto = "false";
      document.body.style.overflow = "";
    });
  }

  function actualizarBurbujas() {
    const bc = $("#burbujaCarrito");
    if (bc) { const n = Carrito.unidades(); bc.textContent = n; bc.dataset.vacio = n === 0; }

    const tot = $("#carritoTotalHeader");
    if (tot) tot.textContent = precio(Carrito.subtotal());

    const btn = $("#abrirCarrito");
    if (btn) btn.dataset.lleno = Carrito.unidades() > 0;

    const bf = $("#burbujaFav");
    if (bf) { const n = Favoritos.ids.length; bf.textContent = n; bf.dataset.vacio = n === 0; }
  }

  /* ==========================================================================
     TARJETA DE PRODUCTO
     ========================================================================== */
  function bloquePrecios(p) {
    const desc = descuento(p);
    const pAct = Modo.precioDe(p);
    const cuota = Math.round(pAct / CFG.cuotas.cantidad);

    /* Si el precio por mayor es igual al de lista, no tiene sentido mostrarlo */
    let alterno = "";
    if (MAY.activo && MAY.mostrarAmbosPrecios && p.precioMayorista && p.precioMayorista !== p.precio) {
      alterno = Modo.esMayorista()
        ? `<div class="precio-alterno">Por menor: <strong>${precio(p.precio)}</strong></div>`
        : `<div class="precio-alterno">Por mayor (${MAY.unidadesMinimas}+ u.): <strong>${precio(p.precioMayorista)}</strong></div>`;
    }

    return `
      <div class="precios">
        <span class="precio">${precio(pAct)}</span>
        ${!Modo.esMayorista() && p.precioAnterior
          ? `<span class="precio--tachado">${precio(p.precioAnterior)}</span>
             <span class="precio--desc">${desc}% OFF</span>` : ""}
      </div>
      ${CFG.cuotas.cantidad > 0 ? `<p class="cuotas">${CFG.cuotas.cantidad} cuotas de ${precio(cuota)}</p>` : ""}
      ${alterno}`;
  }

  /* Si el archivo de la foto no existe (todavía no se subió, o el nombre
     no coincide), en vez de un ícono roto se muestra el recuadro gris
     con el código del artículo. */
  window.marcarSinFoto = function (img, codigo) {
    const cont = img.closest(".producto__media") || img.closest(".galeria__principal");
    /* Si la foto que falta está dentro de un carrusel, se saca el carrusel
       entero (flechas, puntitos y contador) y queda el cartel "Foto pendiente" */
    const car = img.closest(".carrusel");
    const enlace = car ? null : img.closest("a");
    if (car) car.remove(); else img.remove();
    if (!cont || cont.dataset.sinFoto) return;
    cont.dataset.sinFoto = "1";
    cont.classList.add("producto__media--vacio");
    const destino = enlace || cont;
    destino.innerHTML = `<span style="display:grid;place-items:center;width:100%;height:100%;
      color:inherit;text-align:center">Foto pendiente<br>${esc(codigo || "")}</span>`;
    if (enlace) enlace.style.cssText = "display:grid;place-items:center;width:100%;height:100%;color:inherit";
  };

  /* ---------------------------------------------- Foto(s) de la tarjeta ---
     Con 1 sola foto: imagen fija (y la 2ª, si existe, aparece al pasar el
     mouse). Con 2 o más fotos: carrusel deslizable — se arrastra con el dedo
     en el celular y tiene flechas y puntitos en la computadora.          */
  function mediaTarjeta(p) {
    const fotos = (p.imagenes || []).filter(Boolean);

    if (fotos.length < 2) {
      return `<a href="producto.html?id=${esc(p.id)}">
                <img class="es-principal" src="${esc(fotos[0])}" alt="${esc(p.nombre)}" loading="lazy" decoding="async"
                     onerror="marcarSinFoto(this, '${esc(p.codigo)}')">
              </a>`;
    }

    /* Carrusel: sin p.carrusel === false se usa igual, es el modo por defecto
       para cualquier producto con varias fotos. */
    if (p.carrusel === false) {
      return `<a href="producto.html?id=${esc(p.id)}">
                <img class="es-principal" src="${esc(fotos[0])}" alt="${esc(p.nombre)}" loading="lazy" decoding="async"
                     onerror="marcarSinFoto(this, '${esc(p.codigo)}')">
                <img class="es-hover" src="${esc(fotos[1])}" alt="" loading="lazy" decoding="async" onerror="this.remove()">
              </a>`;
    }

    const slides = fotos.map((f, i) => `
      <a class="carrusel__slide" href="producto.html?id=${esc(p.id)}" tabindex="${i ? -1 : 0}">
        <img src="${esc(f)}" alt="${esc(p.nombre)} — foto ${i + 1} de ${fotos.length}"
             loading="lazy" decoding="async" ${i === 0 ? `onerror="marcarSinFoto(this, '${esc(p.codigo)}')"` : 'onerror="this.closest(\'.carrusel__slide\').remove()"'}>
      </a>`).join("");

    const puntos = fotos.map((_, i) =>
      `<button class="carrusel__punto" data-ir="${i}" aria-label="Ver foto ${i + 1}"
               aria-current="${i === 0}"></button>`).join("");

    return `
      <div class="carrusel" data-carrusel>
        <div class="carrusel__pista">${slides}</div>
        <button class="carrusel__flecha carrusel__flecha--izq" data-mover="-1"
                aria-label="Foto anterior" hidden>${ICO.izq}</button>
        <button class="carrusel__flecha carrusel__flecha--der" data-mover="1"
                aria-label="Foto siguiente">${ICO.der}</button>
        <div class="carrusel__puntos">${puntos}</div>
        <span class="carrusel__contador"><b>1</b>/${fotos.length}</span>
      </div>`;
  }

  /* Hace funcionar las flechas, los puntitos y el contador. El deslizamiento
     con el dedo lo resuelve el navegador solo (overflow-x + scroll-snap). */
  /* Inicializa un carrusel individual: flechas, puntos, arrastre */
  function _initCarrusel(car) {
    if (car.dataset.listo) return;
    car.dataset.listo = "1";

    const pista = car.querySelector(".carrusel__pista");
    const puntos = $$(".carrusel__punto", car);
    const izq = car.querySelector(".carrusel__flecha--izq");
    const der = car.querySelector(".carrusel__flecha--der");
    const cont = car.querySelector(".carrusel__contador b");
    const total = () => pista.children.length;

    const indice = () => {
      const ancho = pista.clientWidth || 1;
      return Math.min(total() - 1, Math.max(0, Math.round(pista.scrollLeft / ancho)));
    };

    function refrescar() {
      const i = indice();
      puntos.forEach((b, n) => b.setAttribute("aria-current", n === i));
      if (cont) cont.textContent = i + 1;
      if (izq) izq.hidden = i === 0;
      if (der) der.hidden = i >= total() - 1;
      Array.from(pista.children).forEach((s, n) => {
        s.setAttribute("tabindex", n === i ? 0 : -1);
      });
    }

    function irA(i) {
      pista.scrollTo({ left: pista.clientWidth * i, behavior: "smooth" });
    }

    $$("[data-mover]", car).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        irA(indice() + Number(b.dataset.mover));
      });
    });

    puntos.forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        irA(Number(b.dataset.ir));
      });
    });

    let t = null;
    pista.addEventListener("scroll", () => {
      clearTimeout(t);
      t = setTimeout(refrescar, 90);
    }, { passive: true });

    /* Si el usuario arrastró, el click no debe abrir la ficha del producto */
    let x0 = null, arrastro = false;
    pista.addEventListener("pointerdown", (e) => { x0 = e.clientX; arrastro = false; });
    pista.addEventListener("pointermove", (e) => {
      if (x0 !== null && Math.abs(e.clientX - x0) > 8) arrastro = true;
    });
    pista.addEventListener("click", (e) => { if (arrastro) e.preventDefault(); }, true);

    refrescar();
  }

  /* Activa los carruseles de forma diferida: solo cuando entran en pantalla.
     Esto evita registrar decenas de listeners al cargar la página. */
  const _carruselObserver = ("IntersectionObserver" in window)
    ? new IntersectionObserver((entries, obs) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            _initCarrusel(e.target);
            obs.unobserve(e.target);
          }
        });
      }, { rootMargin: "200px" })
    : null;

  function activarCarruseles(ctx = document) {
    $$("[data-carrusel]", ctx).forEach((car) => {
      if (car.dataset.listo) return;
      if (_carruselObserver) _carruselObserver.observe(car);
      else _initCarrusel(car);
    });
  }

  /* Talles con stock, para mostrarlos debajo del nombre en la tarjeta.
     Si es talle único se aclara además cuántas unidades quedan.        */
  function textoTalles(p) {
    /* "detalles" es una lista de líneas que se muestran tal cual debajo del
       nombre. Ej: ["Talle: 2", "Color: negro"]. Manda sobre todo lo demás. */
    if (p.detalles && p.detalles.length) {
      return `<div class="producto__talles">
        ${p.detalles.map((d) => `<span>${esc(d)}</span>`).join("")}
      </div>`;
    }

    /* "textoTalle" es una sola línea, también literal */
    if (p.textoTalle) {
      return `<p class="producto__talles"><span>${esc(p.textoTalle)}</span></p>`;
    }

    const conStock = tallesDe(p).filter((t) => (p.stock[t] || 0) > 0);
    if (!conStock.length) return "";

    const esUnico = conStock.length === 1 && /^(único|unico)$/i.test(conStock[0]);
    if (esUnico) {
      const u = p.stock[conStock[0]];
      return `<p class="producto__talles">
        <span>Talle único</span> ${u} ${u === 1 ? "unidad" : "unidades"}
      </p>`;
    }
    return `<p class="producto__talles"><span>Talles:</span> ${esc(conStock.join(" · "))}</p>`;
  }

  function tarjetaProducto(p) {
    const sinStock = stockTotal(p) === 0;
    const desc = descuento(p);
    const img = p.imagenes && p.imagenes.length;

    const etiquetas = [];
    if (sinStock) etiquetas.push('<span class="etiqueta etiqueta--agotado">Agotado</span>');
    else {
      if (desc > 0 && !Modo.esMayorista()) etiquetas.push(`<span class="etiqueta etiqueta--oferta">${desc}% OFF</span>`);
      if (p.nuevo) etiquetas.push('<span class="etiqueta etiqueta--nuevo">Nuevo</span>');
    }

    return `
      <article class="producto" data-id="${esc(p.id)}">
        <div class="producto__media ${img ? "" : "producto__media--vacio"}">
          ${etiquetas.length ? `<div class="etiquetas">${etiquetas.join("")}</div>` : ""}
          <button class="btn-favorito" data-fav="${esc(p.id)}"
                  aria-pressed="${Favoritos.tiene(p.id)}" aria-label="Agregar a favoritos">${ICO.corazon}</button>
          ${img ? mediaTarjeta(p)
            : `<a href="producto.html?id=${esc(p.id)}" style="display:grid;place-items:center;width:100%;height:100%;color:inherit">
                 Foto pendiente<br>${esc(p.codigo)}
               </a>`}
        </div>

        <p class="producto__codigo">${esc(generoPorSlug(p.genero).nombre)} · ${esc(catPorSlug(p.categoria).nombre)} · (${esc(p.codigo)})</p>
        <h3 class="producto__nombre"><a href="producto.html?id=${esc(p.id)}">${esc(p.nombre)}</a></h3>
        ${textoTalles(p)}
        ${bloquePrecios(p)}
        <div class="swatches">
          ${p.colores.map((c) =>
            `<span class="swatch" style="background:${colorPorSlug(c).hex}" title="${esc(colorPorSlug(c).nombre)}"></span>`).join("")}
        </div>

        <div class="producto__acciones">
          <button class="btn btn--acento btn--chico" data-agregar="${esc(p.id)}" ${sinStock ? "disabled" : ""}>
            ${sinStock ? "Sin stock" : "Agregar al carrito"}
          </button>
          <button class="btn btn--comprar btn--chico" data-comprar="${esc(p.id)}" ${sinStock ? "disabled" : ""}>
            Comprar
          </button>
          <a class="btn btn--linea btn--chico" href="producto.html?id=${esc(p.id)}">Ver producto</a>
        </div>
      </article>`;
  }

  /* Agregado rápido desde la grilla: elige el primer talle con stock */
  function activarTarjetas(ctx = document) {
    activarCarruseles(ctx);

    $$("[data-fav]", ctx).forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault();
        const activo = Favoritos.alternar(b.dataset.fav);
        b.setAttribute("aria-pressed", activo);
        aviso(activo ? "Agregado a favoritos" : "Quitado de favoritos");
        actualizarBurbujas();
      });
    });

    $$("[data-comprar]", ctx).forEach((b) => {
      b.addEventListener("click", () => {
        const p = PRODS.find((x) => x.id === b.dataset.comprar);
        if (!p) return;
        mostrarModalPago(p);
      });
    });

    $$("[data-agregar]", ctx).forEach((b) => {
      b.addEventListener("click", () => {
        const p = PRODS.find((x) => x.id === b.dataset.agregar);
        if (!p) return;
        const talle = tallesDe(p).find((t) => p.stock[t] > 0);
        if (!talle) { aviso("Sin stock disponible"); return; }
        const cant = Modo.minimoPorArticulo();
        Carrito.agregar(p, talle, p.colores[0], Math.min(cant, p.stock[talle]));
        aviso(`Agregado: ${cant} u. talle ${talle}`);
        if (window.abrirCarrito) window.abrirCarrito();
      });
    });
  }

  /* Compatibilidad con el nombre anterior */
  const activarFavoritos = activarTarjetas;

  /* ----------------------------------------------------- Acordeón genérico */
  function activarAcordeones(ctx = document) {
    $$(".acordeon__btn", ctx).forEach((b) => {
      b.addEventListener("click", () => {
        const item = b.closest(".acordeon__item");
        item.dataset.abierto = item.dataset.abierto === "true" ? "false" : "true";
      });
    });
  }

  /* ------------------------------------------------- Modal de pago (Comprar) */
  function mostrarModalPago(p) {
    var existente = document.getElementById("modalPago");
    if (existente) existente.remove();

    var cuentas = CFG.pago && CFG.pago.cuentas ? CFG.pago.cuentas : [];
    var titular = CFG.pago && CFG.pago.titular ? CFG.pago.titular : "";

    var htmlCuentas = cuentas.map(function(c) {
      return `
        <div class="modal-pago__cuenta">
          <div class="modal-pago__entidad">${esc(c.entidad || c.marca)}</div>
          <div class="modal-pago__fila">
            <span class="modal-pago__etiqueta">${esc(c.tipo)}</span>
            <code class="modal-pago__valor">${esc(c.numero)}</code>
            <button class="modal-pago__copiar" data-copiar="${esc(c.numero)}" type="button">Copiar</button>
          </div>
          ${c.alias ? `
          <div class="modal-pago__fila">
            <span class="modal-pago__etiqueta">Alias</span>
            <code class="modal-pago__valor">${esc(c.alias)}</code>
            <button class="modal-pago__copiar" data-copiar="${esc(c.alias)}" type="button">Copiar</button>
          </div>` : ""}
        </div>`;
    }).join("");

    var precioMostrar = Modo.esMayorista() && p.precioMayorista ? p.precioMayorista : p.precio;

    var modal = document.createElement("div");
    modal.id = "modalPago";
    modal.className = "modal-pago-overlay";
    modal.innerHTML = `
      <div class="modal-pago">
        <button class="modal-pago__cerrar" type="button" aria-label="Cerrar">&times;</button>
        <h3 class="modal-pago__titulo">Datos de pago</h3>
        <p class="modal-pago__producto"><strong>${esc(p.nombre)}</strong> — ${precio(precioMostrar)}</p>
        ${titular ? `<p class="modal-pago__titular">Titular: <strong>${esc(titular)}</strong></p>` : ""}
        ${htmlCuentas}
        <p class="modal-pago__nota">Enviá el comprobante por WhatsApp para confirmar tu compra.</p>
        <a class="btn btn--acento modal-pago__wsp" href="${linkWsp("Hola! Quiero comprar: " + p.nombre + " (" + precio(precioMostrar) + ")")}" target="_blank" rel="noopener">
          Enviar comprobante por WhatsApp
        </a>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector(".modal-pago__cerrar").addEventListener("click", function() { modal.remove(); });
    modal.addEventListener("click", function(e) { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll("[data-copiar]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var texto = btn.dataset.copiar;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(texto).then(function() { aviso("Copiado: " + texto); });
        } else {
          var ta = document.createElement("textarea");
          ta.value = texto; document.body.appendChild(ta); ta.select();
          document.execCommand("copy"); ta.remove();
          aviso("Copiado: " + texto);
        }
      });
    });
  }

  /* ------------------------------------------------------------- Arranque */
  function iniciar(pagina) {
    montarHeader(pagina);
    montarFooter();
    montarCarrito();
    actualizarBurbujas();
    document.addEventListener("favoritos:cambio", actualizarBurbujas);
  }

  /* --------------------------------------------------------- API pública */
  window.T = {
    $, $$, esc, precio, paramURL, colorPorSlug, catPorSlug, subPorSlug,
    GEN, generoPorSlug, esDelGenero,
    stockTotal, tallesDe, descuento, linkWsp,
    LOCAL, direccionCompleta, consultaMapa, linkMapa, mapaHTML,
    Carrito, Favoritos, Modo, MAY, MIN, aviso, ICO, TEMAS_INFO,
    MARCAS_PAGO, PAGO, bloqueMediosPago, bloqueCuentas, activarCopiar, bloqueCalculadora,
    bloqueComoEnviamos, bloqueComoComprar, bloqueRedes,
    bloqueProximamente, hayCatalogo, hayCategorias,
    tarjetaProducto, bloquePrecios, activarTarjetas, activarFavoritos,
    activarAcordeones, iniciar, pintarCarrito,
    CFG, PRODS
  };
})();
