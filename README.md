# Lumina — Onde histórias ganham vida

Site institucional e demonstração interativa da **Lumina**, uma plataforma de
criação narrativa onde personagens, lugares e universos inteiros surgem
enquanto você escreve.

## Estrutura

| Arquivo | O que é |
| --- | --- |
| `index.html` | Site institucional. Autossuficiente: a arte do mundo está embutida em base64 e todas as animações (névoa, raios de sol, partículas, grão de filme, parallax) são geradas por código — nenhuma dependência externa além do Google Fonts. Os CTAs atravessam um portal para o Modo Imersão. |
| `write.html` | **Modo Imersão** — o coração da Lumina. Você escreve dentro do mundo: o texto controla o clima (chuva, neve, céu limpo), a hora (noite/dia), fogo, vento e névoa; personagens e cena são detectados e aparecem no painel Mundo Vivo. Interface some enquanto você digita, com modo foco, modo leitor (capitular dourada), som ambiente sintetizado (WebAudio, sem arquivos) e rascunho salvo no navegador. |
| `demo.html` | Demonstração guiada da plataforma (biblioteca, editor com clima dinâmico e modo Nocturne). Aceita deep-links: `demo.html#dashboard`, `demo.html#editor`, `demo.html#nocturne`. |
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


## Lumina 2.0 — refinamentos em desenvolvimento

A evolução visual preserva a paisagem e a atmosfera narrativa originais, mas clareia as áreas de navegação e escrita com tons de papel, marfim e verde-musgo. O **Lumina Nocturne** mantém sua identidade própria de dark romance.

Novos recursos no editor:
- salvamento automático local no navegador;
- exportação do manuscrito em texto (.txt);
- backup portátil do rascunho em JSON (.json);
- atalho Ctrl/Cmd + S;
- correção ortográfica do navegador.

Os arquivos `assets/lumina/refinements.css` e `assets/lumina/editor-tools.js` concentram esses aprimoramentos sem reescrever a arte original embutida nos documentos. O workflow `.github/workflows/lumina-checks.yml` valida a sintaxe dos scripts e os arquivos vinculados em cada atualização da branch de desenvolvimento.

**Importante:** o salvamento atual é local ao dispositivo/navegador. Sincronização em nuvem, contas, IA conectada e pagamentos ainda exigem backend e integrações próprias.


## Lumina visual system 2.1

A interface foi refinada com uma linguagem visual editorial consistente entre o site institucional, a demonstração e o modo de escrita:

- Cabeçalho institucional em vidro escuro translúcido, integrado à paisagem, com estado sólido ao rolar.
- Botões, cartões, superfícies, tipografia e espaçamentos com uma escala visual comum.
- Site e editores Lumina em paleta clara de papel, marfim, verde-musgo e dourado envelhecido.
- Lumina Nocturne preserva a identidade dark romance em vinho, ameixa e sombras profundas.
- Ajustes de leitura, navegação e ferramentas para telas menores.
- Testes E2E verificam também cores computadas, acabamento do cabeçalho e preservação das duas identidades visuais.
