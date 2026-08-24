/* =====================================================================
   SERVERLESS FUNCTION — Crear preferencia de Mercado Pago
   =====================================================================
   Vercel ejecuta este archivo como endpoint:
     POST /api/crear-preferencia

   El frontend le manda los items del carrito, esta función llama a la
   API de Mercado Pago, crea una "preferencia" (sesión de pago) y
   devuelve la URL para que el cliente pague.

   REQUISITO: configurar la variable de entorno MP_ACCESS_TOKEN en Vercel.
   ===================================================================== */

module.exports = async (req, res) => {

  /* --- Solo POST ---------------------------------------------------- */
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido" });
  }

  /* --- Token de Mercado Pago ---------------------------------------- */
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) {
    return res.status(500).json({
      error: "Mercado Pago no está configurado. Falta la variable MP_ACCESS_TOKEN."
    });
  }

  /* --- Datos que manda el frontend ---------------------------------- */
  const { items, payer, external_reference } = req.body || {};

  if (!items || !items.length) {
    return res.status(400).json({ error: "No hay productos en el pedido." });
  }

  /* --- Armar la preferencia ----------------------------------------- */
  const origin = req.headers.origin ||
                 req.headers.referer && new URL(req.headers.referer).origin ||
                 "https://luzropaunisex.com.ar";

  const preferencia = {
    items: items.map((i) => ({
      title:       i.title       || "Producto",
      description: i.description || "",
      quantity:    Number(i.quantity) || 1,
      unit_price:  Number(i.unit_price) || 0,
      currency_id: "ARS"
    })),
    payer: payer || {},
    back_urls: {
      success: origin + "/pago-exitoso.html",
      failure: origin + "/pedido.html?pago=error",
      pending: origin + "/pedido.html?pago=pendiente"
    },
    auto_return: "approved",
    external_reference: external_reference || "",
    statement_descriptor: "LUZ INDUMENTARIA"
  };

  /* --- Llamar a la API de Mercado Pago ------------------------------ */
  try {
    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(preferencia)
    });

    const data = await resp.json();

    if (!resp.ok) {
      console.error("MP error:", JSON.stringify(data));
      return res.status(resp.status).json({
        error: data.message || "Error al crear la preferencia de pago"
      });
    }

    /* Devolvemos solo lo que necesita el frontend */
    return res.status(200).json({
      id:         data.id,
      init_point: data.init_point          /* URL de checkout en producción */
    });

  } catch (err) {
    console.error("Error interno:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
