// API da loja: configuração, imagens, pedidos e teste de aviso (Netlify Blobs, gratuito).
import { getStore } from "@netlify/blobs";
import { PADRAO } from "./lib/padrao.mjs";
import { enviarWhatsApp } from "./lib/notificar.mjs";

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const admin = (req) => !!process.env.ADMIN_PASSWORD && req.headers.get("x-admin-senha") === process.env.ADMIN_PASSWORD;
const lerConfig = async () => (await getStore("loja").get("config", { type: "json" })) ?? PADRAO;

export default async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/api/imagem") return imagem(req, url);
  if (url.pathname === "/api/pedidos") return pedidos(req);
  if (req.method === "GET") {
    if (url.searchParams.get("check")) return admin(req) ? J({ ok: true }) : J({ erro: "Senha incorreta" }, 401);
    return J(await lerConfig());
  }
  if (req.method === "PUT") {
    if (!admin(req)) return J({ erro: "Senha incorreta" }, 401);
    const txt = await req.text();
    if (txt.length > 1500000) return J({ erro: "Dados grandes demais" }, 413);
    const c = JSON.parse(txt);
    if (![c.produtos, c.categorias, c.carrossel].every(Array.isArray)) return J({ erro: "Dados inválidos" }, 400);
    c.loja = { ...(c.loja || {}), whatsapp: String(c.loja?.whatsapp || "").replace(/\D/g, "") };
    await getStore("loja").setJSON("config", c);
    return J({ ok: true });
  }
  if (req.method === "POST" && url.searchParams.get("teste")) {
    if (!admin(req)) return J({ erro: "Senha incorreta" }, 401);
    const r = await enviarWhatsApp((await lerConfig()).loja?.whatsapp, "✅ Teste: os avisos de pedido da sua loja estão funcionando.");
    return r.ok ? J({ ok: true }) : J({ erro: r.motivo }, 400);
  }
  return J({ erro: "Método não permitido" }, 405);
};

async function pedidos(req) {
  if (!admin(req)) return J({ erro: "Senha incorreta" }, 401);
  const ps = getStore("pedidos");
  const { blobs } = await ps.list();
  const ks = blobs.map((b) => b.key).sort().slice(-50).reverse();
  return J(await Promise.all(ks.map((k) => ps.get(k, { type: "json" }))));
}

async function imagem(req, url) {
  const st = getStore("imagens");
  if (req.method === "GET") {
    const id = url.searchParams.get("id") || "";
    const b = /^[a-z0-9]+$/.test(id) ? await st.get(id, { type: "arrayBuffer" }) : null;
    if (!b) return new Response("Não encontrada", { status: 404 });
    return new Response(b, { headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=31536000, immutable" } });
  }
  if (req.method === "POST") {
    if (!admin(req)) return J({ erro: "Senha incorreta" }, 401);
    const { dataUrl } = await req.json();
    const m = /^data:image\/jpeg;base64,(.+)$/.exec(dataUrl || "");
    if (!m || m[1].length > 800000) return J({ erro: "Imagem inválida ou grande demais" }, 400);
    const buf = Buffer.from(m[1], "base64");
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    await st.set(id, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    return J({ url: "/api/imagem?id=" + id });
  }
  return J({ erro: "Método não permitido" }, 405);
}

export const config = { path: ["/api/loja", "/api/imagem", "/api/pedidos"] };
