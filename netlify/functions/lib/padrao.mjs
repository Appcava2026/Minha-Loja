// Conteúdo inicial da loja (usado até você salvar algo no painel /admin.html)
export const PADRAO = {
  loja: { nome: "MINHA LOJA" },
  tema: "verde",
  categorias: [
    { id: "vestidos", nome: "Vestidos", foto: "", cor: "#14683f" },
    { id: "blusas", nome: "Blusas", foto: "", cor: "#2f7d5b" },
    { id: "calcas", nome: "Calças", foto: "", cor: "#3d6b8c" },
    { id: "jaquetas", nome: "Jaquetas", foto: "", cor: "#6c8aa8" },
    { id: "saias", nome: "Saias", foto: "", cor: "#a39384" },
  ],
  carrossel: [
    { id: "c1", sub: "Coleção nova", titulo: "ATÉ 30% OFF", texto: "Ofertas da semana", botao: "COMPRE AGORA", foto: "", ativo: true },
    { id: "c2", sub: "Vestidos", titulo: "NOVOS MODELOS", texto: "Para o dia e para a noite", botao: "VER AGORA", foto: "", ativo: true },
    { id: "c3", sub: "Jeans", titulo: "BÁSICOS", texto: "Peças que combinam com tudo", botao: "CONFIRA", foto: "", ativo: true },
  ],
  promo: { ativa: true, nome: "Liquidação de Outubro", desconto: 20, inicio: "2026-09-30T03:00:00.000Z", fim: "2026-11-01T02:59:59.000Z" },
  secao1: { titulo: "Mais vendidos", ativa: true },
  secao2: { titulo: "Novidades", ativa: true },
  produtos: [
    { id: "p1", nome: "Vestido Floral", preco: 129.9, cat: "vestidos", secao: 1, foto: "", promo: true, ativo: true },
    { id: "p2", nome: "Blusa Canelada", preco: 59.9, cat: "blusas", secao: 1, foto: "", promo: true, ativo: true },
    { id: "p3", nome: "Calça Wide Leg", preco: 149.9, cat: "calcas", secao: 1, foto: "", promo: true, ativo: true },
    { id: "p4", nome: "Jaqueta Jeans", preco: 189.9, cat: "jaquetas", secao: 2, foto: "", promo: true, ativo: true },
    { id: "p5", nome: "Saia Midi", preco: 99.9, cat: "saias", secao: 2, foto: "", promo: true, ativo: true },
    { id: "p6", nome: "Camiseta Básica", preco: 49.9, cat: "blusas", secao: 2, foto: "", promo: true, ativo: true },
  ],
};
