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
  chrome.storage.sync.set(configDaTela(), () => {
    if (chrome.runtime.lastError) {
      console.warn("[Zapteach] falha ao salvar:", chrome.runtime.lastError.message);
      return;
    }
    mostrarSalvo();
  });
}

// Debounce do nome fica em escopo de módulo: o popup pode ser destruído
// a qualquer momento (perda de foco), então o pagehide abaixo precisa
// enxergar essa variável para descarregar o save pendente.
let timerNome = null;

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
      // Cancela o debounce do nome: o save imediato abaixo já carrega
      // o valor atual do nome via configDaTela(), então não precisa
      // de um segundo save 400ms depois duplicando a escrita.
      clearTimeout(timerNome);
      timerNome = null;
      salvar();
    });
  }

  // Nome: prévia a cada tecla; salva 400ms depois da última tecla.
  el("nome").addEventListener("input", () => {
    atualizarPrevia();
    clearTimeout(timerNome);
    timerNome = setTimeout(() => {
      timerNome = null;
      salvar();
    }, 400);
  });
});

// Chrome destrói o documento do popup na hora ao perder o foco: um
// setTimeout(salvar, 400) pendente morre junto e a edição do nome
// some silenciosamente. Descarrega o save pendente antes de fechar.
window.addEventListener("pagehide", () => {
  if (timerNome) {
    clearTimeout(timerNome);
    timerNome = null;
    salvar();
  }
});
