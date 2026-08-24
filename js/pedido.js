/* ======================= FINALIZAR PEDIDO (checkout) ====================== */
(function () {
  "use strict";
  const { $, $$, esc, precio, CFG, MAY, Modo, Carrito, colorPorSlug, linkWsp, aviso,
          PAGO, bloqueCuentas, activarCopiar, bloqueCalculadora } = window.T;

  window.T.iniciar("pedido");
  document.title = `Finalizar pedido · ${CFG.marca.nombre} ${CFG.marca.nombreAcento}`;

  const form = $("#formPedido");
  const vacio = $("#pedidoVacio");

  $("#textoEnvio").textContent = Carrito.envioACargoDelComprador()
    ? `${CFG.envio.demoraEstandar} · el costo del envío lo abona el comprador`
    : `${CFG.envio.demoraEstandar} · costo ${precio(CFG.envio.costoEnvioEstandar)}`;
  $("#textoRetiro").textContent = `${CFG.envio.textoRetiro} · ${CFG.contacto.direccion}`;
  $("#transporte").innerHTML = CFG.envio.transportes
    .map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join("");
  $("#calcEnvio").innerHTML = bloqueCalculadora();

  /* -------------------------------------------- Aviso de compra mínima */
  function pintarAvisoMayorista() {
    const caja = $("#avisoMayorista");
    $("#camposComercio").hidden = !Modo.esMayorista();

    const falta = Carrito.faltaParaMinimo();
    const bajo = Carrito.articulosBajoMinimo();
    const min = Carrito.compraMinima();
    const etiqueta = Modo.esMayorista() ? "por mayor" : "por menor";

    if (falta > 0) {
      caja.innerHTML = `<div class="aviso-minimo">
        <strong>Todavía no llegás a la compra mínima ${etiqueta}</strong>
        El mínimo es ${precio(min)} y te faltan ${precio(falta)}.
        <a href="catalogo.html" style="text-decoration:underline">Seguir comprando</a></div>`;
    } else if (bajo.length) {
      caja.innerHTML = `<div class="aviso-minimo">
        <strong>Cantidades por debajo del mínimo</strong>
        Estos artículos necesitan al menos ${MAY.unidadesMinimas} unidades:
        ${bajo.map((i) => esc(i.nombre)).join(", ")}.</div>`;
    } else if (min > 0) {
      caja.innerHTML = `<div class="aviso-minimo aviso-minimo--ok">
        <strong>Pedido habilitado ✓</strong>
        Superás la compra mínima ${etiqueta} de ${precio(min)}.</div>`;
    } else {
      caja.innerHTML = "";
    }
  }

  /* ------------------------------------------------------------- Resumen */
  function pintarResumen() {
    if (!Carrito.items.length) {
      form.hidden = true; vacio.hidden = false;
      return;
    }
    form.hidden = false; vacio.hidden = true;

    $("#resumenItems").innerHTML = Carrito.items.map((i) => `
      <div class="fila-total" style="align-items:flex-start;gap:1rem">
        <span>
          ${i.cantidad}× ${esc(i.nombre)}<br>
          <small style="color:var(--c-gris)">(${esc(i.codigo || "")}) Talle ${esc(i.talle)} · ${esc(colorPorSlug(i.color).nombre)}</small>
        </span>
        <strong style="white-space:nowrap">${precio(i.precio * i.cantidad)}</strong>
      </div>`).join("");

    const retiro = form.entrega && form.entrega.value === "retiro";
    const envio = retiro ? 0 : Carrito.costoEnvio();
    const total = Carrito.subtotal() + envio;
    const aCargo = Carrito.envioACargoDelComprador() && !retiro;

    $("#resumenTotales").innerHTML = `
      <div class="fila-total" style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--c-linea)">
        <span>Modalidad</span><strong>${esc(Modo.etiqueta())}</strong>
      </div>
      <div class="fila-total"><span>Unidades</span><strong>${Carrito.unidades()}</strong></div>
      <div class="fila-total"><span>Subtotal</span><strong>${precio(Carrito.subtotal())}</strong></div>
      <div class="fila-total">
        <span>${retiro ? "Retiro en el local" : "Envío"}</span>
        <strong>${esc(Carrito.textoEnvio(retiro))}</strong>
      </div>
      <div class="fila-total fila-total--grande">
        <span>${aCargo ? "Total mercadería" : "Total"}</span><span>${precio(total)}</span>
      </div>
      <p style="font-size:var(--t-xs);color:var(--c-tinta-suave)">
        O ${CFG.cuotas.cantidad} cuotas de ${precio(total / CFG.cuotas.cantidad)}
        ${aCargo ? "<br>El envío se cotiza y se abona aparte, según el transporte que elijas." : ""}
      </p>`;

    pintarAvisoMayorista();
    $("#btnEnviar").disabled = !Carrito.puedeCerrar();
  }

  /* ------------------------------------------------------- Envío / retiro */
  function alternarEntrega() {
    const retiro = form.entrega.value === "retiro";
    $("#camposEnvio").hidden = retiro;
    ["direccion", "localidad", "cp"].forEach((n) => { form[n].required = !retiro; });
    pintarResumen();
  }
  $$('input[name="entrega"]').forEach((r) => r.addEventListener("change", alternarEntrega));

  /* ------------------------------------------------------------ Validación */
  function marcar(campo, ok) {
    campo.closest(".campo").classList.toggle("campo--error", !ok);
    return ok;
  }

  function validar() {
    let ok = true;
    ok = marcar(form.nombre, form.nombre.value.trim().length >= 2) && ok;
    ok = marcar(form.telefono, form.telefono.value.replace(/\D/g, "").length >= 8) && ok;
    ok = marcar(form.email, !form.email.value || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.value)) && ok;
    if (form.entrega.value === "envio") {
      ok = marcar(form.direccion, form.direccion.value.trim().length >= 5) && ok;
      ok = marcar(form.localidad, form.localidad.value.trim().length >= 2) && ok;
      ok = marcar(form.cp, form.cp.value.trim().length >= 4) && ok;
    }
    return ok;
  }

  ["nombre", "telefono", "email", "direccion", "localidad", "cp"].forEach((n) => {
    form[n].addEventListener("blur", () => { if (form[n].value) validar(); });
  });

  /* --------------------------------------------------------------- Envío */
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!Carrito.items.length) { aviso("Tu carrito está vacío"); return; }

    if (!Carrito.puedeCerrar()) {
      aviso(`Falta llegar a la compra mínima de ${precio(Carrito.compraMinima())}`);
      $("#avisoMayorista").scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!validar()) {
      aviso("Revisá los campos marcados");
      const primero = $(".campo--error input, .campo--error textarea");
      if (primero) primero.focus();
      return;
    }

    const retiro = form.entrega.value === "retiro";
    const datos = {
      nombre: form.nombre.value.trim(),
      empresa: Modo.esMayorista() ? form.empresa.value.trim() : "",
      cuit: Modo.esMayorista() ? form.cuit.value.trim() : "",
      telefono: form.telefono.value.trim(),
      email: form.email.value.trim(),
      entrega: retiro ? "Retiro en el local" : "Envío a domicilio",
      transporte: retiro ? "" : form.transporte.value,
      direccion: retiro ? "" : form.direccion.value.trim(),
      localidad: retiro ? "" : `${form.localidad.value.trim()} (CP ${form.cp.value.trim()})`,
      notas: form.notas.value.trim()
    };

    const total = precio(Carrito.subtotal());
    const texto = Carrito.textoPedido(datos);

    window.open(linkWsp(texto), "_blank", "noopener");
    aviso("Abrimos WhatsApp. ¡Acordate de tocar enviar!");
    enviarCopia(datos, texto);
    mostrarPanelPago(datos, total, texto);
  });

  /* ------------------------------------------- Copia del pedido por email
     Solo si cargaste una URL en config.js → notificaciones.copiaPorEmail.
     Sirve de red de seguridad: si el cliente no toca "enviar" en WhatsApp,
     el pedido igual te llega al correo.                                   */
  function enviarCopia(datos, texto) {
    const url = (CFG.notificaciones || {}).copiaPorEmail;
    if (!url) return;
    try {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify({
          asunto: `Nuevo pedido ${Modo.esMayorista() ? "MAYORISTA" : "MINORISTA"} — ${datos.nombre}`,
          cliente: datos.nombre,
          telefono: datos.telefono,
          email: datos.email,
          entrega: datos.entrega,
          direccion: `${datos.direccion} ${datos.localidad}`.trim(),
          unidades: Carrito.unidades(),
          total: Carrito.subtotal(),
          pedido: texto
        })
      }).catch(() => { /* si falla, el pedido igual va por WhatsApp */ });
    } catch (e) { /* sin conexión: no bloqueamos al cliente */ }
  }

  /* --------------------------------------------- Paso 3: pagar el pedido */
  function mostrarPanelPago(datos, total, texto) {
    const panel = $("#panelPago");
    if (!panel) return;

    const msjPagado =
      `¡Hola! Soy *${datos.nombre}*.\n` +
      `Ya transferí *${total}* por mi pedido.\n` +
      `Te adjunto el comprobante 👇`;

    panel.innerHTML = `
      <h2>Paso 1 de 2 · Pedido enviado</h2>
      <p>Se abrió WhatsApp con tu pedido escrito.
         <strong>Si todavía no lo mandaste, volvé a WhatsApp y tocá enviar</strong>,
         porque si no, no nos llega.</p>

      <div class="panel-pago__botones" style="margin-bottom:1.5rem">
        <a class="btn btn--linea btn--chico" target="_blank" rel="noopener"
           href="${linkWsp(texto)}">Volver a abrir WhatsApp</a>
        <button class="btn btn--linea btn--chico" type="button" data-copiar="${esc(texto)}">
          Copiar el pedido
        </button>
      </div>

      <h2>Paso 2 de 2 · Pagá para reservar</h2>
      <p>Elegí cómo pagar <strong>${total}</strong>.
         La mercadería queda reservada 24 h.</p>

      <!-- ============ PAGAR CON TARJETA (Mercado Pago) ============ -->
      <div style="margin-bottom:1.5rem;padding:1.25rem;border:2px solid var(--c-acento, #007bff);border-radius:8px;background:var(--c-fondo-alt, #f8f9fa)">
        <h3 style="margin:0 0 .5rem;font-size:var(--t-base)">Pagar con tarjeta de crédito o débito</h3>
        <p style="font-size:var(--t-sm);color:var(--c-tinta-suave);margin:0 0 1rem">
          Pagás de forma segura a través de Mercado Pago. Aceptamos todas las tarjetas y hasta
          ${CFG.cuotas.cantidad} cuotas.</p>
        <button class="btn btn--principal" type="button" id="btnPagarTarjeta"
                style="width:100%;font-size:var(--t-base)">
          Pagar con tarjeta · ${total}
        </button>
        <p id="errorMP" style="color:#c0392b;font-size:var(--t-xs);margin:.5rem 0 0;display:none"></p>
      </div>

      <!-- ============ TRANSFERENCIA (existente) ============ -->
      <details style="margin-bottom:1.5rem">
        <summary style="cursor:pointer;font-weight:600;font-size:var(--t-base);padding:.75rem 0">
          O transferí a nuestras cuentas
        </summary>
        <div style="padding-top:.5rem">
          ${PAGO.cuentas && PAGO.cuentas.length ? bloqueCuentas() : ""}
        </div>
      </details>

      <!-- Enviar el pedido con fotos + el comprobante -->
      <div class="enviar-comprobante">
        <h3>Mandanos el comprobante</h3>
        <p class="enviar-comprobante__ayuda">
          Te preparamos una <strong>imagen con tu pedido completo</strong>: la foto,
          el modelo, el talle y el color de cada prenda. Adjuntá el comprobante y
          mandá las dos cosas juntas.
        </p>

        <label class="campo-archivo" for="comprobante">
          <span class="campo-archivo__icono">📎</span>
          <span class="campo-archivo__texto" id="nombreComprobante">
            Tocá para adjuntar el comprobante (foto o PDF)
          </span>
          <input type="file" id="comprobante" accept="image/*,application/pdf">
        </label>

        <div class="panel-pago__botones">
          <button class="btn btn--wsp" type="button" id="btnEnviarTodo">
            Enviar pedido y comprobante
          </button>
          <button class="btn btn--linea" type="button" id="btnVerResumen">
            Ver / descargar el resumen
          </button>
        </div>
        <p class="enviar-comprobante__nota" id="notaEnvio"></p>
      </div>

      <div class="panel-pago__botones">
        <a class="btn btn--linea btn--chico" target="_blank" rel="noopener" href="${linkWsp(msjPagado)}">
          Solo avisar por WhatsApp
        </a>
        <a class="btn btn--linea btn--chico" href="catalogo.html">Seguir comprando</a>
      </div>`;

    panel.hidden = false;
    activarCopiar(panel);
    conectarComprobante(datos, msjPagado);
    conectarMercadoPago(datos);
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ----------------------------------------- Pago con tarjeta (Mercado Pago) */
  async function conectarMercadoPago(datos) {
    const btn = $("#btnPagarTarjeta");
    const errorEl = $("#errorMP");
    if (!btn) return;

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      btn.textContent = "Conectando con Mercado Pago…";
      errorEl.style.display = "none";

      /* Armar los items en el formato que espera la API */
      const items = Carrito.items.map((i) => ({
        title:       i.nombre + " — Talle " + i.talle + " — " + colorPorSlug(i.color).nombre,
        description: "Código " + (i.codigo || i.id),
        quantity:    i.cantidad,
        unit_price:  i.precio
      }));

      const payer = {};
      if (datos.nombre) payer.name = datos.nombre.split(" ")[0];
      if (datos.nombre) payer.surname = datos.nombre.split(" ").slice(1).join(" ") || "";
      if (datos.email)  payer.email = datos.email;

      try {
        const resp = await fetch("/api/crear-preferencia", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: items,
            payer: payer,
            external_reference: datos.nombre + " — " + datos.telefono
          })
        });

        const data = await resp.json();

        if (!resp.ok) {
          throw new Error(data.error || "Error al conectar con Mercado Pago");
        }

        /* Redirigir al checkout de Mercado Pago */
        window.location.href = data.init_point;

      } catch (err) {
        errorEl.textContent = err.message || "No se pudo conectar con Mercado Pago. Probá de nuevo o pagá por transferencia.";
        errorEl.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Pagar con tarjeta · " + precio(Carrito.subtotal());
      }
    });
  }

  /* ------------------------------------- Envío del pedido con fotos ----- */
  function conectarComprobante(datos, msjPagado) {
    const input = $("#comprobante");
    const nombre = $("#nombreComprobante");
    const nota = $("#notaEnvio");
    let archivo = null;

    /* Aviso según lo que permita el dispositivo */
    const puedeCompartir = window.ResumenPedido &&
      window.ResumenPedido.puedeCompartirArchivos([new File([""], "x.png", { type: "image/png" })]);

    nota.innerHTML = puedeCompartir
      ? "Se abre el menú de compartir de tu celular: elegí <strong>WhatsApp</strong> y " +
        "después nuestro contacto. Van la imagen del pedido y el comprobante juntos."
      : "En la computadora el resumen se <strong>descarga como imagen</strong>. " +
        "Después abrí WhatsApp y adjuntala junto con el comprobante.";

    input.addEventListener("change", () => {
      archivo = input.files && input.files[0] ? input.files[0] : null;
      if (!archivo) { nombre.textContent = "Tocá para adjuntar el comprobante (foto o PDF)"; return; }
      const mb = (archivo.size / 1024 / 1024).toFixed(1);
      nombre.innerHTML = `✅ <strong>${esc(archivo.name)}</strong> (${mb} MB)`;
    });

    $("#btnEnviarTodo").addEventListener("click", async () => {
      const btn = $("#btnEnviarTodo");
      btn.disabled = true;
      btn.textContent = "Preparando…";
      try {
        const r = await window.ResumenPedido.compartirPedido(datos, archivo);
        if (r.via === "compartir") {
          aviso("Elegí WhatsApp en el menú de compartir");
        } else if (r.via === "descarga") {
          aviso("Resumen descargado. Ahora abrimos WhatsApp");
          setTimeout(() => window.open(linkWsp(msjPagado), "_blank", "noopener"), 900);
        } else if (r.motivo === "cancelado") {
          aviso("Envío cancelado");
        }
      } catch (e) {
        aviso("No se pudo generar el resumen. Escribinos por WhatsApp");
      }
      btn.disabled = false;
      btn.textContent = "Enviar pedido y comprobante";
    });

    $("#btnVerResumen").addEventListener("click", async () => {
      const blob = await window.ResumenPedido.generarImagenPedido(datos);
      if (!blob) { aviso("El carrito está vacío"); return; }
      window.ResumenPedido.descargarBlob(blob, "resumen-pedido.png");
      aviso("Resumen descargado ✓");
    });
  }

  /* ----------------------------------------- Mostrar datos de pago en el checkout */
  const cajaPago = $("#datosPago");
  if (cajaPago && PAGO.cuentas && PAGO.cuentas.length) {
    cajaPago.innerHTML = `
      <h3 class="opcion__label" style="margin-bottom:.75rem">Datos para pagar</h3>
      <p style="font-size:var(--t-sm);color:var(--c-tinta-suave);margin-bottom:1rem">
        Transferí a cualquiera de estas cuentas y mandanos el comprobante por WhatsApp.</p>
      ${bloqueCuentas()}`;
    activarCopiar(cajaPago);
  }

  document.addEventListener("carrito:cambio", pintarResumen);
  document.addEventListener("modo:cambio", pintarResumen);
  alternarEntrega();
  pintarResumen();
})();
