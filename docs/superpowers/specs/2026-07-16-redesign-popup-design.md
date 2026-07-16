# Redesign Zapteach v2 — popup, identidade e tema

**Data:** 2026-07-16
**Status:** aprovado pelo usuário (brainstorm com companion visual)
**Base:** v1.0.0 (tag) — lógica de envio estável, fora do escopo deste redesign

## Objetivo

Trocar o popup "formulário cru" por uma interface com cara de produto: estilo
visual do próprio WhatsApp (escolha "Camaleão WhatsApp"), prévia ao vivo da
mensagem, salvamento automático, tema claro/escuro seguindo o sistema e ícone
próprio na barra do Chrome.

## Decisões do brainstorm

| Decisão | Escolha |
|---|---|
| Direção visual | Camaleão WhatsApp (paleta e bolhas idênticas ao WhatsApp Web) |
| Layout interno | Prévia no topo (bolha logo abaixo do cabeçalho), controles embaixo |
| Estilo dos controles | Linhas com interruptores (não pílulas) |
| Ícone | "Bolha com Z" — balão de conversa verde com Z branco |
| Tema | Acompanha o sistema (`prefers-color-scheme`), paletas clara e escura |
| Salvar | Automático; botão "Salvar" removido |
| Stack | Vanilla HTML/CSS/JS — sem build, sem dependências |

## 1. Identidade

- Ícone "Bolha com Z": fonte em SVG (`assets/icon.svg`), exportado para PNG em
  16, 32, 48 e 128 px (`assets/icon-<tam>.png`).
- Registrado no `manifest.json` em `icons` e `action.default_icon`.
- Nome, descrição e permissões da extensão não mudam.

## 2. Estrutura do popup (`popup.html`, de cima para baixo)

1. **Cabeçalho** — logo circular verde com Z, título "Zapteach", interruptor
   mestre (config `ativo`) à direita. Feedback "✓ salvo" discreto aparece aqui
   e some sozinho (~1,2s).
2. **Prévia ao vivo** — faixa com fundo imitando a conversa (padrão pontilhado
   sutil) contendo uma bolha de mensagem enviada (verde) que renderiza o
   resultado real de `montarMensagem()` com um corpo de exemplo fixo
   ("Olá, tudo bem?"). Negrito/itálico aparecem renderizados na bolha; a
   quebra de linha aparece de verdade. Atualiza a cada tecla e a cada toggle.
   Rodapé da bolha com hora fictícia e ✓✓, como no WhatsApp.
   **Prévia honesta** (decisão pós-review): com o interruptor mestre
   desligado, a mensagem real sai sem o nome — a bolha então mostra só o
   corpo, esmaecida (`.bolha.inativa`, opacity 0.55).
3. **Campo "Seu nome"** — input de texto, mesmo comportamento de hoje.
4. **Opções** — quatro linhas com interruptores: Negrito, Itálico, Quebra de
   linha, Frase inicial maiúscula.
5. **Sem botão Salvar.**

## 3. Visual (`popup.css`)

- Paleta oficial do WhatsApp em variáveis CSS (`:root` + media query):
  - **Escuro:** fundo `#111b21`, cabeçalho/superfícies `#202c33`, campo
    `#2a3942`, acento `#00a884`, bolha enviada `#005c4b`, texto `#e9edef`,
    texto secundário `#8696a0`, fundo da conversa `#0b141a`.
  - **Claro:** fundo `#ffffff`, superfícies `#f0f2f5`, acento `#008069`,
    bolha enviada `#d9fdd3`, texto `#111b21`, texto secundário `#667781`,
    fundo da conversa `#efeae2`.
- Tema segue o sistema via `@media (prefers-color-scheme: dark)`; claro é o
  padrão.
- Interruptores estilo WhatsApp em CSS puro sobre `<input type="checkbox">`
  visualmente oculto (acessível por teclado; `:focus-visible` com contorno).
- Largura do popup: ~300px. Tipografia `system-ui`.

## 4. Comportamento (`popup.js`)

- **Salvamento automático:**
  - Toggles: salvam no `change`, imediatamente.
  - Nome: debounce de 400ms após a última tecla.
  - Ao salvar, mostra "✓ salvo" no cabeçalho e esconde após ~1,2s.
- **Prévia:** função nova e pura `previewHTML(config, corpo)` em
  `src/lib/format.js`:
  - Usa `montarMensagem()` (mesma lógica do envio real — a prévia nunca
    mente) sobre um corpo de exemplo fixo.
  - Converte a marcação do WhatsApp para HTML: `*x*` → `<b>x</b>`,
    `_x_` → `<i>x</i>`, `\n` → `<br>`, com escape de HTML antes da conversão
    (nunca injeta HTML do usuário cru).
  - Coberta por testes em `test/format.test.js` (casos: negrito, itálico,
    combinado, quebra ligada/desligada, escape de `<`, `&`).
- O `content.js` já reage a mudanças do storage em tempo real
  (`chrome.storage.onChanged`) — nada muda no envio.

## 5. Fora do escopo

- `content.js`, `seletores.js`, lógica de envio e seletores do WhatsApp
  (estabilizados na v1.0.0).
- Publicação na Web Store (o redesign deixa pronto, mas publicar é outra
  tarefa).
- Novas opções de configuração.

## 6. Testes e verificação

- `npm test` (node --test): 18 testes existentes + novos de `previewHTML`.
- Verificação manual: abrir o popup no Chrome nos temas claro e escuro,
  conferir prévia, auto-save (reabrir o popup e ver valores persistidos) e o
  envio real no WhatsApp Web continuar funcionando.

## Riscos e mitigação

- **Ícone ilegível em 16px** → o conceito foi validado em 16px no mockup;
  exportar com formas simples e contraste alto.
- **Auto-save gravar nome pela metade** → debounce de 400ms + `trim()` (o
  content script só usa o nome no próximo Enter, então estado intermediário
  não vaza pra mensagem).
- **Regressão no envio** → nenhum arquivo do envio é tocado; testes seguem
  cobrindo `format.js`.
