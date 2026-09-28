# Lumina — Onde histórias ganham vida

Site institucional e demonstração interativa da **Lumina**, uma plataforma de
criação narrativa onde personagens, lugares e universos inteiros surgem
enquanto você escreve.

## Estrutura

| Arquivo | O que é |
| --- | --- |
| `index.html` | Site institucional. Autossuficiente: a arte do mundo está embutida em base64 e todas as animações (névoa, raios de sol, partículas, grão de filme, parallax) são geradas por código — nenhuma dependência externa além do Google Fonts. |
| `demo.html` | Demonstração interativa da plataforma (biblioteca, editor com clima dinâmico e modo Nocturne). Aceita deep-links: `demo.html#dashboard`, `demo.html#editor`, `demo.html#nocturne`. |
| `assets/lumina/hero-base.webp` | Arte do mundo em arquivo, usada pela demo e pelo `og:image`. |

## Publicação

Qualquer hospedagem estática serve (GitHub Pages, Netlify, Vercel…). Basta
publicar a raiz do repositório — não há build. O `index.html` funciona até
aberto direto do disco, pois a imagem de fundo vive dentro do próprio arquivo.

## Desenvolvimento

Servidor local:

```bash
python3 -m http.server 8000
# http://localhost:8000
```

Acessibilidade: `prefers-reduced-motion` é respeitado no site; na demo, o
movimento é controlado pelo botão "Reduzir movimento" (decisão de demo para
apresentações).
