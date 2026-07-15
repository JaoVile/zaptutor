# Zapteach — Design (v1)

**Data:** 2026-07-15
**Status:** Aprovado (aguardando revisão do spec)

## Objetivo

Extensão Chrome (Manifest V3) que insere automaticamente o **nome do atendente na
frente de cada mensagem enviada no WhatsApp Web**. O nome vira **conteúdo real da
mensagem**, então é visto por todos os destinatários, em qualquer dispositivo,
inclusive em grupos — não é enfeite local.

Resolve o problema de vários atendentes compartilharem o mesmo número: o cliente
passa a saber com quem está falando.

## Contexto de uso

- ~6 PCs. Cada atendente **loga a própria conta Google/Chrome**.
- Um atendente fixo por pessoa (o mesmo em qualquer PC onde ela logar).
- Config salva em `chrome.storage.sync` → o nome **segue a conta Google** da pessoa
  automaticamente entre as máquinas. Sem reconfigurar em cada PC.
- Instalação inicial: **modo desenvolvedor (unpacked)**. Publicar na Chrome Web
  Store fica para depois.

## Escopo da v1

Incluído:
- ✅ Nome na frente da mensagem (núcleo).
- ✅ Formatação do nome: **negrito**, **itálico**, **quebra de linha** (markdown
  nativo do WhatsApp — universal).
- ✅ "Frase inicial maiúscula" — capitaliza a 1ª letra das frases **no momento do
  envio** (forma A: mais estável que o efeito ao vivo).
- ✅ Ligar/desligar a extensão pelo popup.
- ✅ Sincronização do nome pela conta Google (`storage.sync`).
- ✅ Popup para o próprio atendente **editar seu nome** e opções.

Fora da v1 (evoluções futuras):
- ❌ Troca rápida entre vários nomes (Alt+1/2/3 + menu).
- ❌ "Frase maiúscula" ao vivo, letra por letra (forma B).
- ❌ Transferência de conversa.
- ❌ Publicação na Chrome Web Store.

## Arquitetura

```
whatsappnomes/
├── manifest.json          # MV3: content script em web.whatsapp.com, permission "storage", popup
├── src/
│   ├── content.js         # roda dentro do WhatsApp Web: intercepta envio e injeta o nome
│   ├── popup.html         # tela de configuração
│   ├── popup.js           # lê/salva config no storage.sync
│   ├── popup.css
│   ├── lib/format.js      # funções PURAS: montarMensagem/formatarNome/capitalizarFrases
│   └── lib/seletores.js   # seletores do DOM do WhatsApp centralizados (ponto de manutenção)
├── test/format.test.js    # testes das funções puras (TDD)
├── icons/                 # ícones 16/48/128
└── README.md              # como instalar unpacked nos 6 PCs
```

**Separação de responsabilidades:**
- `lib/format.js` — lógica pura de montar o texto. Testável sem navegador (TDD). É
  onde mora a regra de negócio.
- `lib/seletores.js` — todos os seletores do DOM do WhatsApp num só lugar. Quando o
  WhatsApp mudar o layout, conserta-se aqui.
- `content.js` — parte "suja": integra com o WhatsApp Web usando as duas libs acima.
- `popup.*` — UI de configuração, isolada da lógica de injeção.

## Configuração persistida (schema)

```js
{
  nome: "João",         // texto do atendente
  ativo: true,          // liga/desliga a extensão
  negrito: false,       // envolve o nome em *...*
  italico: false,       // envolve o nome em _..._
  quebraLinha: true,    // nome em uma linha, mensagem embaixo (senão, nome + espaço)
  fraseMaiuscula: true  // capitaliza 1ª letra das frases no envio
}
```

Armazenado em `chrome.storage.sync`. `content.js` lê no carregamento e escuta
`chrome.storage.onChanged` para refletir mudanças em tempo real.

## Fluxo de dados

```
Popup (usuário edita nome/opções) ──salva──> chrome.storage.sync
                                                     │
                              onChanged (tempo real) ▼
                              content.js  ──lê config──> intercepta envio ──> injeta texto
```

## Injeção do nome (parte técnica crítica)

O campo de digitação do WhatsApp Web é um **editor rico (Lexical)** — não basta
setar `innerText`.

Estratégia principal:
1. `content.js` escuta o **Enter** no campo de digitação (keydown em modo *capture*).
2. Enter sem Shift → previne o envio padrão, lê o texto digitado.
3. Monta a mensagem final via `montarMensagem(config, texto)`:
   `formatarNome(config) + separador + capitalizarFrases(texto)`.
4. Reescreve o conteúdo do editor simulando digitação (eventos `beforeinput`/`input`
   que o Lexical reconhece) e dispara o envio.

**Formatação (markdown nativo, universal):**
- negrito → `*João*`
- itálico → `_João_`
- negrito + itálico → `*_João_*`
- quebra de linha → nome numa linha, mensagem na linha de baixo (`João\nmensagem`);
  se desligada, `João mensagem` (com espaço).

**Risco conhecido:** o passo 4 é o ponto que costuma quebrar nessas extensões. Será
validado com teste manual real no WhatsApp Web antes de considerar pronto. Escrito de
forma defensiva: se os seletores não casarem, a extensão **não quebra a página** —
apenas não injeta (log silencioso no console).

## Tratamento de erros

- Campo/seletor não encontrado → não injeta, não lança erro visível, registra no
  console. A página do WhatsApp continua funcionando normalmente.
- Config ausente ou `ativo: false` → extensão fica inerte (comportamento padrão do
  WhatsApp).
- Nome vazio → não injeta prefixo (evita mensagem começando com formatação solta).

## Testes

- **Funções puras** (`lib/format.js`) — TDD, cobrindo:
  - montar mensagem com/sem quebra de linha;
  - negrito, itálico, ambos, nenhum;
  - capitalização de frases (início, após `.`/`!`/`?`, múltiplas frases);
  - nome vazio / config desligada.
- **Popup** — validação com Playwright (skill `webapp-testing`): salvar e recarregar
  config funciona.
- **Injeção real** — teste manual: carregar unpacked → configurar nome → enviar
  mensagem → conferir o texto recebido no celular e em um grupo.

## Instalação (unpacked) — resumo para o README

1. Baixar/copiar a pasta da extensão para o PC.
2. Abrir `chrome://extensions`.
3. Ativar "Modo do desenvolvedor".
4. "Carregar sem compactação" → selecionar a pasta.
5. Abrir/recarregar `web.whatsapp.com`, abrir o popup e configurar o nome.

## Decisões registradas

- Nome do produto: **Zapteach**.
- "Frase inicial maiúscula": forma **A (no envio)** na v1.
- Sincronização via `chrome.storage.sync` (segue a conta Google).
- Sem troca rápida de nomes na v1.
