/* ==================== PÁGINAS "ANTES DE COMPRAR" ========================= */
(function () {
  "use strict";
  const { $, esc, precio, CFG, MAY, MIN, paramURL, linkWsp, TEMAS_INFO,
          LOCAL, linkMapa, mapaHTML,
          bloqueMediosPago, bloqueCuentas, activarCopiar, bloqueCalculadora,
          bloqueComoEnviamos, bloqueComoComprar } = window.T;

  window.T.iniciar("info");

  const C = CFG.contacto, E = CFG.envio;

  /* --------------------------------------------------------------------
     Los textos de cada página están acá. Editalos libremente: aceptan
     HTML simple (<p>, <ul>, <ol>, <h2>, <strong>).
     -------------------------------------------------------------------- */
  const CONTENIDO = {

    "como-comprar": `
      <h1>Cómo comprar</h1>

      ${bloqueComoComprar()}

      <h2 style="margin-top:3rem">Un par de datos más</h2>
      <ul>
        <li><strong>No hace falta registrarse.</strong> Elegís, completás tus datos y listo.</li>
        <li>Arriba a la derecha tenés el selector <em>Por menor</em> / <em>Por mayor</em>:
            los precios de toda la tienda cambian al instante.</li>
        <li>Podés buscar por <strong>código de artículo</strong> además de por nombre.</li>
        <li>El carrito queda guardado aunque cierres el navegador.</li>
        <li>El carrito te avisa cuánto falta para llegar a la compra mínima,
            así no te quedás a mitad de camino.</li>
      </ul>

      <h2>¿Necesitás ayuda?</h2>
      <p>Escribinos por WhatsApp al <a href="${linkWsp(C.mensajeInicial)}" target="_blank" rel="noopener">${esc(C.telefonoVisible)}</a>.
         ${esc(C.horarios)}, con atención personalizada.</p>`,

    "mayorista": `
      <h1>Comprar por mayor</h1>
      <p>Trabajamos con revendedores de todo el país. No hace falta registro ni aprobación:
         activás la modalidad <strong>Por mayor</strong> arriba y ya ves todos los precios mayoristas.</p>
      <h2>Condiciones</h2>
      <ul>
        <li><strong>Compra mínima:</strong> ${precio(MAY.compraMinima)} por pedido.</li>
        <li><strong>Cantidad mínima por artículo:</strong> ${MAY.unidadesMinimas} unidades.
            Podés combinar talles y colores dentro del mismo artículo.</li>
        <li>El precio mayorista figura en cada producto, debajo del precio por menor.</li>
        <li>Los descuentos por temporada no se acumulan con el precio mayorista.</li>
      </ul>
      <h2>Facturación</h2>
      <p>Emitimos factura B por defecto. Si necesitás factura A, cargá tu CUIT en el formulario
         de pedido y te la preparamos.</p>
      <h2>Reposición</h2>
      <p>Ingresan modelos nuevos todas las semanas. Si querés que te avisemos de los ingresos,
         escribinos por WhatsApp y te sumamos a la lista de difusión.</p>`,

    "envios": `
      <h1>¿Cómo funcionan los envíos? 📦</h1>

      ${bloqueComoEnviamos()}

      <h2 style="margin-top:3rem">Otros transportes</h2>
      <p>Además de Correo Argentino y Vía Cargo, también despachamos por:</p>
      <ul>${E.transportes.filter((t) => !/correo argentino|vía cargo/i.test(t))
              .map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      <p>La demora estimada por Correo Argentino es de <strong>${esc(E.demoraEstandar)}</strong>
         desde que se despacha.</p>
      <h2>Costo del envío</h2>
      <p><strong>El costo del envío queda a cargo del comprador.</strong> No lo cobramos
         desde la web: el total que ves en el carrito es solo la mercadería.</p>

      ${bloqueCalculadora()}
      <p style="font-size:var(--t-xs)">Ese link abre la tarifa oficial de Correo Argentino
         (Encomienda Clásica): el precio va por peso, hasta 25 kg, con entrega a domicilio.
         Ahí podés estimar cuánto te va a salir antes de hacer el pedido.</p>
      <ul>
        <li>Cuando confirmamos tu pedido por WhatsApp te pasamos el costo del envío
            según el transporte que elijas y la localidad de destino.</li>
        <li>En Correo Argentino y Andreani el envío se abona al despachar o al recibir,
            según la modalidad.</li>
        <li>Los envíos por transporte de cargo se abonan al retirar en la terminal.</li>
        <li><strong>${esc(E.textoRetiro)}</strong> en ${esc(C.direccion)}: si retirás por
            el local, no pagás envío.</li>
      </ul>
      <h2>Despacho</h2>
      <p><strong>Despachamos encomiendas todos los días por Correo Argentino.</strong>
         Si tu pedido queda confirmado y pago dentro del horario de atención
         (${esc(C.horarios.toLowerCase())}), sale ese mismo día.</p>

      <h2>Seguimiento</h2>
      <p>Apenas despachamos te mandamos el número de seguimiento por WhatsApp.
         Los envíos por transporte de cargo se abonan al retirar en la terminal.</p>`,

    "medios-pago": `
      <h1>Medios de pago</h1>
      <p>Aceptamos tarjeta de crédito, tarjeta de débito, transferencia bancaria,
         Mercado Pago y efectivo en el local.</p>

      ${bloqueMediosPago()}

      <h2>Datos para transferir</h2>
      <p>Podés transferir a cualquiera de estas dos cuentas. Tocá <strong>Copiar</strong>
         y pegalo en el homebanking o en la app.</p>

      ${bloqueCuentas()}

      <h2>Cómo pagar, paso a paso</h2>
      <ol>
        <li>Armá tu pedido y tocá <strong>Finalizar pedido</strong>.</li>
        <li>Se abre WhatsApp con el detalle. Te confirmamos stock y el total final
            (mercadería + envío).</li>
        <li>Transferí a una de las cuentas de arriba.</li>
        <li><strong>Mandanos el comprobante por WhatsApp.</strong> Sin comprobante no
            podemos despachar.</li>
        <li>Preparamos el pedido y te pasamos el seguimiento.</li>
      </ol>

      <h2>Cuotas</h2>
      <p>${CFG.cuotas.cantidad} cuotas ${CFG.cuotas.sinInteres ? "sin interés" : "con interés"}
         con tarjetas de crédito de bancos adheridos. Las tarjetas se abonan en el local
         o por link de pago que te enviamos por WhatsApp.</p>

      <h2>Importante</h2>
      <p>La web <strong>no cobra en línea</strong>: no te pide datos de tarjeta en ningún
         momento. Toda la operación se cierra por WhatsApp, así podés confirmar el stock
         real antes de pagar.</p>
      <p>Nunca te vamos a pedir claves, códigos de seguridad ni el PIN de tu tarjeta.
         Si recibís un mensaje pidiéndote eso, no es nuestro.</p>`,

    "cambios": `
      <h1>Cambios y devoluciones</h1>
      <p>${esc(CFG.info.cambios)}</p>
      <h2>Condiciones</h2>
      <ul>
        <li>La prenda tiene que estar sin uso, sin lavar y con su etiqueta original.</li>
        <li>Se cambia por otro talle, otro modelo o queda como crédito a favor.</li>
        <li>Los costos de envío del cambio corren por cuenta del comprador,
            salvo que se trate de una falla de fabricación.</li>
        <li>Los artículos de ropa interior y accesorios de higiene no tienen cambio.</li>
      </ul>
      <h2>Fallas de fabricación</h2>
      <p>Si la prenda tiene una falla, mandanos una foto por WhatsApp dentro de los 7 días
         de recibida y nos hacemos cargo del cambio y del envío.</p>
      <h2>Derecho de arrepentimiento</h2>
      <p>Según la Ley 24.240, en compras a distancia tenés 10 días corridos desde que recibís
         el producto para arrepentirte de la compra, sin costo alguno.</p>`,

    "preguntas": `
      <h1>Preguntas frecuentes</h1>
      <h2>¿Tengo que registrarme para comprar?</h2>
      <p>No. Elegís los productos, completás tus datos y listo.</p>
      <h2>¿Cuál es la diferencia entre por menor y por mayor?</h2>
      <p>Por menor comprás desde 1 unidad al precio de lista, con una compra mínima de
         ${precio(MIN.compraMinima)}. Por mayor accedés a precios más bajos, con un mínimo de
         ${MAY.unidadesMinimas} unidades por artículo y ${precio(MAY.compraMinima)} de pedido mínimo.</p>

      <h2>¿Hay compra mínima?</h2>
      <p>Sí: ${precio(MIN.compraMinima)} por menor y ${precio(MAY.compraMinima)} por mayor.
         El carrito te muestra en todo momento cuánto falta para alcanzarla.</p>

      <h2>¿Cuándo despachan?</h2>
      <p>Todos los días por Correo Argentino.</p>

      <h2>¿Qué horario de atención tienen?</h2>
      <p>${esc(C.horarios)}. La atención es personalizada, por WhatsApp o en el local.</p>
      <h2>¿La ropa es unisex de verdad?</h2>
      <p>Sí. Todos nuestros moldes están pensados para cualquier cuerpo. En cada ficha
         tenés la tabla de medidas en centímetros para elegir bien el talle.</p>
      <h2>¿Los colores de las fotos son fieles?</h2>
      <p>Fotografiamos siempre con la misma luz, pero puede haber diferencias mínimas
         según la pantalla. Ante la duda, consultanos.</p>
      <h2>¿Hacen envíos al exterior?</h2>
      <p>Por ahora solo enviamos dentro de Argentina.</p>
      <h2>¿Puedo ver la ropa antes de comprar?</h2>
      <p>Sí, te esperamos en ${esc(C.direccion)}, ${esc(C.horarios)}.</p>`,

    "nosotros": `
      <h1>Nuestro local</h1>
      <p>${esc(CFG.marca.descripcion)}</p>

      <h2>Dónde estamos</h2>
      <p>
        <strong>${esc(LOCAL.calle)}</strong>${LOCAL.entreCalles ? ` — ${esc(LOCAL.entreCalles)}` : ""}<br>
        ${esc(LOCAL.localidad)}, ${esc(LOCAL.provincia)}<br>
        ${esc(C.horarios)}
      </p>

      ${mapaHTML("mapa--alto")}

      <p style="margin-top:1.5rem">
        <a class="btn btn--principal" href="${linkMapa()}" target="_blank" rel="noopener">Cómo llegar</a>
        <a class="btn btn--wsp" href="${linkWsp(C.mensajeInicial)}" target="_blank" rel="noopener">Escribinos por WhatsApp</a>
      </p>

      <h2>Contacto</h2>
      <p>
        WhatsApp: <a href="${linkWsp(C.mensajeInicial)}" target="_blank" rel="noopener">${esc(C.telefonoVisible)}</a><br>
        Email: <a href="mailto:${esc(C.email)}">${esc(C.email)}</a><br>
        ${CFG.redes.instagram ? `Instagram: <a href="${esc(CFG.redes.instagram)}" target="_blank" rel="noopener">@luz_indumentaria.a</a><br>` : ""}
        ${CFG.redes.tiktok ? `TikTok: <a href="${esc(CFG.redes.tiktok)}" target="_blank" rel="noopener">@luzindumentaria3</a>` : ""}
      </p>

      <h2>Cómo trabajamos</h2>
      <p>Trabajamos con indumentaria unisex para todos los cuerpos. Renovamos modelos
         todas las semanas y reponemos los básicos que más se venden. Vendemos por mayor
         y por menor, y enviamos a todo el país.</p>`
  };

  /* -------------------------------------------------------------- Pintado */
  const tema = paramURL("tema") || "como-comprar";
  const actual = TEMAS_INFO.find((t) => t.slug === tema) || TEMAS_INFO[0];

  $("#infoMenu").innerHTML = TEMAS_INFO.map((t) =>
    `<a href="info.html?tema=${t.slug}" ${t.slug === actual.slug ? 'aria-current="page"' : ""}>${esc(t.titulo)}</a>`).join("");

  $("#infoCuerpo").innerHTML = CONTENIDO[actual.slug] || CONTENIDO["como-comprar"];
  activarCopiar($("#infoCuerpo"));

  $("#miga").innerHTML =
    `<a href="index.html">Inicio</a><span>/</span>Antes de comprar<span>/</span>${esc(actual.titulo)}`;

  document.title = `${actual.titulo} · ${CFG.marca.nombre} ${CFG.marca.nombreAcento}`;
})();
