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
  // Formato "João:" seguido da mensagem. Com quebra de linha, a mensagem vai
  // na linha de baixo; sem quebra, na mesma linha após um espaço.
  const separador = config.quebraLinha ? "\n" : " ";
  return prefixo + ":" + separador + corpo;
}

// O editor do WhatsApp (Lexical) representa cada linha como um <p>, e o
// innerText devolve "\n\n" entre linhas — ou seja, UMA quebra visual chega
// como um PAR de "\n". Converte para texto lógico reduzindo cada par a uma
// quebra ("a\n\nb" → "a\nb"; linha em branco "a\n\n\n\nb" → "a\n\nb").
function converterTextoDoEditor(texto) {
  return (texto || "").trim().replace(/\n\n/g, "\n");
}

// Normaliza para comparar o conteúdo da caixa com o texto que pedimos para
// colar: nbsp vira espaço, cada linha é aparada e linhas vazias somem.
function normalizarTexto(texto) {
  return (texto || "")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join("\n");
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    DEFAULT_CONFIG,
    formatarNome,
    capitalizarFrases,
    montarMensagem,
    converterTextoDoEditor,
    normalizarTexto,
  };
}
