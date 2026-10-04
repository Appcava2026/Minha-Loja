// Registra o pedido e cria o pagamento no Mercado Pago. Preços sempre vêm do servidor.
import { getStore } from "@netlify/blobs";
import { PADRAO } from "./lib/padrao.mjs";
import { resumoCliente } from "./lib/notificar.mjs";

export default async (req) => {
  if (req.method !== "POST") return new Response("Método não permitido", { status: 405 });
  try {
    const { itens, cliente } = await req.json();
    const cfg = (await getStore("loja").get("config", { type: "json" })) ?? PADRAO;
    const cli = { nome: String(cliente?.nome || "").trim().slice(0, 80), tel: String(cliente?.tel || "").replace(/\D/g, "").slice(0, 13) };
    if (cli.nome.length < 2 || cli.tel.length < 10) throw new Error("Informe seu nome e WhatsApp com DDD");
    const P = cfg.promo, agora = Date.now();
    const promoAtiva = !!P && P.ativa && agora >= new Date(P.inicio).getTime() && agora < new Date(P.fim).getTime();
    const lista = (itens || []).map((i) => {
      const p = cfg.produtos.find((x) => String(x.id) === String(i.id) && x.ativo !== false);
      if (!p) throw new Error("Produto indisponível");
      const unit = promoAtiva && p.promo !== false ? Math.round(p.preco * (100 - P.desconto)) / 100 : p.preco;
      return { id: p.id, nome: p.nome, qtd: Math.max(1, Math.min(20, parseInt(i.qtd) || 1)), unit };
    });
    if (!lista.length) throw new Error("Carrinho vazio");
    const total = Math.round(lista.reduce((s, i) => s + i.unit * i.qtd, 0) * 100) / 100;
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const pedido = { id, numero: id.slice(-5).toUpperCase(), criado: new Date().toISOString(), status: "aguardando", cliente: cli, itens: lista, total, promo: promoAtiva };
    await getStore("pedidos").setJSON(id, pedido);

    const site = new URL(req.url).origin;
    const corpo = {
      items: lista.map((i) => ({ title: i.nome, quantity: i.qtd, unit_price: i.unit, currency_id: "BRL" })),
      external_reference: id,
      back_urls: { success: site + "/?pago=ok", failure: site + "/?pago=erro", pending: site + "/?pago=pendente" },
      auto_return: "approved",
    };
    if (site.startsWith("https://")) corpo.notification_url = site + "/api/mp-webhook";
    const r = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.MP_ACCESS_TOKEN },
      body: JSON.stringify(corpo),
    });
    const data = await r.json();
    if (!data.init_point) throw new Error("Mercado Pago recusou o pagamento");
    return Response.json({ url: data.init_point, numero: pedido.numero, resumo: resumoCliente(pedido, cfg.loja?.nome || "loja") });
  } catch (e) {
    return Response.json({ erro: e.message }, { status: 400 });
  }
};

export const config = { path: "/api/checkout" };
