# Redesign Zapteach v2 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Popup com visual "Camaleão WhatsApp" (prévia ao vivo, interruptores, auto-save, tema claro/escuro pelo sistema) e ícone próprio "Bolha com Z".

**Architecture:** Extensão Chrome MV3 sem build. A prévia reusa `montarMensagem()` de `src/lib/format.js` (mesma lógica do envio real) via nova função pura `previewHTML()`. Popup em HTML/CSS/JS vanilla; temas por variáveis CSS + `prefers-color-scheme`. Nada em `src/content.js` ou `src/lib/seletores.js` é tocado.

**Tech Stack:** HTML/CSS/JS vanilla, `node --test` para funções puras, ImageMagick (`convert`) para gerar PNGs do ícone.

**Spec:** `docs/superpowers/specs/2026-07-16-redesign-popup-design.md`

## Global Constraints

- NÃO modificar: `src/content.js`, `src/lib/seletores.js` (envio estável, v1.0.0).
- Sem dependências novas, sem etapa de build.
- Textos da interface em português.
- Paleta escura: fundo `#111b21`, superfícies `#202c33`, campo `#2a3942`, acento `#00a884`, bolha `#005c4b`, texto `#e9edef`, texto secundário `#8696a0`, fundo de conversa `#0b141a`, trilho desligado `#3b4a54`.
- Paleta clara (padrão): fundo `#ffffff`, superfícies `#f0f2f5`, acento `#008069`, bolha `#d9fdd3`, texto `#111b21`, texto secundário `#667781`, fundo de conversa `#efeae2`, trilho desligado `#ccd0d5`, borda de campo `#d1d7db`.
- Rodar testes com `npm test` a partir da raiz do repo (`/home/atomossoulucaoegestao/Github/whatsappnomes`).

---

### Task 1: `previewHTML()` em format.js (TDD)

**Files:**
- Modify: `src/lib/format.js` (acrescentar ao final, antes do bloco `module.exports`)
- Test: `test/format.test.js` (acrescentar ao final)

**Interfaces:**
- Consumes: `montarMensagem(config, texto)` e `DEFAULT_CONFIG` (já existem em `format.js`).
- Produces: `previewHTML(config, corpo) -> string` (HTML seguro com `<b>`, `<i>`, `<br>`) e `escaparHTML(texto) -> string`. A Task 4 chama `previewHTML(config, "olá, tudo bem?")`.

- [ ] **Step 1: Escrever os testes que falham**

Acrescentar ao FINAL de `test/format.test.js`:

```js
// previewHTML: converte a mensagem final (marcação do WhatsApp) em HTML
// seguro para a bolha de prévia do popup.
test("previewHTML: negrito vira <b> e quebra vira <br>", () => {
  const c = cfg({ nome: "João", negrito: true, quebraLinha: true, fraseMaiuscula: true });
  assert.strictEqual(previewHTML(c, "olá"), "<b>João</b>:<br>Olá");
});

test("previewHTML: itálico vira <i>", () => {
  const c = cfg({ nome: "João", italico: true, fraseMaiuscula: true });
  assert.strictEqual(previewHTML(c, "olá"), "<i>João</i>:<br>Olá");
});

test("previewHTML: negrito + itálico aninham", () => {
  const c = cfg({ nome: "João", negrito: true, italico: true, fraseMaiuscula: true });
  assert.strictEqual(previewHTML(c, "olá"), "<b><i>João</i></b>:<br>Olá");
});

test("previewHTML: sem quebra de linha usa espaço (sem <br>)", () => {
  const c = cfg({ nome: "João", quebraLinha: false, fraseMaiuscula: true });
  assert.strictEqual(previewHTML(c, "olá"), "João: Olá");
});

test("previewHTML: escapa HTML do nome (nunca injeta tag crua)", () => {
  const c = cfg({ nome: "A<b> & Cia", fraseMaiuscula: false });
  assert.strictEqual(previewHTML(c, "oi"), "A&lt;b&gt; &amp; Cia:<br>oi");
});

test("previewHTML: nome vazio mostra só o corpo", () => {
  const c = cfg({ nome: "", fraseMaiuscula: true });
  assert.strictEqual(previewHTML(c, "olá"), "Olá");
});
```

