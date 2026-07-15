// Lógica pura de montagem da mensagem. Sem dependência de navegador.
// Funciona como content script (escopo compartilhado) e via require() no Node.

const DEFAULT_CONFIG = {
  nome: "",
  ativo: true,
  negrito: false,
  italico: false,
  quebraLinha: true,
  fraseMaiuscula: true,
};

function formatarNome(config) {
  const nome = (config.nome || "").trim();
  if (!nome) return "";
  let resultado = nome;
  if (config.italico) resultado = `_${resultado}_`;
  if (config.negrito) resultado = `*${resultado}*`;
  return resultado;
}

function capitalizarFrases(texto) {
  return texto.replace(
    /(^\s*|[.!?]\s+|\n\s*)([a-zà-ÿ])/g,
    (_, prefixo, letra) => prefixo + letra.toUpperCase()
  );
}

function montarMensagem(config, texto) {
  const corpo = config.fraseMaiuscula ? capitalizarFrases(texto) : texto;
  const prefixo = formatarNome(config);
  if (!prefixo) return corpo;
  const separador = config.quebraLinha ? "\n" : " ";
  return prefixo + separador + corpo;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_CONFIG, formatarNome, capitalizarFrases, montarMensagem };
}
