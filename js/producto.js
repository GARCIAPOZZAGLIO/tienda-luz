/* ========================== FICHA DE PRODUCTO ============================= */
(function () {
  "use strict";
  const {
    $, $$, esc, precio, CFG, PRODS, MAY, Modo, paramURL, colorPorSlug, catPorSlug, subPorSlug,
    stockTotal, descuento, linkWsp, Carrito, Favoritos, aviso, ICO, generoPorSlug,
    tarjetaProducto, activarTarjetas, activarAcordeones
  } = window.T;

  window.T.iniciar("producto");

  const id = paramURL("id");
  const p = PRODS.find((x) => x.id === id) || PRODS.find((x) => x.slug === id);

  if (!p) {
    $("#ficha").innerHTML = `
      <div class="sin-resultados">
        <h3>No encontramos ese producto</h3>
        <p>Puede que ya no esté disponible.</p>
        <p style="margin-top:1.5rem"><a class="btn btn--principal" href="catalogo.html">Ver catálogo</a></p>
      </div>`;
    return;
  }

  document.title = `${p.nombre} (${p.codigo}) · ${CFG.marca.nombre} ${CFG.marca.nombreAcento}`;
  const cat = catPorSlug(p.categoria);
  const sub = subPorSlug(p.categoria, p.subcategoria);
  $("#miga").innerHTML =
    `<a href="index.html">Inicio</a><span>/</span>` +
    `<a href="catalogo.html?categoria=${cat.slug}">${esc(cat.nombre)}</a><span>/</span>` +
    `<a href="catalogo.html?categoria=${cat.slug}&sub=${sub.slug}">${esc(sub.nombre)}</a><span>/</span>${esc(p.nombre)}`;

  /* --------------------------------------------------------- Selecciones */
  const talles = Object.keys(p.stock);
  const primerTalle = talles.find((t) => p.stock[t] > 0) || null;

  const sel = {
    talle: primerTalle,
    color: p.colores[0],
    cantidad: Math.min(Modo.minimoPorArticulo(), primerTalle ? p.stock[primerTalle] : 1),
    foto: 0
  };

  const tieneFotos = p.imagenes && p.imagenes.length;
  const agotado = stockTotal(p) === 0;

  /* -------------------------------------------------------------- Pintado */
  function pintar() {
    const stockSel = sel.talle ? (p.stock[sel.talle] || 0) : 0;
    const desc = descuento(p);
    const pAct = Modo.precioDe(p);
    const minArt = Modo.minimoPorArticulo();
    const faltaCantidad = sel.cantidad < minArt;

    $("#ficha").innerHTML = `
      <div class="ficha">

        <!-- Galería -->
        <div class="galeria">
          <div class="galeria__miniaturas" id="miniaturas">
            ${tieneFotos
              ? p.imagenes.map((src, i) =>
                  `<button data-foto="${i}" aria-current="${i === sel.foto}" aria-label="Foto ${i + 1}">
                     <img src="${esc(src)}" alt="" loading="lazy">
                   </button>`).join("")
              : ""}
          </div>
          <div class="galeria__principal ${tieneFotos ? "" : "producto__media--vacio"}">
            ${tieneFotos
              ? `<img src="${esc(p.imagenes[sel.foto])}" alt="${esc(p.nombre)}">`
              : `<div style="text-align:center;padding:2rem;line-height:2">
                   Foto pendiente<br>${esc(p.codigo)}
                   <p style="text-transform:none;letter-spacing:0;font-size:var(--t-xs);line-height:1.5;margin-top:1rem;max-width:32ch">
                     Cargá las imágenes en <strong>img/productos/</strong> y sumá las rutas al campo
                     <strong>"imagenes"</strong> de este producto en data/productos.js
                   </p>
                 </div>`}
          </div>
        </div>

        <!-- Info -->
        <div class="ficha__info">
          <p class="ficha__codigo">${esc(generoPorSlug(p.genero).nombre)} · ${esc(cat.nombre)} · ${esc(sub.nombre)} · Cód. ${esc(p.codigo)}</p>
          <h1 class="ficha__titulo">${esc(p.nombre)}</h1>

          <div class="precios ficha__precios">
            <span class="precio">${precio(pAct)}</span>
            ${!Modo.esMayorista() && p.precioAnterior
              ? `<span class="precio--tachado">${precio(p.precioAnterior)}</span>
                 <span class="precio--desc">${desc}% OFF</span>` : ""}
          </div>
          <p class="cuotas">
            ${CFG.cuotas.cantidad} cuotas ${CFG.cuotas.sinInteres ? "sin interés" : ""} de
            <strong>${precio(pAct / CFG.cuotas.cantidad)}</strong>
          </p>

          ${MAY.activo ? `
          <div class="caja-precios">
            <div class="caja-precios__fila" data-activo="${!Modo.esMayorista()}">
              <span class="caja-precios__etiqueta">Precio por menor<strong>Desde 1 unidad</strong></span>
              <span class="caja-precios__valor">${precio(p.precio)}</span>
            </div>
            <div class="caja-precios__fila" data-activo="${Modo.esMayorista()}">
              <span class="caja-precios__etiqueta">Precio por mayor<strong>Desde ${MAY.unidadesMinimas} unidades</strong></span>
              <span class="caja-precios__valor">${precio(p.precioMayorista)}</span>
            </div>
          </div>` : ""}

          <div class="stock-aviso">
            <span class="punto ${agotado ? "punto--sin" : stockSel > 0 && stockSel <= 5 ? "punto--bajo" : ""}"></span>
            <span>${agotado
              ? "Sin stock por el momento"
              : stockSel === 0 ? "Elegí un talle disponible"
              : stockSel === 1 ? `¡Última unidad en talle ${sel.talle}!`
              : stockSel <= 5 ? `¡Últimas ${stockSel} unidades en talle ${sel.talle}!`
              : `${stockSel} unidades disponibles en talle ${sel.talle}`}</span>
          </div>

          <!-- Color -->
          <div class="opcion">
            <div class="opcion__label">
              <span>Color <span class="opcion__valor">${esc(colorPorSlug(sel.color).nombre)}</span></span>
            </div>
            <div class="selector-colores" id="selColores">
              ${p.colores.map((c) => `
                <button data-color="${esc(c)}" aria-pressed="${c === sel.color}"
                        style="background:${colorPorSlug(c).hex}"
                        title="${esc(colorPorSlug(c).nombre)}" aria-label="${esc(colorPorSlug(c).nombre)}"></button>`).join("")}
            </div>
          </div>

          <!-- Talle -->
          <div class="opcion">
            <div class="opcion__label">
              <span>Talle ${sel.talle ? `<span class="opcion__valor">${esc(sel.talle)}</span>` : ""}</span>
              <a href="#guiaTalles" id="linkGuia">Guía de talles</a>
            </div>
            <div class="selector-talles" id="selTalles">
              ${talles.map((t) => `
                <button data-talle="${esc(t)}" aria-pressed="${t === sel.talle}"
                        ${p.stock[t] === 0 ? "disabled" : ""}
                        title="${p.stock[t] === 0 ? "Sin stock" : p.stock[t] + " disponibles"}">${esc(t)}</button>`).join("")}
            </div>
          </div>

          <!-- Cantidad -->
          <div class="opcion">
            <div class="opcion__label">
              <span>Cantidad</span>
              ${minArt > 1 ? `<span class="opcion__valor">Mínimo ${minArt} u. por artículo</span>` : ""}
            </div>
            <div class="cantidad">
              <button id="menos" aria-label="Restar">−</button>
              <input id="cant" value="${sel.cantidad}" readonly aria-label="Cantidad">
              <button id="mas" aria-label="Sumar">+</button>
            </div>
            ${faltaCantidad ? `<p style="font-size:var(--t-xs);color:var(--c-alerta);margin-top:.5rem">
              En modo por mayor el mínimo es ${minArt} unidades de este artículo.</p>` : ""}
            <p style="font-size:var(--t-xs);color:var(--c-tinta-suave);margin-top:.5rem">
              Subtotal: <strong>${precio(pAct * sel.cantidad)}</strong></p>
          </div>

          <!-- Acciones -->
          <div class="ficha__acciones ficha__acciones--dos">
            <button class="btn btn--acento" id="btnAgregar" ${agotado || stockSel === 0 || faltaCantidad ? "disabled" : ""}>
              ${agotado ? "Sin stock" : "Agregar al carrito"}
            </button>
            <button class="btn btn--principal" id="btnComprar" ${agotado || stockSel === 0 || faltaCantidad ? "disabled" : ""}>
              Comprar ahora
            </button>
          </div>
          <div class="ficha__acciones">
            <a class="btn btn--wsp" id="btnConsultar" href="#" target="_blank" rel="noopener">Consultar por WhatsApp</a>
            <button class="btn btn--linea" id="btnFav" aria-pressed="${Favoritos.tiene(p.id)}">
              ${Favoritos.tiene(p.id) ? "♥ Guardado en favoritos" : "♡ Guardar en favoritos"}
            </button>
          </div>

          <!-- Detalle -->
          <div class="acordeon" style="margin-top:2rem">
            <div class="acordeon__item" data-abierto="true">
              <button class="acordeon__btn">Descripción ${ICO.mas}</button>
              <div class="acordeon__cuerpo">
                <p>${esc(p.descripcion).replace(/\n/g, "<br>")}</p>
                ${p.materiales ? `<p style="margin-top:.75rem"><strong>Material:</strong> ${esc(p.materiales)}</p>` : ""}
                ${p.origen ? `<p><strong>Origen:</strong> ${esc(p.origen)}</p>` : ""}
                <p><strong>Código de artículo:</strong> ${esc(p.codigo)}</p>
              </div>
            </div>
            <div class="acordeon__item" data-abierto="false" id="guiaTalles">
              <button class="acordeon__btn">Guía de talles ${ICO.mas}</button>
              <div class="acordeon__cuerpo">
                <p>Medidas de la prenda en cm. Ante la duda, escribinos y te asesoramos.</p>
                <table class="tabla-talles">
                  <thead><tr>${CFG.tablaTalles.encabezados.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
                  <tbody>${CFG.tablaTalles.filas.map((f) => `<tr>${f.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
                </table>
              </div>
            </div>
            <div class="acordeon__item" data-abierto="false">
              <button class="acordeon__btn">Cuidados ${ICO.mas}</button>
              <div class="acordeon__cuerpo"><ul>${CFG.info.cuidados.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></div>
            </div>
            <div class="acordeon__item" data-abierto="false">
              <button class="acordeon__btn">Envíos y cambios ${ICO.mas}</button>
              <div class="acordeon__cuerpo">
                <p>Enviamos a todo el país por ${esc(CFG.envio.transportes.join(", "))}.
                   ${esc(CFG.envio.despacho || "")}. Demora estimada: ${esc(CFG.envio.demoraEstandar)}.</p>
                <p style="margin-top:.5rem"><strong>El costo del envío queda a cargo del comprador</strong>
                   y se coordina por WhatsApp según el transporte que elijas.
                   ${esc(CFG.envio.textoRetiro)}.</p>
                <p style="margin-top:.75rem">${esc(CFG.info.cambios)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    conectar();
  }

  /* -------------------------------------------------------------- Eventos */
  function conectar() {
    $$("#miniaturas [data-foto]").forEach((b) => b.addEventListener("click", () => {
      sel.foto = Number(b.dataset.foto); pintar();
    }));

    $$("#selColores [data-color]").forEach((b) => b.addEventListener("click", () => {
      sel.color = b.dataset.color; pintar();
    }));

    $$("#selTalles [data-talle]").forEach((b) => b.addEventListener("click", () => {
      sel.talle = b.dataset.talle;
      sel.cantidad = Math.min(Modo.minimoPorArticulo(), p.stock[sel.talle]);
      pintar();
    }));

    $("#mas").addEventListener("click", () => {
      const max = sel.talle ? p.stock[sel.talle] : 1;
      if (sel.cantidad < max) { sel.cantidad++; pintar(); }
      else aviso("No hay más unidades de ese talle");
    });
    $("#menos").addEventListener("click", () => {
      if (sel.cantidad > 1) { sel.cantidad--; pintar(); }
    });

    const agregar = () => {
      if (!sel.talle) { aviso("Elegí un talle"); return false; }
      Carrito.agregar(p, sel.talle, sel.color, sel.cantidad);
      return true;
    };

    $("#btnAgregar").addEventListener("click", () => {
      if (!agregar()) return;
      aviso("Agregado al carrito ✓");
      if (window.abrirCarrito) window.abrirCarrito();
    });

    $("#btnComprar").addEventListener("click", () => {
      if (!agregar()) return;
      location.href = "pedido.html";
    });

    $("#btnFav").addEventListener("click", () => {
      const activo = Favoritos.alternar(p.id);
      aviso(activo ? "Agregado a favoritos" : "Quitado de favoritos");
      pintar();
    });

    $("#btnConsultar").href = linkWsp(
      `¡Hola! Me interesa este producto:\n\n*${p.nombre}* (cód. ${p.codigo})\n` +
      `Color: ${colorPorSlug(sel.color).nombre}\n` +
      (sel.talle ? `Talle: ${sel.talle}\n` : "") +
      `Precio ${Modo.etiqueta().toLowerCase()}: ${precio(Modo.precioDe(p))}`
    );

    $("#linkGuia").addEventListener("click", (e) => {
      e.preventDefault();
      const item = $("#guiaTalles");
      item.dataset.abierto = "true";
      item.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    activarAcordeones($("#ficha"));
  }

  /* -------------------------------------------------------- Relacionados */
  function relacionados() {
    let lista = PRODS.filter((x) => x.id !== p.id && x.subcategoria === p.subcategoria &&
                                     x.categoria === p.categoria && stockTotal(x) > 0);
    if (lista.length < 4) {
      lista = lista.concat(PRODS.filter((x) =>
        x.id !== p.id && x.categoria === p.categoria && stockTotal(x) > 0 && lista.indexOf(x) === -1));
    }
    lista = lista.slice(0, 5);
    if (!lista.length) return;
    $("#seccionRelacionados").hidden = false;
    $("#relacionados").innerHTML = lista.map(tarjetaProducto).join("");
    activarTarjetas($("#relacionados"));
  }

  pintar();
  relacionados();
  document.addEventListener("modo:cambio", () => {
    sel.cantidad = Math.max(sel.cantidad, Modo.minimoPorArticulo());
    if (sel.talle) sel.cantidad = Math.min(sel.cantidad, p.stock[sel.talle]);
    pintar(); relacionados();
  });
})();