E na desestruturação do `require` no topo do mesmo arquivo, acrescentar `previewHTML`:

```js
const {
  DEFAULT_CONFIG,
  formatarNome,
  capitalizarFrases,
  montarMensagem,
  converterTextoDoEditor,
  normalizarTexto,
  previewHTML,
} = require("../src/lib/format.js");
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test 2>&1 | grep -E "^# (pass|fail)"`
Expected: `# fail 6` (erro `previewHTML is not a function`), `# pass 18`.

- [ ] **Step 3: Implementar em `src/lib/format.js`**

Inserir ANTES do bloco `if (typeof module !== "undefined" ...)`:

```js
// Converte texto em HTML inofensivo (nunca renderiza tag vinda do usuário).
function escaparHTML(texto) {
  return (texto || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// HTML da bolha de prévia do popup: monta a mensagem final com a MESMA
// função do envio real (a prévia nunca mente) e converte a marcação do
// WhatsApp para HTML: *x* -> <b>, _x_ -> <i>, \n -> <br>. Escapa o HTML
// ANTES de converter a marcação.
function previewHTML(config, corpo) {
  let texto = escaparHTML(montarMensagem(config, corpo));
  texto = texto.replace(/\*([^*]+)\*/g, "<b>$1</b>");
  texto = texto.replace(/_([^_]+)_/g, "<i>$1</i>");
  return texto.replace(/\n/g, "<br>");
}
```

E acrescentar `escaparHTML` e `previewHTML` ao objeto do `module.exports`:

```js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_CONFIG,
    formatarNome,
    capitalizarFrases,
    montarMensagem,
    converterTextoDoEditor,
    normalizarTexto,
    escaparHTML,
    previewHTML,
  };
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test 2>&1 | grep -E "^# (tests|pass|fail)"`
Expected: `# tests 24`, `# pass 24`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/format.js test/format.test.js
git commit -m "feat: previewHTML converte a mensagem final em HTML seguro para a prévia"
```

---

### Task 2: Ícone "Bolha com Z" + manifest

**Files:**
- Create: `assets/icon.svg`, `assets/icon-16.png`, `assets/icon-32.png`, `assets/icon-48.png`, `assets/icon-128.png`
- Modify: `manifest.json`

**Interfaces:**
- Consumes: nada.
- Produces: PNGs referenciados pelo `manifest.json`; nenhum código depende disso.

- [ ] **Step 1: Criar `assets/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <!-- Balão de conversa verde WhatsApp com o Z da marca -->
  <path d="M24 4C13 4 4 12.6 4 23.2c0 5.4 2.3 10.2 6 13.7L8 44l7.6-2.5c2.6 1 5.4 1.6 8.4 1.6 11 0 20-8.6 20-19.2S35 4 24 4z" fill="#00a884"/>
  <text x="24" y="31" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="900" fill="#ffffff" text-anchor="middle">Z</text>
</svg>
```

- [ ] **Step 2: Gerar os PNGs com ImageMagick**

Run (na raiz do repo):
```bash
mkdir -p assets
for t in 16 32 48 128; do
  convert -background none -density 384 assets/icon.svg -resize ${t}x${t} assets/icon-${t}.png
