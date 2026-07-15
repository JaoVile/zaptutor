// Roda dentro do WhatsApp Web. Carregado após format.js e seletores.js
// (mesmo escopo isolado), então DEFAULT_CONFIG, montarMensagem e SELETORES
// já estão disponíveis.

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

document.addEventListener(
  "keydown",
  (e) => {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    if (!configAtual.ativo) return;

    const caixa = obterCaixaDeTexto(e.target);
    if (!caixa) return;

    // innerText (não textContent) preserva as quebras de linha (Shift+Enter)
    // que o WhatsApp representa como <br> na caixa contenteditable.
    const texto = caixa.innerText ?? "";
    if (!texto.trim()) return;

    const final = montarMensagem(configAtual, texto);
    if (final === texto) return; // nada a acrescentar

    // Impede o envio original e reescreve com o nome antes de enviar.
    e.preventDefault();
    e.stopPropagation();

    caixa.focus();
    document.execCommand("selectAll", false, null);
    document.execCommand("insertText", false, final);

    // Dá um tick para o WhatsApp registrar o texto e exibir o botão enviar.
    setTimeout(enviarMensagem, 0);
  },
  true // capture: intercepta antes do handler do WhatsApp
);
