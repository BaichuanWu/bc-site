import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { runInThisContext } from "node:vm"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ts from "typescript"

const require = createRequire(import.meta.url)
const sourceRoot = fileURLToPath(new URL("../src/", import.meta.url))
const modules = new Map()

// Compile actual components and their local imports without a new test dependency.
function loadSource(relativePath) {
  const base = path.join(sourceRoot, relativePath)
  const filename = [base, `${base}.tsx`, `${base}.ts`].find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile())
  assert.ok(filename, `Source module exists: ${relativePath}`)
  if (modules.has(filename)) return modules.get(filename).exports
  const loadedModule = { exports: {} }
  modules.set(filename, loadedModule)
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const evaluate = runInThisContext(`(function(exports, require, module) {\n${compiled}\n})`, { filename })
  evaluate(loadedModule.exports, (specifier) => specifier.startsWith("@/") ? loadSource(specifier.slice(2)) : require(specifier), loadedModule)
  return loadedModule.exports
}

const { DataTable } = loadSource("components/common/data-table")

function table(item, columns, props = {}) {
  return renderToStaticMarkup(React.createElement(DataTable, {
    items: [item],
    columns: columns.map((column) => ({ title: column.key, ...column })),
    ...props,
  }))
}

test("default cells render nested settings, metrics and array entries", () => {
  const html = table({
    id: 1,
    settings: { neutralization: "INDUSTRY" },
    wqbData: { is: { returns: 0.125 } },
    checks: [{ name: "PASS" }],
  }, [
    { key: "settings.neutralization", truncate: true },
    { key: "wqbData.is.returns" },
    { key: "checks.0.name" },
  ])
  assert.match(html, />INDUSTRY</)
  assert.match(html, />0\.125</)
  assert.match(html, />PASS</)
})

test("custom rendering receives the nested value, original row and refresh callback", () => {
  const item = { id: 1, wqbData: { is: { drawdown: 0.042 } } }
  const onRefresh = () => {}
  const html = table(item, [{
    key: "wqbData.is.drawdown",
    render(value, row, refresh) {
      assert.equal(value, 0.042)
      assert.equal(row, item)
      assert.equal(refresh, onRefresh)
      return (value * 100).toFixed(2)
    },
  }], { onRefresh })
  assert.match(html, />4\.20</)
})

test("literal and dotted own properties take precedence, including null and undefined", () => {
  const item = {
    id: 1, name: "Alpha", settings: { neutralization: "INDUSTRY" },
    "settings.neutralization": "LITERAL",
  }
  assert.match(table(item, [{ key: "name" }, { key: "settings.neutralization" }]), />LITERAL</)
  assert.match(table(item, [{ key: "name" }]), />Alpha</)
  for (const expected of [null, undefined]) {
    table({ ...item, "settings.neutralization": expected }, [{
      key: "settings.neutralization",
      render(value) { assert.equal(value, expected); return "-" },
    }])
  }
})

test("missing and interrupted paths render safely without inherited values", () => {
  for (const settings of [undefined, null, "INDUSTRY", 0, false, {}, Object.create({ neutralization: "INHERITED" })]) {
    const html = table({ id: 1, settings }, [{ key: "settings.neutralization" }])
    assert.match(html, /<td[^>]*><\/td>/)
    table({ id: 1, settings }, [{
      key: "settings.neutralization",
      render(value) { assert.equal(value, undefined); return "-" },
    }])
  }
})

test("nested null and falsy leaves are preserved for default and custom rendering", () => {
  for (const expected of [null, 0, false, ""]) {
    const item = { id: 1, settings: { value: expected } }
    const html = table(item, [{ key: "settings.value" }])
    const display = expected === null ? "" : String(expected)
    assert.match(html, new RegExp(`<td[^>]*>${display}</td>`))
    table(item, [{
      key: "settings.value",
      render(value) { assert.equal(value, expected); return "custom" },
    }])
  }
})
