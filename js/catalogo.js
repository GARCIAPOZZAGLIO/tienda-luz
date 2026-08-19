/* ============================== CATÁLOGO ================================== */
(function () {
  "use strict";
  const {
    $, $$, esc, precio, CFG, PRODS, paramURL, colorPorSlug, catPorSlug, subPorSlug,
    stockTotal, descuento, tarjetaProducto, activarTarjetas, Favoritos, Modo,
    GEN, generoPorSlug, esDelGenero, bloqueProximamente, hayCatalogo, hayCategorias
  } = window.T;

  window.T.iniciar("catalogo");

  /* Catálogo todavía sin cargar: se muestra el aviso y se corta acá */
  if (!hayCatalogo()) {
    document.title = `Catálogo · ${CFG.marca.nombre} ${CFG.marca.nombreAcento}`;
    $("#miga").innerHTML = '<a href="index.html">Inicio</a><span>/</span>Catálogo';
    $("#tituloCatalogo").textContent = "Catálogo";
    $("#subtituloCatalogo").textContent = "Estamos cargando las prendas";
    const cont = $(".catalogo");
    cont.style.display = "block";
    cont.innerHTML = bloqueProximamente(
      "Estamos cargando el catálogo completo con las fotos, los talles y los precios " +
      "de cada prenda. Mientras tanto podés ver las novedades en Instagram o " +
      "escribirnos por WhatsApp y te asesoramos."
    );
    return;
  }

  /* ------------------------------------------------------------- Estado */
  const estado = {
    genero: null,           // "mujer" | "hombre" | "unisex" | null (todo)
    categoria: null,        // slug de categoría (una sola, como en la referencia)
    sub: null,              // slug de subcategoría
    talles: new Set(),
    colores: new Set(),
    precioMax: null,
    busqueda: "",
    oferta: false,
    nuevo: false,
    conStock: true,
    favoritos: false,
    orden: CFG.catalogo.ordenPorDefecto,
    mostrados: CFG.catalogo.productosPorTanda
  };

  const PRECIO_MIN = Math.min(...PRODS.map((p) => p.precio));
  const PRECIO_MAX = Math.max(...PRODS.map((p) => p.precio));
  estado.precioMax = PRECIO_MAX;

  /* Lee la URL: catalogo.html?categoria=remeras&sub=oversize&oferta=1&orden=nuevos&q=lino */
  (function leerURL() {
    if (paramURL("genero")) estado.genero = paramURL("genero");
    if (paramURL("categoria")) estado.categoria = paramURL("categoria");
    if (paramURL("sub")) estado.sub = paramURL("sub");
    if (paramURL("oferta")) estado.oferta = true;
    if (paramURL("favoritos")) estado.favoritos = true;
    if (paramURL("orden")) estado.orden = paramURL("orden");
    if (paramURL("q")) estado.busqueda = paramURL("q");
  })();

  /* ------------------------------------------------------ Pintar filtros */
  /* Los conteos del árbol respetan el género elegido */
  function contarEn(catSlug, subSlug) {
    return PRODS.filter((p) =>
      esDelGenero(p, estado.genero) &&
      p.categoria === catSlug &&
      (!subSlug || p.subcategoria === subSlug)).length;
  }

  function contarGenero(slug) {
    return PRODS.filter((p) => esDelGenero(p, slug)).length;
  }

  function pintarGeneros() {
    const cont = $("#filtroGeneros");
    if (!cont) return;
    cont.innerHTML = `
      <li><a href="#" data-gen="" aria-current="${!estado.genero}">Todo
        <span class="arbol-cat__conteo">${PRODS.length}</span></a></li>
      ${(GEN.lista || []).map((g) => `
        <li><a href="#" data-gen="${g.slug}" aria-current="${estado.genero === g.slug}">
          ${esc(g.nombre)}<span class="arbol-cat__conteo">${contarGenero(g.slug)}</span>
        </a></li>`).join("")}`;

    $$("#filtroGeneros a").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      estado.genero = a.dataset.gen || null;
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintarFiltros(); pintarEncabezado(); pintar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  }

  function pintarArbol() {
    $("#arbolCategorias").innerHTML = `
      <li><a href="#" data-cat="" aria-current="${!estado.categoria}">Ver todo
        <span class="arbol-cat__conteo">${PRODS.length}</span></a></li>
      ${CFG.categorias.map((c) => `
        <li>
          <a href="#" data-cat="${c.slug}" aria-current="${estado.categoria === c.slug && !estado.sub}">
            ${esc(c.nombre)}<span class="arbol-cat__conteo">${contarEn(c.slug)}</span>
          </a>
          ${estado.categoria === c.slug && (c.subcategorias || []).length ? `
            <ul>${c.subcategorias.map((s) => `
              <li><a href="#" data-cat="${c.slug}" data-sub="${s.slug}"
                     aria-current="${estado.sub === s.slug}">${esc(s.nombre)}
                <span class="arbol-cat__conteo">${contarEn(c.slug, s.slug)}</span></a></li>`).join("")}
            </ul>` : ""}
        </li>`).join("")}`;

    $$("#arbolCategorias a").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      estado.categoria = a.dataset.cat || null;
      estado.sub = a.dataset.sub || null;
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintarArbol(); pintarEncabezado(); pintar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  }

  function pintarFiltros() {
    pintarGeneros();
    pintarArbol();

    /* Mostramos solo los talles que existen de verdad en el catálogo, en el
       orden de config.js; los que no estén en esa lista (ej. "2") van al final. */
    const orden = CFG.talles.concat(["Único"]);
    const enUso = new Set();
    PRODS.forEach((p) => Object.keys(p.stock || {}).forEach((t) => {
      if ((p.stock[t] || 0) > 0) enUso.add(t);
    }));
    const todosTalles = orden.filter((t) => enUso.has(t))
      .concat(Array.from(enUso).filter((t) => orden.indexOf(t) === -1).sort());

    const grupoTalles = $("#filtroTalles").closest(".filtros__grupo");
    if (grupoTalles) grupoTalles.hidden = todosTalles.length < 2;
    $("#filtroTalles").innerHTML = todosTalles.map((t) =>
      `<button class="chip-talle" data-talle="${esc(t)}" aria-pressed="${estado.talles.has(t)}">${esc(t)}</button>`).join("");

    $("#filtroColores").innerHTML = CFG.colores.map((c) =>
      `<button class="color-filtro" data-color="${c.slug}" style="background:${c.hex}"
               aria-pressed="${estado.colores.has(c.slug)}" title="${esc(c.nombre)}" aria-label="${esc(c.nombre)}"></button>`).join("");

    const rango = $("#filtroPrecio");
    rango.min = PRECIO_MIN; rango.max = PRECIO_MAX; rango.step = 1000;
    rango.value = estado.precioMax;
    $("#precioMin").textContent = precio(PRECIO_MIN);
    $("#precioMax").textContent = "hasta " + precio(estado.precioMax);

    $("#soloOferta").checked = estado.oferta;
    $("#soloNuevo").checked  = estado.nuevo;
    $("#soloStock").checked  = estado.conStock;
    $("#soloFav").checked    = estado.favoritos;
    $("#busqueda").value     = estado.busqueda;
    $("#orden").value        = estado.orden;
  }

  /* -------------------------------------------------------- Filtrar todo */
  function filtrar() {
    const q = estado.busqueda.trim().toLowerCase();
    return PRODS.filter((p) => {
      if (!esDelGenero(p, estado.genero)) return false;
      if (estado.categoria && p.categoria !== estado.categoria) return false;
      if (estado.sub && p.subcategoria !== estado.sub) return false;
      if (estado.talles.size && !Array.from(estado.talles).some((t) => (p.stock[t] || 0) > 0)) return false;
      if (estado.colores.size && !p.colores.some((c) => estado.colores.has(c))) return false;
      if (p.precio > estado.precioMax) return false;
      if (estado.oferta && !p.precioAnterior) return false;
      if (estado.nuevo && !p.nuevo) return false;
      if (estado.conStock && stockTotal(p) === 0) return false;
      if (estado.favoritos && !Favoritos.tiene(p.id)) return false;
      if (q) {
        const texto = [p.nombre, p.codigo, p.id, p.categoria, p.subcategoria, p.materiales]
          .join(" ").toLowerCase();
        if (!q.split(/\s+/).every((w) => texto.indexOf(w) !== -1)) return false;
      }
      return true;
    });
  }

  function ordenar(lista) {
    const l = lista.slice();
    const pr = (p) => Modo.precioDe(p);
    switch (estado.orden) {
      case "precio-asc":  return l.sort((a, b) => pr(a) - pr(b));
      case "precio-desc": return l.sort((a, b) => pr(b) - pr(a));
      case "nombre-az":   return l.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
      case "nombre-za":   return l.sort((a, b) => b.nombre.localeCompare(a.nombre, "es"));
      case "nuevos":      return l.sort((a, b) => b.fechaAlta.localeCompare(a.fechaAlta));
      case "viejos":      return l.sort((a, b) => a.fechaAlta.localeCompare(b.fechaAlta));
      case "descuento":   return l.sort((a, b) => descuento(b) - descuento(a));
      default:            return l.sort((a, b) => (b.destacado === true) - (a.destacado === true));
    }
  }

  /* ------------------------------------------------------------- Pintado */
  function pintar() {
    const filtrados = ordenar(filtrar());
    const visibles = filtrados.slice(0, estado.mostrados);

    $("#conteo").textContent = filtrados.length === 0
      ? "Sin resultados"
      : `${filtrados.length} producto${filtrados.length === 1 ? "" : "s"}`;

    $("#grilla").innerHTML = visibles.length
      ? visibles.map(tarjetaProducto).join("")
      : `<div class="sin-resultados" style="grid-column:1/-1">
           <h3>No encontramos nada con esos filtros</h3>
           <p>Probá quitando algún filtro o buscando otra palabra.</p>
           <p style="margin-top:1.5rem"><button class="btn btn--linea" id="resetVacio">Limpiar filtros</button></p>
         </div>`;

    const rv = $("#resetVacio");
    if (rv) rv.addEventListener("click", limpiar);

    /* Botón "Mostrar más productos", como en la referencia */
    const caja = $("#cargarMas");
    if (filtrados.length > visibles.length) {
      caja.hidden = false;
      $("#progreso").style.width = Math.round(visibles.length / filtrados.length * 100) + "%";
      $("#textoProgreso").textContent = `Viendo ${visibles.length} de ${filtrados.length} productos`;
    } else if (filtrados.length > CFG.catalogo.productosPorTanda) {
      caja.hidden = false;
      $("#progreso").style.width = "100%";
      $("#textoProgreso").textContent = `Viste los ${filtrados.length} productos`;
      $("#btnCargarMas").hidden = true;
    } else {
      caja.hidden = true;
    }
    if (filtrados.length > visibles.length) $("#btnCargarMas").hidden = false;

    pintarTags();
    activarTarjetas($("#grilla"));
  }

  function pintarTags() {
    const tags = [];
    if (estado.genero) {
      tags.push([generoPorSlug(estado.genero).nombre, () => (estado.genero = null)]);
    }
    if (estado.categoria) {
      tags.push([catPorSlug(estado.categoria).nombre, () => { estado.categoria = null; estado.sub = null; }]);
    }
    if (estado.sub) tags.push([subPorSlug(estado.categoria, estado.sub).nombre, () => (estado.sub = null)]);
    estado.talles.forEach((t) => tags.push(["Talle " + t, () => estado.talles.delete(t)]));
    estado.colores.forEach((c) => tags.push([colorPorSlug(c).nombre, () => estado.colores.delete(c)]));
    if (estado.oferta) tags.push(["En oferta", () => (estado.oferta = false)]);
    if (estado.nuevo) tags.push(["Novedades", () => (estado.nuevo = false)]);
    if (estado.favoritos) tags.push(["Favoritos", () => (estado.favoritos = false)]);
    if (estado.precioMax < PRECIO_MAX) tags.push(["Hasta " + precio(estado.precioMax), () => (estado.precioMax = PRECIO_MAX)]);
    if (estado.busqueda) tags.push(['"' + estado.busqueda + '"', () => (estado.busqueda = "")]);

    $("#tagsActivos").innerHTML = tags.map(([txt], i) =>
      `<span class="tag-activo">${esc(txt)}<button data-tag="${i}" aria-label="Quitar filtro">×</button></span>`).join("");

    $$("#tagsActivos [data-tag]").forEach((b) => b.addEventListener("click", () => {
      tags[Number(b.dataset.tag)][1]();
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintarFiltros(); pintarEncabezado(); pintar();
    }));
  }

  /* -------------------------------------------------------------- Título */
  function pintarEncabezado() {
    let titulo = "Catálogo completo";
    let sub = `${PRODS.length} productos · indumentaria por mayor y por menor`;
    const migas = ['<a href="index.html">Inicio</a>'];
    const g = estado.genero ? generoPorSlug(estado.genero) : null;
    const qsGen = estado.genero ? `genero=${estado.genero}&` : "";

    if (g) {
      /* "Ropa unisex", no "Ropa de unisex" */
      titulo = estado.genero === "unisex" ? "Ropa unisex" : `Ropa de ${g.nombre.toLowerCase()}`;
      sub = GEN.incluirUnisexEnGenero && estado.genero !== "unisex"
        ? "Incluye las prendas unisex"
        : "Sección";
      migas.push(`<a href="catalogo.html?genero=${g.slug}">${esc(g.nombre)}</a>`);
    }

    if (estado.categoria) {
      const c = catPorSlug(estado.categoria);
      titulo = g ? `${c.nombre} de ${g.nombre.toLowerCase()}` : c.nombre;
      sub = "Categoría";
      if (!g) migas.push(`<a href="catalogo.html">Catálogo</a>`);
      if (estado.sub) {
        const s = subPorSlug(estado.categoria, estado.sub);
        migas.push(`<a href="catalogo.html?${qsGen}categoria=${c.slug}">${esc(c.nombre)}</a>`);
        titulo = `${c.nombre} · ${s.nombre}`;
        sub = g ? `Subcategoría · ${g.nombre}` : "Subcategoría";
      }
    } else if (estado.oferta) {
      titulo = g ? `Ofertas de ${g.nombre.toLowerCase()}` : "Ofertas";
      sub = "Productos con descuento";
    } else if (estado.favoritos) { titulo = "Mis favoritos"; sub = "Lo que fuiste guardando"; }

    migas.push(esc(titulo));
    $("#tituloCatalogo").textContent = titulo;
    $("#subtituloCatalogo").textContent = sub;
    document.title = `${titulo} · ${CFG.marca.nombre} ${CFG.marca.nombreAcento}`;
    $("#miga").innerHTML = migas.join("<span>/</span>");
  }

  /* -------------------------------------------------------------- Limpiar */
  function limpiar() {
    estado.genero = null;
    estado.categoria = null; estado.sub = null;
    estado.talles.clear(); estado.colores.clear();
    estado.precioMax = PRECIO_MAX; estado.busqueda = "";
    estado.oferta = estado.nuevo = estado.favoritos = false;
    estado.conStock = true;
    estado.mostrados = CFG.catalogo.productosPorTanda;
    pintarFiltros(); pintarEncabezado(); pintar();
  }

  /* ------------------------------------------------------------- Eventos */
  function conectarEventos() {
    $$(".filtros__grupo .filtros__titulo").forEach((b) => b.addEventListener("click", () => {
      const g = b.closest(".filtros__grupo");
      g.dataset.abierto = g.dataset.abierto === "true" ? "false" : "true";
    }));

    $("#filtros").addEventListener("change", (e) => {
      const t = e.target;
      if (t.id === "soloOferta") estado.oferta = t.checked;
      else if (t.id === "soloNuevo") estado.nuevo = t.checked;
      else if (t.id === "soloStock") estado.conStock = t.checked;
      else if (t.id === "soloFav")   estado.favoritos = t.checked;
      else return;
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintarEncabezado(); pintar();
    });

    $("#filtros").addEventListener("click", (e) => {
      const bt = e.target.closest("[data-talle]");
      const bc = e.target.closest("[data-color]");
      if (bt) {
        const t = bt.dataset.talle;
        estado.talles.has(t) ? estado.talles.delete(t) : estado.talles.add(t);
        bt.setAttribute("aria-pressed", estado.talles.has(t));
      } else if (bc) {
        const c = bc.dataset.color;
        estado.colores.has(c) ? estado.colores.delete(c) : estado.colores.add(c);
        bc.setAttribute("aria-pressed", estado.colores.has(c));
      } else return;
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintar();
    });

    $("#filtroPrecio").addEventListener("input", (e) => {
      estado.precioMax = Number(e.target.value);
      $("#precioMax").textContent = "hasta " + precio(estado.precioMax);
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintar();
    });

    $("#limpiarFiltros").addEventListener("click", limpiar);

    let debounce;
    $("#busqueda").addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        estado.busqueda = e.target.value;
        estado.mostrados = CFG.catalogo.productosPorTanda;
        pintar();
      }, 220);
    });

    $("#orden").addEventListener("change", (e) => {
      estado.orden = e.target.value;
      estado.mostrados = CFG.catalogo.productosPorTanda;
      pintar();
    });

    $("#btnCargarMas").addEventListener("click", () => {
      estado.mostrados += CFG.catalogo.productosPorTanda;
      pintar();
    });

    /* Panel de filtros en mobile */
    const velo = $("#veloFiltros"), panel = $("#filtros"), btnCerrar = $("#cerrarFiltros");
    const abrir = (v) => {
      panel.dataset.abierto = v; velo.dataset.abierto = v;
      btnCerrar.style.display = v === "true" ? "inline-flex" : "none";
      document.body.style.overflow = v === "true" ? "hidden" : "";
    };
    $("#abrirFiltros").addEventListener("click", () => abrir("true"));
    btnCerrar.addEventListener("click", () => abrir("false"));
    velo.addEventListener("click", () => abrir("false"));

    document.addEventListener("favoritos:cambio", () => { if (estado.favoritos) pintar(); });
    document.addEventListener("modo:cambio", pintar);
  }

  /* -------------------------------------------------------------- Arranque */
  pintarFiltros();
  pintarEncabezado();
  conectarEventos();
  pintar();
})();
