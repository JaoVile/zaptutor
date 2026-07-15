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

function contarQuebras(texto) {
  return (texto.match(/\n/g) || []).length;
}

// O editor do WhatsApp (Lexical) NÃO transforma um caractere "\n" em quebra
// visual, e ignora eventos sintéticos (paste/beforeinput) — que ainda
// bagunçam o cursor. Só o caminho "confiável" de edição do navegador
// (execCommand) é respeitado, como provou o insertText do texto. Criamos a
// quebra por execCommand e conferimos pelo innerText se ela realmente entrou;
// se o primeiro comando não pegar nesta versão, tentamos o próximo.
function inserirQuebra(caixa) {
  const antes = contarQuebras(caixa.innerText);
  document.execCommand("insertParagraph");
  if (contarQuebras(caixa.innerText) > antes) return true;
  document.execCommand("insertHTML", false, "<br>");
  if (contarQuebras(caixa.innerText) > antes) return true;
  return false;
}

// Reescreve a caixa com o texto final. Insere linha a linha: o texto de cada
// linha vai por execCommand("insertText") (que preserva o conteúdo) e as
// quebras entram por inserirQuebra(). Assim o "\n" nunca é passado como
// caractere ao editor, que o descartaria.
function inserirMensagem(caixa, texto) {
  caixa.focus();
  document.execCommand("selectAll", false, null);
  document.execCommand("delete", false, null);
  const linhas = texto.split("\n");
  linhas.forEach((linha, i) => {
    if (i > 0) inserirQuebra(caixa);
    if (linha) document.execCommand("insertText", false, linha);
  });
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

    inserirMensagem(caixa, final);

    // Dá um tick para o WhatsApp registrar o texto e exibir o botão enviar.
    setTimeout(enviarMensagem, 0);
  },
  true // capture: intercepta antes do handler do WhatsApp
);
