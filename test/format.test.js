const test = require("node:test");
const assert = require("node:assert");
const {
  DEFAULT_CONFIG,
  formatarNome,
  capitalizarFrases,
  montarMensagem,
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

test("montarMensagem: nome em cima, linha em branco, mensagem embaixo", () => {
  const c = cfg({ nome: "João", quebraLinha: true, fraseMaiuscula: true });
  assert.strictEqual(montarMensagem(c, "olá, tudo bem?"), "João\n\nOlá, tudo bem?");
});

test("montarMensagem: sem quebra de linha usa espaço", () => {
  const c = cfg({ nome: "João", quebraLinha: false, fraseMaiuscula: true });
  assert.strictEqual(montarMensagem(c, "olá"), "João Olá");
});

test("montarMensagem: fraseMaiuscula desligada preserva o texto", () => {
  const c = cfg({ nome: "João", fraseMaiuscula: false });
  assert.strictEqual(montarMensagem(c, "olá"), "João\n\nolá");
});

test("montarMensagem: nome vazio retorna só o corpo", () => {
  const c = cfg({ nome: "", fraseMaiuscula: true });
  assert.strictEqual(montarMensagem(c, "olá"), "Olá");
});
