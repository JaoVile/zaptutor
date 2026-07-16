const test = require("node:test");
const assert = require("node:assert");
const {
  DEFAULT_CONFIG,
  formatarNome,
  capitalizarFrases,
  montarMensagem,
  converterTextoDoEditor,
  normalizarTexto,
} = require("../src/lib/format.js");

function cfg(extra) {
  return { ...DEFAULT_CONFIG, ...extra };
}

test("formatarNome: só o nome quando sem estilos", () => {
  assert.strictEqual(formatarNome(cfg({ nome: "João" })), "João");
});

test("formatarNome: negrito envolve em asteriscos", () => {
  assert.strictEqual(formatarNome(cfg({ nome: "João", negrito: true })), "*João*");
});

test("formatarNome: itálico envolve em underscores", () => {
  assert.strictEqual(formatarNome(cfg({ nome: "João", italico: true })), "_João_");
});

test("formatarNome: negrito + itálico", () => {
  assert.strictEqual(
    formatarNome(cfg({ nome: "João", negrito: true, italico: true })),
    "*_João_*"
  );
});

test("formatarNome: nome vazio retorna string vazia", () => {
  assert.strictEqual(formatarNome(cfg({ nome: "" })), "");
  assert.strictEqual(formatarNome(cfg({ nome: "   " })), "");
});

test("capitalizarFrases: início da string", () => {
  assert.strictEqual(capitalizarFrases("olá mundo"), "Olá mundo");
});

test("capitalizarFrases: após ponto/interrogação/exclamação", () => {
  assert.strictEqual(
    capitalizarFrases("olá. tudo bem? sim! claro"),
    "Olá. Tudo bem? Sim! Claro"
  );
});

test("capitalizarFrases: após quebra de linha", () => {
  assert.strictEqual(capitalizarFrases("linha um\nlinha dois"), "Linha um\nLinha dois");
});

test("montarMensagem: nome com dois-pontos em cima, mensagem embaixo", () => {
  const c = cfg({ nome: "João", quebraLinha: true, fraseMaiuscula: true });
  assert.strictEqual(montarMensagem(c, "olá, tudo bem?"), "João:\nOlá, tudo bem?");
});

test("montarMensagem: sem quebra de linha usa espaço", () => {
  const c = cfg({ nome: "João", quebraLinha: false, fraseMaiuscula: true });
  assert.strictEqual(montarMensagem(c, "olá"), "João: Olá");
});

test("montarMensagem: fraseMaiuscula desligada preserva o texto", () => {
  const c = cfg({ nome: "João", fraseMaiuscula: false });
  assert.strictEqual(montarMensagem(c, "olá"), "João:\nolá");
});

test("montarMensagem: nome vazio retorna só o corpo", () => {
  const c = cfg({ nome: "", fraseMaiuscula: true });
  assert.strictEqual(montarMensagem(c, "olá"), "Olá");
});

// O editor do WhatsApp (Lexical) representa cada linha como um <p>, e o
// innerText devolve "\n\n" entre linhas ("a\n\nb" = UMA quebra visual).
test("converterTextoDoEditor: par de \\n vira uma quebra lógica", () => {
  assert.strictEqual(converterTextoDoEditor("a\n\nb"), "a\nb");
});

test("converterTextoDoEditor: linha em branco intencional é preservada", () => {
  assert.strictEqual(converterTextoDoEditor("a\n\n\n\nb"), "a\n\nb");
});

test("converterTextoDoEditor: texto de uma linha passa intacto", () => {
  assert.strictEqual(converterTextoDoEditor("olá mundo"), "olá mundo");
});

test("converterTextoDoEditor: espaços das pontas são removidos", () => {
  assert.strictEqual(converterTextoDoEditor("  a\n\nb \n"), "a\nb");
});

test("normalizarTexto: colapsa quebras e apara linhas para comparação", () => {
  assert.strictEqual(normalizarTexto("João:\n\nOlá  "), "João:\nOlá");
  assert.strictEqual(normalizarTexto("João:\nOlá"), "João:\nOlá");
});

test("normalizarTexto: troca nbsp por espaço e ignora linhas vazias", () => {
  assert.strictEqual(normalizarTexto("a b\n\n\nc"), "a b\nc");
});
