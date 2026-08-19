/* ==========================================================================
   RESUMEN DEL PEDIDO EN IMAGEN
   --------------------------------------------------------------------------
   Un link de WhatsApp (wa.me) solo puede llevar TEXTO. No existe forma de
   adjuntarle archivos desde una página web.

   La solución real es esta: el navegador dibuja una imagen con el pedido
   completo — foto, modelo, talle, color y cantidad de cada prenda — y después:

     · En el celular  → se comparte directo a WhatsApp junto con el
                        comprobante, usando la función de compartir del
                        sistema (Web Share API).
     · En la compu    → se descarga la imagen para adjuntarla a mano.

   Así al vendedor le llega el pedido con las fotos, no solo el texto.
   ========================================================================== */
(function () {
  "use strict";

  const T = window.T;
  const CFG = T.CFG;

  const ANCHO = 1000;
  const MARGEN = 44;
  const FOTO_W = 96;
  const FOTO_H = 128;
  const ALTO_CAJA = FOTO_H + 28;        // la foto tiene que entrar entera
  const ALTO_ITEM = ALTO_CAJA + 14;     // + separación entre prendas

  const C = {
    tinta:  "#453714",
    suave:  "#6B5620",
    gris:   "#7A6428",
    oro:    "#C9A227",
    oroSuave: "#F2E7C4",
    linea:  "#E8DFC8",
    fondo:  "#FFFFFF",
    fondoAlt: "#FAF7EF",
    acento: "#8A6A14"
  };

  /* Carga una imagen. Si falla o no existe, devuelve null (no rompe nada). */
  function cargarImagen(src) {
    return new Promise((resolve) => {
      if (!src) return resolve(null);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = src;
      // Si tarda demasiado, seguimos sin foto
      setTimeout(() => resolve(img.complete && img.naturalWidth ? img : null), 4000);
    });
  }

  /* Corta un texto para que entre en un ancho dado */
  function recortar(ctx, texto, maxAncho) {
    if (ctx.measureText(texto).width <= maxAncho) return texto;
    let t = texto;
    while (t.length > 1 && ctx.measureText(t + "…").width > maxAncho) t = t.slice(0, -1);
    return t + "…";
  }

  /* Dibuja la foto de la prenda, o un recuadro con el código si no hay */
  function dibujarFoto(ctx, img, x, y, codigo) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, FOTO_W, FOTO_H, 6);
    ctx.clip();

    if (img) {
      // "cover": llena el recuadro sin deformar la prenda
      const escala = Math.max(FOTO_W / img.width, FOTO_H / img.height);
      const w = img.width * escala, h = img.height * escala;
      ctx.drawImage(img, x + (FOTO_W - w) / 2, y + (FOTO_H - h) / 2, w, h);
    } else {
      ctx.fillStyle = C.fondoAlt;
      ctx.fillRect(x, y, FOTO_W, FOTO_H);
      ctx.fillStyle = C.gris;
      ctx.font = "600 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SIN FOTO", x + FOTO_W / 2, y + FOTO_H / 2 - 6);
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillStyle = C.tinta;
      ctx.fillText(String(codigo || ""), x + FOTO_W / 2, y + FOTO_H / 2 + 14);
      ctx.textAlign = "left";
    }
    ctx.restore();

    ctx.strokeStyle = C.linea;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x + .5, y + .5, FOTO_W - 1, FOTO_H - 1, 6);
    ctx.stroke();
  }

  /* ---------------------------------------------------------------------
     Genera la imagen del pedido y devuelve un Blob PNG
     --------------------------------------------------------------------- */
  async function generarImagenPedido(datos) {
    const items = T.Carrito.items;
    if (!items.length) return null;

    // Precargamos las fotos de las prendas
    const fotos = await Promise.all(items.map((i) => cargarImagen(i.imagen)));

    const altoCabecera = 190;
    const altoDatos = datos ? 132 : 0;
    const altoTotales = 112;
    const altoPie = 56;
    const alto = altoCabecera + altoDatos + items.length * ALTO_ITEM + altoTotales + altoPie;

    const canvas = document.createElement("canvas");
    const dpr = 2;                       // el doble de resolución: se lee nítido
    canvas.width = ANCHO * dpr;
    canvas.height = alto * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    // roundRect no existe en navegadores viejos
    if (!ctx.roundRect) {
      ctx.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); return this; };
    }

    /* --- Fondo --- */
    ctx.fillStyle = C.fondo;
    ctx.fillRect(0, 0, ANCHO, alto);

    /* --- Cabecera --- */
    ctx.fillStyle = C.tinta;
    ctx.fillRect(0, 0, ANCHO, 8);

    let y = 58;
    ctx.fillStyle = C.tinta;
    ctx.font = "700 34px Georgia, serif";
    ctx.fillText(`${CFG.marca.nombre} ${CFG.marca.nombreAcento}`, MARGEN, y);

    ctx.fillStyle = C.acento;
    ctx.font = "700 15px system-ui, sans-serif";
    y += 30;
    ctx.fillText("RESUMEN DE PEDIDO", MARGEN, y);

    ctx.fillStyle = C.gris;
    ctx.font = "13px system-ui, sans-serif";
    const fecha = new Date().toLocaleString("es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    ctx.textAlign = "right";
    ctx.fillText(fecha, ANCHO - MARGEN, 58);
    ctx.fillText(T.Modo.esMayorista() ? "PEDIDO POR MAYOR" : "PEDIDO POR MENOR", ANCHO - MARGEN, 78);
    ctx.textAlign = "left";

    y += 26;
    ctx.strokeStyle = C.oro;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(MARGEN, y); ctx.lineTo(ANCHO - MARGEN, y); ctx.stroke();
    y += 34;

    /* --- Datos del cliente --- */
    if (datos) {
      ctx.fillStyle = C.fondoAlt;
      ctx.beginPath(); ctx.roundRect(MARGEN, y - 18, ANCHO - MARGEN * 2, 104, 8); ctx.fill();

      ctx.fillStyle = C.gris;
      ctx.font = "700 11px system-ui, sans-serif";
      ctx.fillText("CLIENTE", MARGEN + 18, y + 2);

      ctx.fillStyle = C.tinta;
      ctx.font = "600 16px system-ui, sans-serif";
      ctx.fillText(datos.nombre || "", MARGEN + 18, y + 24);

      ctx.fillStyle = C.suave;
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillText(`Tel: ${datos.telefono || ""}`, MARGEN + 18, y + 46);
      const entrega = datos.entrega + (datos.direccion ? ` · ${datos.direccion}` : "");
      ctx.fillText(recortar(ctx, entrega, ANCHO - MARGEN * 2 - 36), MARGEN + 18, y + 66);
      y += 118;
    }

    /* --- Prendas --- */
    ctx.fillStyle = C.gris;
    ctx.font = "700 11px system-ui, sans-serif";
    ctx.fillText("PRENDAS DEL PEDIDO", MARGEN, y);
    y += 16;

    items.forEach((it, idx) => {
      const top = y;

      ctx.strokeStyle = C.linea;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(MARGEN + .5, top + .5, ANCHO - MARGEN * 2 - 1, ALTO_CAJA, 8);
      ctx.stroke();

      dibujarFoto(ctx, fotos[idx], MARGEN + 14, top + 14, it.codigo);

      const tx = MARGEN + 14 + FOTO_W + 20;
      const anchoTexto = ANCHO - tx - MARGEN - 150;

      // Modelo (nombre) y código
      ctx.fillStyle = C.tinta;
      ctx.font = "700 18px system-ui, sans-serif";
      ctx.fillText(recortar(ctx, it.nombre, anchoTexto), tx, top + 40);

      ctx.fillStyle = C.gris;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText(`Modelo / código: ${it.codigo || "-"}`, tx, top + 62);

      // Talle y color, bien destacados
      const talle = `TALLE ${it.talle}`;
      ctx.font = "700 13px system-ui, sans-serif";
      const wTalle = ctx.measureText(talle).width + 22;
      ctx.fillStyle = C.tinta;
      ctx.beginPath(); ctx.roundRect(tx, top + 76, wTalle, 26, 5); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(talle, tx + 11, top + 94);

      const color = T.colorPorSlug(it.color);
      const xColor = tx + wTalle + 10;
      ctx.fillStyle = C.oroSuave;
      const wColor = ctx.measureText(color.nombre).width + 40;
      ctx.beginPath(); ctx.roundRect(xColor, top + 76, wColor, 26, 5); ctx.fill();
      ctx.fillStyle = color.hex;
      ctx.beginPath(); ctx.arc(xColor + 15, top + 89, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.linea; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.tinta;
      ctx.fillText(color.nombre, xColor + 28, top + 94);

      // Cantidad y precios, a la derecha
      ctx.textAlign = "right";
      const xd = ANCHO - MARGEN - 18;
      ctx.fillStyle = C.gris;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText(`${it.cantidad} u. × ${T.precio(it.precio)}`, xd, top + 44);
      ctx.fillStyle = C.acento;
      ctx.font = "700 22px system-ui, sans-serif";
      ctx.fillText(T.precio(it.precio * it.cantidad), xd, top + 76);
      ctx.textAlign = "left";

      y += ALTO_ITEM;
    });

    /* --- Totales --- */
    y += 6;
    ctx.fillStyle = C.fondoAlt;
    ctx.beginPath(); ctx.roundRect(MARGEN, y, ANCHO - MARGEN * 2, 112, 8); ctx.fill();
    ctx.strokeStyle = C.oro; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(MARGEN, y, ANCHO - MARGEN * 2, 112, 8); ctx.stroke();

    ctx.fillStyle = C.suave;
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`Unidades: ${T.Carrito.unidades()}`, MARGEN + 20, y + 32);
    ctx.fillText(`Envío: ${T.Carrito.textoEnvio(datos && /Retiro/.test(datos.entrega || ""))}`,
                 MARGEN + 20, y + 56);

    ctx.textAlign = "right";
    ctx.fillStyle = C.gris;
    ctx.font = "700 12px system-ui, sans-serif";
    ctx.fillText(T.Carrito.envioACargoDelComprador() ? "TOTAL MERCADERÍA" : "TOTAL",
                 ANCHO - MARGEN - 20, y + 34);
    ctx.fillStyle = C.tinta;
    ctx.font = "700 36px Georgia, serif";
    ctx.fillText(T.precio(T.Carrito.subtotal()), ANCHO - MARGEN - 20, y + 76);
    ctx.textAlign = "left";

    /* --- Pie --- */
    ctx.fillStyle = C.gris;
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillText(
      `${CFG.contacto.telefonoVisible} · ${CFG.contacto.direccion} · ${CFG.contacto.horarios}`,
      MARGEN, alto - 26);

    return new Promise((resolve) => canvas.toBlob(resolve, "image/png", 0.92));
  }

  /* ---------------------------------------------------------------------
     Descargar la imagen (respaldo para computadoras de escritorio)
     --------------------------------------------------------------------- */
  function descargarBlob(blob, nombre) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ---------------------------------------------------------------------
     ¿Se pueden compartir archivos a WhatsApp desde este dispositivo?
     Es la Web Share API nivel 2: existe en Android e iOS modernos.
     --------------------------------------------------------------------- */
  function puedeCompartirArchivos(archivos) {
    return !!(navigator.canShare && navigator.share && navigator.canShare({ files: archivos }));
  }

  async function compartirPedido(datos, comprobante) {
    const blob = await generarImagenPedido(datos);
    if (!blob) return { ok: false, motivo: "carrito-vacio" };

    const nombre = `pedido-${(datos && datos.nombre ? datos.nombre : "cliente")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
    const archivoPedido = new File([blob], nombre, { type: "image/png" });

    const archivos = [archivoPedido];
    if (comprobante) archivos.push(comprobante);

    if (puedeCompartirArchivos(archivos)) {
      try {
        await navigator.share({
          files: archivos,
          title: `Pedido ${CFG.marca.nombre}`,
          text: `Pedido de ${datos && datos.nombre ? datos.nombre : ""} — ` +
                `${T.Carrito.unidades()} unidades — ${T.precio(T.Carrito.subtotal())}` +
                (comprobante ? " (adjunto el comprobante)" : "")
        });
        return { ok: true, via: "compartir" };
      } catch (e) {
        if (e && e.name === "AbortError") return { ok: false, motivo: "cancelado" };
      }
    }

    // Respaldo: se descarga para adjuntar a mano
    descargarBlob(blob, nombre);
    return { ok: true, via: "descarga" };
  }

  window.ResumenPedido = {
    generarImagenPedido, descargarBlob, compartirPedido, puedeCompartirArchivos
  };
})();
