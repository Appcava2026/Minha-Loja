// Página de compartilhamento: o WhatsApp lê estas tags e mostra a FOTO, o NOME e o PREÇO no link.
import { getStore } from "@netlify/blobs";
import { PADRAO } from "./lib/padrao.mjs";
import { brl } from "./lib/notificar.mjs";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export default async (req) => {
  const u = new URL(req.url);
  const id = decodeURIComponent(u.pathname.replace(/^\/p\//, ""));
  const cfg = (await getStore("loja").get("config", { type: "json" })) ?? PADRAO;
  const p = cfg.produtos.find((x) => String(x.id) === id && x.ativo !== false);
  if (!p) return Response.redirect(u.origin + "/", 302);

  const P = cfg.promo, agora = Date.now();
  const promo = !!P && P.ativa && p.promo !== false && agora >= new Date(P.inicio).getTime() && agora < new Date(P.fim).getTime();
  const preco = promo ? Math.round(p.preco * (100 - P.desconto)) / 100 : p.preco;
  const cat = cfg.categorias.find((c) => c.id === p.cat) || {};
  let img = p.foto || cat.foto || "";
  if (img.startsWith("/")) img = u.origin + img;
  const loja = cfg.loja?.nome || "Loja";
  const titulo = `${p.nome} - ${brl(preco)}`;
  const desc = (promo ? `De ${brl(p.preco)} por ${brl(preco)} · ` : "") + loja;
  const destino = `${u.origin}/?produto=${encodeURIComponent(id)}`;

  return new Response(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${esc(titulo)}</title>
<meta property="og:type" content="product"><meta property="og:site_name" content="${esc(loja)}">
<meta property="og:title" content="${esc(titulo)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(u.href)}">
${img ? `<meta property="og:image" content="${esc(img)}"><meta name="twitter:card" content="summary_large_image">` : ""}
<meta http-equiv="refresh" content="0;url=${esc(destino)}"></head><body><a href="${esc(destino)}">Ver ${esc(p.nome)} na loja</a></body></html>`,
    { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "public, max-age=300" } });
};

export const config = { path: "/p/*" };
