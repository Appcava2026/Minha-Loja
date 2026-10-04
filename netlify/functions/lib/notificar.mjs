// Textos do pedido e envio de aviso ao WhatsApp da loja (via CallMeBot, gratuito).
export const brl = (n) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const foneBonito = (t) => String(t).replace(/^(\d{2})(\d{4,5})(\d{4})$/, "($1) $2-$3");
export const zapLink = (t) => "https://wa.me/" + (String(t).length <= 11 ? "55" : "") + t;
export const itensTxt = (o) => o.itens.map((i) => `${i.qtd}x ${i.nome} — ${brl(i.unit * i.qtd)}`).join("\n");

// Mensagem que o CLIENTE envia (botão na volta do pagamento)
export const resumoCliente = (o, loja) =>
  `Olá! Fiz um pedido na ${loja}.\n*Pedido #${o.numero}*\n${itensTxt(o)}\n*Total: ${brl(o.total)}*\nCliente: ${o.cliente.nome} · ${foneBonito(o.cliente.tel)}`;

// Aviso automático que a LOJA recebe quando o pagamento é aprovado
export function avisoLoja(o, pay) {
  const m = pay.payment_method_id === "pix" ? "Pix" : pay.payment_type_id === "credit_card" ? "Cartão de crédito"
    : pay.payment_type_id === "debit_card" ? "Cartão de débito" : pay.payment_type_id === "ticket" ? "Boleto" : "Mercado Pago";
  return `✅ *Pedido pago #${o.numero}*\n${itensTxt(o)}\n*Total: ${brl(o.total)}*\nPagamento: ${m}\nCliente: ${o.cliente.nome}\nWhatsApp: ${foneBonito(o.cliente.tel)}\n${zapLink(o.cliente.tel)}`;
}

export async function enviarWhatsApp(telefone, texto) {
  const key = process.env.CALLMEBOT_APIKEY, d = String(telefone || "").replace(/\D/g, "");
  if (!key || d.length < 12) return { ok: false, motivo: "Falta a variável CALLMEBOT_APIKEY ou o WhatsApp da loja (com DDD) no painel." };
  try {
    const r = await fetch(`https://api.callmebot.com/whatsapp.php?phone=%2B${d}&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(key)}`);
    return { ok: r.ok, motivo: r.ok ? "" : "O serviço respondeu " + r.status };
  } catch (e) { return { ok: false, motivo: e.message }; }
}
