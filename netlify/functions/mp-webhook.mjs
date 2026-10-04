// O Mercado Pago avisa aqui quando um pagamento muda de status.
// Confirmamos o pagamento direto na API deles (não confiamos no que chega) e avisamos a loja no WhatsApp.
import { getStore } from "@netlify/blobs";
import { PADRAO } from "./lib/padrao.mjs";
import { avisoLoja, enviarWhatsApp } from "./lib/notificar.mjs";

export default async (req) => {
  const url = new URL(req.url);
  let body = {};
  try { body = await req.json(); } catch {}
  const tipo = body.type || url.searchParams.get("type") || url.searchParams.get("topic");
  const payId = body.data?.id || url.searchParams.get("data.id") || url.searchParams.get("id");
  if (tipo !== "payment" || !payId) return new Response("ok");

  const r = await fetch("https://api.mercadopago.com/v1/payments/" + encodeURIComponent(payId), {
    headers: { Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN },
  });
  if (!r.ok) return new Response("erro", { status: 500 }); // o Mercado Pago tenta de novo
  const pay = await r.json();

  const ped = getStore("pedidos");
  const o = pay.external_reference ? await ped.get(pay.external_reference, { type: "json" }) : null;
  if (!o) return new Response("ok");

  if (pay.status === "approved" && o.status !== "pago") {
    o.status = "pago";
    o.pagoEm = new Date().toISOString();
    o.pagamento = { id: pay.id, metodo: pay.payment_method_id };
    await ped.setJSON(o.id, o); // grava antes de avisar para não duplicar a mensagem
    const cfg = (await getStore("loja").get("config", { type: "json" })) ?? PADRAO;
    await enviarWhatsApp(cfg.loja?.whatsapp, avisoLoja(o, pay));
  } else if (["pending", "in_process"].includes(pay.status) && o.status === "aguardando") {
    o.status = "pendente"; await ped.setJSON(o.id, o);
  } else if (["rejected", "cancelled"].includes(pay.status) && o.status !== "pago") {
    o.status = "recusado"; await ped.setJSON(o.id, o);
  }
  return new Response("ok");
};

export const config = { path: "/api/mp-webhook" };