done
file assets/icon-*.png
```
Expected: quatro linhas `PNG image data, <t> x <t>` (16, 32, 48, 128).

- [ ] **Step 3: Registrar no `manifest.json`**

Substituir o conteúdo COMPLETO do arquivo por:

```json
{
  "manifest_version": 3,
  "name": "Zapteach",
  "version": "1.1.0",
  "description": "Adiciona o nome do atendente nas mensagens do WhatsApp Web.",
  "permissions": ["storage"],
  "icons": {
    "16": "assets/icon-16.png",
    "32": "assets/icon-32.png",
    "48": "assets/icon-48.png",
    "128": "assets/icon-128.png"
  },
  "action": {
    "default_popup": "src/popup.html",
    "default_title": "Zapteach",
    "default_icon": {
      "16": "assets/icon-16.png",
      "32": "assets/icon-32.png",
      "48": "assets/icon-48.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://web.whatsapp.com/*"],
      "js": ["src/lib/format.js", "src/lib/seletores.js", "src/content.js"],
      "run_at": "document_idle"
    }
  ]
}
```

- [ ] **Step 4: Validar o JSON**

Run: `python3 -c "import json; json.load(open('manifest.json')); print('manifest OK')"`
Expected: `manifest OK`.

- [ ] **Step 5: Commit**

```bash
git add assets manifest.json
git commit -m "feat: ícone Bolha com Z (16-128px) e versão 1.1.0"
```

---

### Task 3: Estrutura e visual do popup (popup.html + popup.css)

**Files:**
- Modify: `src/popup.html` (reescrever por completo)
- Modify: `src/popup.css` (reescrever por completo)

**Interfaces:**
- Consumes: nada.
- Produces: DOM com ids `ativo`, `nome`, `negrito`, `italico`, `quebraLinha`, `fraseMaiuscula`, `previaTexto`, `salvo` — a Task 4 (popup.js) depende EXATAMENTE desses ids. Classe `visivel` em `#salvo` controla o feedback "✓ salvo".

- [ ] **Step 1: Reescrever `src/popup.html`**

Conteúdo completo:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="popup.css" />
  </head>
  <body>
    <header class="cabecalho">
      <div class="logo" aria-hidden="true">Z</div>
      <h1>Zapteach</h1>
      <span id="salvo" class="salvo" role="status">✓ salvo</span>
      <label class="interruptor" title="Ativar ou desativar a extensão">
        <input type="checkbox" id="ativo" />
        <span class="trilho"></span>
      </label>
    </header>

    <section class="previa" aria-label="Prévia da mensagem">
      <div class="bolha">
        <div id="previaTexto" class="bolha-texto"></div>
        <div class="bolha-meta">10:42 <span class="ticks">✓✓</span></div>
      </div>
      <p class="previa-dica">prévia ao vivo — atualiza enquanto você digita</p>
    </section>

    <main>
      <label class="campo">
        <span class="rotulo">Seu nome</span>
        <input type="text" id="nome" placeholder="Ex.: João - Suporte" autocomplete="off" />
      </label>

      <div class="opcoes">
        <label class="opcao">
          <span>Negrito</span>
          <span class="interruptor"><input type="checkbox" id="negrito" /><span class="trilho"></span></span>
        </label>
        <label class="opcao">
          <span>Itálico</span>
          <span class="interruptor"><input type="checkbox" id="italico" /><span class="trilho"></span></span>
        </label>
        <label class="opcao">
          <span>Quebra de linha</span>
          <span class="interruptor"><input type="checkbox" id="quebraLinha" /><span class="trilho"></span></span>
        </label>
        <label class="opcao">
          <span>Frase inicial maiúscula</span>
          <span class="interruptor"><input type="checkbox" id="fraseMaiuscula" /><span class="trilho"></span></span>
        </label>
      </div>
    </main>

    <script src="lib/format.js"></script>
    <script src="popup.js"></script>
  </body>
</html>
```

- [ ] **Step 2: Reescrever `src/popup.css`**

Conteúdo completo:

```css
/* Paleta oficial do WhatsApp. Claro é o padrão; escuro via prefers-color-scheme. */
:root {
  --fundo: #ffffff;
  --superficie: #f0f2f5;
  --campo: #ffffff;
  --borda: #d1d7db;
  --acento: #008069;
  --bolha: #d9fdd3;
  --texto: #111b21;
  --texto-2: #667781;
  --conversa: #efeae2;
  --trilho-desligado: #ccd0d5;
  --pontilhado: rgba(0, 0, 0, 0.06);
}
@media (prefers-color-scheme: dark) {
  :root {
    --fundo: #111b21;
    --superficie: #202c33;
    --campo: #2a3942;
    --borda: transparent;
    --acento: #00a884;
    --bolha: #005c4b;
    --texto: #e9edef;
    --texto-2: #8696a0;
    --conversa: #0b141a;
    --trilho-desligado: #3b4a54;
    --pontilhado: rgba(255, 255, 255, 0.04);
  }
}

