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
