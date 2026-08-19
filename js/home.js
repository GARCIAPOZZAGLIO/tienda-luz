/* ============================ PÁGINA DE INICIO ============================ */
(function () {
  "use strict";
  const {
    $, $$, esc, precio, CFG, PRODS, MAY, Modo, ICO,
    tarjetaProducto, activarTarjetas, stockTotal, descuento,
    LOCAL, direccionCompleta, linkMapa, mapaHTML, linkWsp,
    GEN, esDelGenero, PAGO, bloqueMediosPago, bloqueCuentas, activarCopiar,
    bloqueComoEnviamos, bloqueComoComprar, bloqueRedes,
    bloqueProximamente, hayCatalogo, hayCategorias
  } = window.T;

  window.T.iniciar("home");
  document.title = `${CFG.marca.nombre} · ${CFG.marca.slogan}`;

  /* ======================================================== SLIDER ======== */
  function montarSlider() {
    const pista = $("#sliderPista"), puntos = $("#sliderPuntos");
    const banners = CFG.banners || [];
    if (!banners.length) { $("#slider").hidden = true; return; }

    pista.innerHTML = banners.map((b) => `
      <div class="slide ${b.imagen ? "" : "slide--sin-foto"}" role="group">
        ${b.imagen ? `<img src="${esc(b.imagen)}" alt="">` : ""}
        <div class="slide__contenido">
          ${b.antetitulo ? `<p class="antetitulo">${esc(b.antetitulo)}</p>` : ""}
          <h2 class="slide__titulo">${esc(b.titulo)}</h2>
          ${b.bajada ? `<p class="slide__bajada">${esc(b.bajada)}</p>` : ""}
          <a class="btn btn--principal" href="${esc(b.link || "catalogo.html")}">${esc(b.textoBoton || "Ver más")}</a>
        </div>
      </div>`).join("");

    puntos.innerHTML = banners.map((_, i) =>
      `<button data-slide="${i}" aria-current="${i === 0}" aria-label="Banner ${i + 1}"></button>`).join("");

    $("#sliderPrev").innerHTML = ICO.izq;
    $("#sliderNext").innerHTML = ICO.der;

    let actual = 0, timer;
    const ir = (i) => {
      actual = (i + banners.length) % banners.length;
      pista.style.transform = `translateX(-${actual * 100}%)`;
      $$("#sliderPuntos button").forEach((b, j) => b.setAttribute("aria-current", j === actual));
    };
    const auto = () => { clearInterval(timer); timer = setInterval(() => ir(actual + 1), 6000); };

    $("#sliderPrev").addEventListener("click", () => { ir(actual - 1); auto(); });
    $("#sliderNext").addEventListener("click", () => { ir(actual + 1); auto(); });
    $$("#sliderPuntos button").forEach((b) =>
      b.addEventListener("click", () => { ir(Number(b.dataset.slide)); auto(); }));

    if (banners.length > 1) auto();
    else { $("#sliderPrev").hidden = true; $("#sliderNext").hidden = true; puntos.hidden = true; }
  }

  /* ========================================= CONDICIONES DE COMPRA ======== */
  function montarCondiciones() {
    const minMenor = (CFG.minorista && CFG.minorista.compraMinima) || 0;
    const minMayor = (MAY.activo && MAY.compraMinima) || 0;
    if (!minMenor && !minMayor) { $("#condiciones").hidden = true; return; }

    const filas = [];
    if (minMenor) filas.push({
      etiqueta: "Compra mínima por menor", monto: minMenor,
      detalle: "Desde 1 unidad por artículo", link: "catalogo.html?modo=minorista"
    });
    if (minMayor) filas.push({
      etiqueta: "Pedido mínimo por mayor", monto: minMayor,
      detalle: `Desde ${MAY.unidadesMinimas} unidades por artículo`, link: "catalogo.html?modo=mayorista"
    });

    $("#condiciones").innerHTML = `
      <div class="contenedor">
        <div class="condiciones__grilla">
          ${filas.map((f) => `
            <a class="condicion" href="${esc(f.link)}">
              <span class="condicion__etiqueta">${esc(f.etiqueta)}</span>
              <span class="condicion__monto">${precio(f.monto)}</span>
              <span class="condicion__detalle">${esc(f.detalle)}</span>
            </a>`).join("")}
        </div>
      </div>`;
  }

  /* ==================================================== BENEFICIOS ======== */
  function montarBeneficios() {
    /* Se leen de config.js. Si no hay nada cargado, se usa una tira básica. */
    const lista = (CFG.beneficios && CFG.beneficios.length) ? CFG.beneficios : [
      { icono: "local",   titulo: "Local a la calle",       texto: CFG.contacto.direccion },
      { icono: "camion",  titulo: "Envíos a todo el país",  texto: CFG.envio.transportes.slice(0, 2).join(" · ") },
      { icono: "tarjeta", titulo: "Todos los medios de pago", texto: CFG.cuotas.cantidad > 0 ? `${CFG.cuotas.cantidad} cuotas sin interés` : "Transferencia y efectivo" },
      { icono: "escudo",  titulo: "Compra protegida",       texto: "Atención real por WhatsApp" }
    ];

    $("#beneficios").innerHTML = lista.map((b) =>
      `<div class="beneficio">${ICO[b.icono] || ICO.escudo}
         <div><h3>${esc(b.titulo)}</h3><p>${esc(b.texto)}</p></div>
       </div>`).join("");
  }

  /* ================================ SECCIONES MUJER / HOMBRE / OFERTAS === */
  function montarSecciones3() {
    /* Sin productos cargados, estas tarjetas no llevan a ningún lado */
    if (!hayCatalogo()) { $("#grillaSecciones").closest("section").hidden = true; return; }

    const conStock = PRODS.filter((p) => stockTotal(p) > 0);
    const bloques = (GEN.lista || [])
      .filter((g) => g.slug !== "unisex")
      .map((g) => ({
        nombre: "Ropa de " + g.nombre.toLowerCase(),
        etiqueta: `${conStock.filter((p) => esDelGenero(p, g.slug)).length} productos`,
        link: `catalogo.html?genero=${g.slug}`,
        imagen: g.imagen,
        clase: "seccion-card--" + g.slug
      }));

    bloques.push({
      nombre: "Ofertas",
      etiqueta: `${conStock.filter((p) => p.precioAnterior).length} productos en oferta`,
      link: "catalogo.html?oferta=1",
      imagen: "",
      clase: "seccion-card--oferta"
    });

    $("#grillaSecciones").innerHTML = bloques.map((b) => `
      <a class="seccion-card ${b.clase}" href="${esc(b.link)}">
        ${b.imagen ? `<img src="${esc(b.imagen)}" alt="${esc(b.nombre)}" loading="lazy">` : ""}
        <span class="seccion-card__texto">
          <strong>${esc(b.nombre)}</strong>
          <span>${esc(b.etiqueta)}</span>
        </span>
      </a>`).join("");
  }

  /* ==================================================== CATEGORÍAS ======== */
  function montarCategorias() {
    /* Todavía no hay categorías definidas: se oculta la sección entera */
    if (!hayCategorias()) {
      $("#grillaCategorias").closest("section").hidden = true;
      return;
    }

    $("#grillaCategorias").innerHTML = CFG.categorias.map((c) => {
      const cant = PRODS.filter((p) => p.categoria === c.slug).length;
      return `
        <a class="cat-card" href="catalogo.html?categoria=${c.slug}">
          ${c.imagen ? `<img src="${esc(c.imagen)}" alt="${esc(c.nombre)}" loading="lazy">` : ""}
          <div class="cat-card__texto">
            <span>${cant} productos</span>
            <h3>${esc(c.nombre)}</h3>
          </div>
        </a>`;
    }).join("");
  }

  /* ========================================= SECCIONES DE PRODUCTOS ======= */
  function seleccionar(sec) {
    const conStock = PRODS.filter((p) => stockTotal(p) > 0);
    let lista;
    switch (sec.tipo) {
      case "nuevos":
        lista = conStock.slice().sort((a, b) => b.fechaAlta.localeCompare(a.fechaAlta));
        break;
      case "oferta":
        lista = conStock.filter((p) => p.precioAnterior)
                        .sort((a, b) => descuento(b) - descuento(a));
        break;
      case "genero":
        lista = conStock.filter((p) => esDelGenero(p, sec.valor));
        break;
      case "categoria":
        lista = conStock.filter((p) => p.categoria === sec.valor);
        break;
      case "subcategoria":
        lista = conStock.filter((p) => p.subcategoria === sec.valor);
        break;
      default:
        lista = conStock.filter((p) => p.destacado);
    }
    return lista.slice(0, sec.cantidad || 10);
  }

  /* Mensaje de cada sección mientras no haya productos cargados */
  const AVISOS_VACIO = {
    nuevos: "Estamos cargando el catálogo con las fotos y los precios de cada prenda. Los últimos ingresos van a aparecer acá.",
    oferta: "Todavía no hay promociones publicadas. Cuando lancemos ofertas, las vas a ver en esta sección.",
    genero: "Estamos preparando esta sección. Muy pronto vas a poder ver todas las prendas con sus fotos y precios.",
    destacados: "Estamos cargando el catálogo. Muy pronto vas a ver acá las prendas destacadas."
  };

  function montarSecciones() {
    const cont = $("#seccionesProductos");
    const vacio = !hayCatalogo();

    const html = (CFG.seccionesHome || []).map((sec, i) => {
      const items = vacio ? [] : seleccionar(sec);

      /* Con catálogo cargado, una sección sin resultados no se muestra.
         Sin catálogo, se muestra el título con el cartel de "muy pronto". */
      if (!items.length && !vacio) return "";

      const cuerpo = items.length
        ? `<div class="grilla-productos">${items.map(tarjetaProducto).join("")}</div>
           <p class="centrado" style="margin-top:2.5rem">
             <a class="btn btn--linea" href="${esc(sec.link || "catalogo.html")}">Ver todos</a>
           </p>`
        : bloqueProximamente(AVISOS_VACIO[sec.tipo] || AVISOS_VACIO.destacados);

      return `
        <section class="seccion ${i % 2 === 1 ? "seccion--alt" : ""}">
          <div class="contenedor">
            <div class="titulo-centrado"><h2 class="titulo-seccion">${esc(sec.titulo)}</h2></div>
            ${cuerpo}
          </div>
        </section>`;
    }).join("");

    cont.innerHTML = html;
    activarTarjetas(cont);
  }

  /* ================================================ BLOQUE MAYORISTA ====== */
  function montarMayorista() {
    if (!MAY.activo) { $("#bloqueMayorista").hidden = true; return; }
    $("#textoMayorista").textContent =
      `Compra mínima de ${precio(MAY.compraMinima)} y ${MAY.unidadesMinimas} unidades por artículo. ` +
      `Sin registro ni trámites: activás "Por mayor" arriba y ya ves todos los precios mayoristas.`;
  }

  /* ================================================ MEDIOS DE PAGO ======= */
  function montarPagos() {
    $("#bloquePagos").innerHTML = bloqueMediosPago();

    if (PAGO.cuentas && PAGO.cuentas.length) {
      $("#bloqueCuentas").innerHTML = `
        <div class="titulo-centrado" style="margin-bottom:1.5rem">
          <h3 class="titulo-seccion" style="font-size:var(--t-lg)">Datos para transferir</h3>
        </div>
        ${bloqueCuentas()}
        <p class="centrado" style="margin-top:1.5rem">
          <a class="btn btn--linea" href="info.html?tema=medios-pago">Ver cómo pagar paso a paso</a>
        </p>`;
      activarCopiar($("#bloqueCuentas"));
    }
  }

  /* ================================================ DÓNDE ESTAMOS ======== */
  function montarLocal() {
    if (!LOCAL.mostrarMapaEnInicio) return;
    const c = CFG.contacto;

    $("#seccionLocal").hidden = false;
    $("#bloqueLocal").innerHTML = `
      ${mapaHTML()}
      <div>
        <div class="local__dato">
          ${ICO.pin}
          <div>
            <h3>Dirección</h3>
            <a href="${linkMapa()}" target="_blank" rel="noopener">
              ${esc(LOCAL.calle)}${LOCAL.entreCalles ? ` (${esc(LOCAL.entreCalles)})` : ""}<br>
              ${esc(LOCAL.localidad)}, ${esc(LOCAL.provincia)}
            </a>
          </div>
        </div>

        <div class="local__dato">
          ${ICO.wsp}
          <div>
            <h3>WhatsApp</h3>
            <a href="${linkWsp(c.mensajeInicial)}" target="_blank" rel="noopener">${esc(c.telefonoVisible)}</a>
          </div>
        </div>

        <div class="local__dato">
          ${ICO.sobre}
          <div>
            <h3>Email</h3>
            <a href="mailto:${esc(c.email)}">${esc(c.email)}</a>
          </div>
        </div>

        <div class="local__dato">
          ${ICO.reloj}
          <div>
            <h3>Horarios</h3>
            <p>${esc(c.horarios)}</p>
          </div>
        </div>

        <div class="local__botones">
          <a class="btn btn--principal" href="${linkMapa()}" target="_blank" rel="noopener">Cómo llegar</a>
          <a class="btn btn--wsp" href="${linkWsp(c.mensajeInicial)}" target="_blank" rel="noopener">Escribinos</a>
        </div>
      </div>`;
  }

  /* -------------------------------------------------------------- Arranque */
  montarSlider();
  montarCondiciones();
  montarBeneficios();
  montarSecciones3();
  montarCategorias();
  montarSecciones();
  montarPagos();
  montarLocal();
  if (CFG.redes.mostrarSeccionEnInicio !== false) {
    const html = bloqueRedes();
    if (html) { $("#seccionRedes").hidden = false; $("#bloqueRedes").innerHTML = html; }
  }

  $("#bloqueComoComprar").innerHTML = bloqueComoComprar();
  $("#bloqueEnvios").innerHTML = bloqueComoEnviamos();
  montarMayorista();

  /* Al cambiar de minorista a mayorista se repintan los precios */
  document.addEventListener("modo:cambio", montarSecciones);
})();