* {
  box-sizing: border-box;
}
body {
  width: 300px;
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: var(--fundo);
  color: var(--texto);
}

/* Cabeçalho */
.cabecalho {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--superficie);
}
.logo {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--acento);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}
h1 {
  flex: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
.salvo {
  font-size: 11px;
  color: var(--acento);
  opacity: 0;
  transition: opacity 0.25s;
}
.salvo.visivel {
  opacity: 1;
}

/* Interruptor estilo WhatsApp (checkbox oculto + trilho estilizado) */
.interruptor {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
}
.interruptor input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
}
.trilho {
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: var(--trilho-desligado);
  transition: background 0.2s;
  pointer-events: none;
}
.trilho::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.interruptor input:checked + .trilho {
  background: var(--acento);
}
.interruptor input:checked + .trilho::after {
  transform: translateX(16px);
}
.interruptor input:focus-visible + .trilho {
  outline: 2px solid var(--acento);
  outline-offset: 2px;
}

/* Prévia (fundo imita a conversa; bolha de mensagem enviada) */
.previa {
  padding: 14px;
  background-color: var(--conversa);
  background-image: radial-gradient(var(--pontilhado) 1px, transparent 1px);
  background-size: 14px 14px;
}
.bolha {
  max-width: 88%;
  margin-left: auto;
  background: var(--bolha);
  border-radius: 8px 8px 0 8px;
  padding: 8px 10px;
  box-shadow: 0 1px 1px rgba(0, 0, 0, 0.2);
}
.bolha-texto {
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
}
.bolha-meta {
  font-size: 10px;
  color: var(--texto-2);
  text-align: right;
  margin-top: 2px;
}
.previa-dica {
  margin: 8px 0 0;
  text-align: center;
  font-size: 10px;
  color: var(--texto-2);
}

/* Formulário */
main {
  padding: 12px 14px 14px;
}
.rotulo {
  display: block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--texto-2);
  margin-bottom: 4px;
}
#nome {
  width: 100%;
  padding: 9px 10px;
  font-size: 13px;
  border: 1px solid var(--borda);
  border-radius: 8px;
  background: var(--campo);
  color: var(--texto);
}
#nome:focus {
  outline: 2px solid var(--acento);
  border-color: transparent;
}
.opcoes {
  margin-top: 12px;
}
.opcao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  padding: 7px 0;
  cursor: pointer;
}
```

- [ ] **Step 3: Verificação visual estática**

Run: `xdg-open src/popup.html` (abre no navegador padrão; `chrome.storage` não roda em file://, então a prévia fica vazia — o objetivo aqui é só conferir layout, cores e interruptores).
Expected: cabeçalho com logo/título/interruptor, faixa de prévia com bolha vazia à direita, campo de nome e 4 opções com interruptores estilizados. Alternar o tema do sistema muda claro/escuro.

- [ ] **Step 4: Commit**

```bash
git add src/popup.html src/popup.css
git commit -m "feat: popup com visual Camaleão WhatsApp (prévia no topo, interruptores, temas)"
```

---

### Task 4: Comportamento do popup (popup.js)

**Files:**
- Modify: `src/popup.js` (reescrever por completo)

**Interfaces:**
- Consumes: ids do DOM da Task 3 (`ativo`, `nome`, `negrito`, `italico`, `quebraLinha`, `fraseMaiuscula`, `previaTexto`, `salvo`); `DEFAULT_CONFIG` e `previewHTML(config, corpo)` da Task 1 (carregados por `lib/format.js` no mesmo escopo).
- Produces: nada consumido por outras tasks.

- [ ] **Step 1: Reescrever `src/popup.js`**

Conteúdo completo:

```js
// Popup do Zapteach: salvamento automático + prévia ao vivo.
// DEFAULT_CONFIG e previewHTML vêm de lib/format.js (mesmo escopo).

