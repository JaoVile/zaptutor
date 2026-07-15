function carregar() {
  chrome.storage.sync.get(DEFAULT_CONFIG, (cfg) => {
    document.getElementById("nome").value = cfg.nome;
    document.getElementById("ativo").checked = cfg.ativo;
    document.getElementById("negrito").checked = cfg.negrito;
    document.getElementById("italico").checked = cfg.italico;
    document.getElementById("quebraLinha").checked = cfg.quebraLinha;
    document.getElementById("fraseMaiuscula").checked = cfg.fraseMaiuscula;
  });
}

function salvar() {
  const cfg = {
    nome: document.getElementById("nome").value.trim(),
    ativo: document.getElementById("ativo").checked,
    negrito: document.getElementById("negrito").checked,
    italico: document.getElementById("italico").checked,
    quebraLinha: document.getElementById("quebraLinha").checked,
    fraseMaiuscula: document.getElementById("fraseMaiuscula").checked,
  };
  chrome.storage.sync.set(cfg, () => {
    const status = document.getElementById("status");
    status.textContent = "Salvo!";
    setTimeout(() => (status.textContent = ""), 1500);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  carregar();
  document.getElementById("salvar").addEventListener("click", salvar);
});
