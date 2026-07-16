// Roda dentro do WhatsApp Web. Carregado após format.js e seletores.js
// (mesmo escopo isolado), então DEFAULT_CONFIG, montarMensagem e SELETORES
// já estão disponíveis.

// Carimbo de carregamento: numa página limpa aparece UMA vez no console. Se
// aparecer várias, há cópias antigas do script empilhadas (recarregou a
// extensão sem recarregar a página) — e elas causam texto duplicado.
console.log("%c[Zapteach] script carregado", "color:#128c7e;font-weight:bold");

let configAtual = { ...DEFAULT_CONFIG };

chrome.storage.sync.get(DEFAULT_CONFIG, (dados) => {
  configAtual = { ...DEFAULT_CONFIG, ...dados };
});

chrome.storage.onChanged.addListener((mudancas, area) => {
  if (area !== "sync") return;
  for (const chave of Object.keys(mudancas)) {
    if (chave in configAtual) configAtual[chave] = mudancas[chave].newValue;
  }
});

function obterCaixaDeTexto(alvo) {
  if (alvo && alvo.matches && alvo.matches(SELETORES.caixaTexto)) return alvo;
  return document.querySelector(SELETORES.caixaTexto);
}

function enviarMensagem() {
  const icone = document.querySelector(SELETORES.botaoEnviar);
  const botao = icone && icone.closest("button");
  if (botao) botao.click();
  else if (icone) icone.click();
}

// Diagnóstico de 2026-07-16 (bateria //diag): o editor do WhatsApp (Lexical)
// processa edições de forma ASSÍNCRONA — o DOM só reflete a mudança ~um tick
// depois. execCommand insertParagraph/insertHTML retornam true mas o editor
// descarta a mudança; o evento "paste" sintético é a ÚNICA via que cria
// quebras de linha reais (<p> separados, iguais às de um Shift+Enter manual).
// A tentativa antiga com paste (commit dd25d16) falhou porque enviava com
// setTimeout(0), ANTES de o editor aplicar o texto — a via estava certa, o
// timing não. Por isso: cola via paste e ESPERA a caixa refletir o texto.
function colarTexto(caixa, texto) {
  caixa.focus();
  document.execCommand("selectAll", false, null);
  // A seleção também é sincronizada de forma assíncrona pelo Lexical (via
  // selectionchange). Colar no MESMO tick do selectAll faz o editor usar a
  // seleção antiga (cursor no fim) e ANEXAR em vez de substituir — foi o bug
  // do "ola*João...*:" com o texto original sobrando na frente. O respiro de
  // 50ms deixa o editor registrar o "selecionar tudo" antes do colar.
  setTimeout(() => {
    const dados = new DataTransfer();
    dados.setData("text/plain", texto);
    caixa.dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dados })
    );
  }, 50);
}

// Espera (até 1,5s) o editor aplicar o texto colado, conferindo a caixa a
// cada 30ms. Compara com normalizarTexto porque o innerText do Lexical usa
// "\n\n" entre parágrafos e pode ter espaços/nbsp sobrando.
function aguardarTexto(caixa, esperado, aoTerminar) {
  const alvo = normalizarTexto(esperado);
  const limite = Date.now() + 1500;
  (function confere() {
    if (normalizarTexto(caixa.innerText) === alvo) return aoTerminar(true);
    if (Date.now() > limite) return aoTerminar(false);
    setTimeout(confere, 30);
  })();
}

document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    if (!configAtual.ativo) return;

    const caixa = obterCaixaDeTexto(e.target);
    if (!caixa) return;

    // innerText preserva as quebras (Shift+Enter); converterTextoDoEditor
    // reduz o "\n\n" que o Lexical devolve por parágrafo a uma quebra lógica.
    const texto = converterTextoDoEditor(caixa.innerText ?? "");
    if (!texto.trim()) return;

    // Trava anti-duplicação: guardamos um carimbo de tempo na própria caixa
    // (o DOM é compartilhado por todas as cópias do script). Se outra cópia
    // acabou de processar este envio, não repetimos.
    const agora = Date.now();
    if (caixa.dataset.zapTs && agora - Number(caixa.dataset.zapTs) < 1000) return;
    caixa.dataset.zapTs = String(agora);

    // Se o texto já começa com o nome, não injeta de novo. Evita duplicar o
    // prefixo se este handler rodar mais de uma vez (ex.: uma cópia antiga do
    // script ainda ativa na página após recarregar a extensão sem fechar a aba).
    const prefixoNome = formatarNome(configAtual);
    if (prefixoNome && texto.trimStart().startsWith(prefixoNome + ":")) return;

    const final = montarMensagem(configAtual, texto);
    if (final === texto) return; // nada a acrescentar

    // Impede o envio original e reescreve com o nome antes de enviar.
    e.preventDefault();
    e.stopPropagation();

    colarTexto(caixa, final);

    // Só clica em enviar DEPOIS de o editor aplicar o texto colado (é
    // assíncrono). Se estourar o tempo, envia mesmo assim para a mensagem
    // não ficar presa na caixa.
    aguardarTexto(caixa, final, (aplicou) => {
      if (!aplicou) {
        console.warn("[Zapteach] editor não confirmou o texto a tempo; enviando assim mesmo");
      }
      enviarMensagem();
    });
  },
  true // capture: intercepta antes do handler do WhatsApp
);