const CORPO_EXEMPLO = "olá, tudo bem?";
const CAMPOS_TOGGLE = ["ativo", "negrito", "italico", "quebraLinha", "fraseMaiuscula"];

function el(id) {
  return document.getElementById(id);
}

// Lê a configuração atual direto dos controles da tela.
function configDaTela() {
  return {
    nome: el("nome").value.trim(),
    ativo: el("ativo").checked,
    negrito: el("negrito").checked,
    italico: el("italico").checked,
    quebraLinha: el("quebraLinha").checked,
    fraseMaiuscula: el("fraseMaiuscula").checked,
  };
}

function atualizarPrevia() {
  el("previaTexto").innerHTML = previewHTML(configDaTela(), CORPO_EXEMPLO);
}

// "✓ salvo" pisca no cabeçalho e some sozinho.
let timerSalvo = null;
function mostrarSalvo() {
  const aviso = el("salvo");
  aviso.classList.add("visivel");
  clearTimeout(timerSalvo);
  timerSalvo = setTimeout(() => aviso.classList.remove("visivel"), 1200);
}

function salvar() {
  chrome.storage.sync.set(configDaTela(), mostrarSalvo);
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(DEFAULT_CONFIG, (cfg) => {
    el("nome").value = cfg.nome;
    for (const id of CAMPOS_TOGGLE) el(id).checked = cfg[id];
    atualizarPrevia();
  });

  // Toggles: salvam na hora.
  for (const id of CAMPOS_TOGGLE) {
    el(id).addEventListener("change", () => {
      atualizarPrevia();
      salvar();
    });
  }

  // Nome: prévia a cada tecla; salva 400ms depois da última tecla.
  let timerNome = null;
  el("nome").addEventListener("input", () => {
    atualizarPrevia();
    clearTimeout(timerNome);
    timerNome = setTimeout(salvar, 400);
  });
});
```

- [ ] **Step 2: Conferir sintaxe e rodar a suíte**

Run: `node --check src/popup.js && npm test 2>&1 | grep -E "^# (tests|pass|fail)"`
Expected: sem erro de sintaxe; `# tests 24`, `# pass 24`, `# fail 0`.

- [ ] **Step 3: Commit**

```bash
git add src/popup.js
git commit -m "feat: salvamento automático e prévia ao vivo no popup"
```

---

### Task 5: Verificação de ponta a ponta no Chrome

**Files:** nenhum (verificação manual; ajustes pontuais se algo falhar).

**Interfaces:** consome tudo das tasks 1–4.

- [ ] **Step 1: Recarregar a extensão**

`chrome://extensions` → Zapteach → ↻. O cartão e a barra do Chrome devem exibir o ícone novo (bolha verde com Z).

- [ ] **Step 2: Conferir o popup**

Abrir o popup pelo ícone. Checklist:
- Cabeçalho: logo Z, "Zapteach", interruptor mestre refletindo a config atual.
- Prévia mostra o nome salvo formatado + "Olá, tudo bem?" na bolha.
- Digitar no campo nome → prévia muda a cada tecla → "✓ salvo" pisca ~400ms após parar.
- Cada toggle muda a prévia na hora (negrito/itálico renderizados; quebra de linha some/aparece) e pisca "✓ salvo".
- Fechar e reabrir o popup → valores persistidos.

- [ ] **Step 3: Conferir os dois temas**

Alternar o tema do sistema (Pop!_OS: Configurações → Aparência) e reabrir o popup.
Expected: claro = fundo branco/bolha verde-clara; escuro = fundo `#111b21`/bolha `#005c4b`.

- [ ] **Step 4: Conferir que o envio continua intacto**

No WhatsApp Web (F5 antes), enviar "ola teste" na conversa de teste.
Expected: mensagem sai como antes — nome formatado em cima, "Ola teste" embaixo.

- [ ] **Step 5: Commit final (apenas se a verificação exigiu ajustes)**

```bash
git status --short
```
Expected: vazio (tasks 1–4 já commitaram tudo). Se houver ajuste feito durante a verificação, commitar com `fix: ajustes da verificação do popup v2`. (O README já descreve o popup sem citar botão Salvar — nada a mudar nele.)
