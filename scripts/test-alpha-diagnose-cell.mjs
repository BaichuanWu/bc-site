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

const { AlphaDiagnoseCell } = loadSource("components/alpha/alpha-diagnose-cell")
const issue = (key, state) => ({ key, state, details: `${key} details` })
const renderCell = (props) => renderToStaticMarkup(React.createElement(AlphaDiagnoseCell, { alphaId: 123, ...props }))

test("Diagnose counts checks and all additional conditions in every issue state", () => {
  const html = renderCell({
    raBlockCount: 1,
    ppaBlockCount: 0,
    diagnostics: {
      RA: [issue("fitness", "REJECT"), issue("margin", "REJECT")],
      PPA: [issue("margin", "REJECT"), issue("correlation", "PENDING"), issue("simulation", "BLOCKED")],
    },
  })
  assert.match(html, />RA 2</)
  assert.match(html, />PPA 3</)
})

test("empty diagnosis arrays display zero counts", () => {
  const html = renderCell({ diagnostics: { RA: [], PPA: [] } })
  assert.match(html, />RA 0</)
  assert.match(html, />PPA 0</)
})

test("unavailable diagnosis never infers a diagnosis count from persisted check counts", () => {
  const html = renderCell({ raBlockCount: 0, ppaBlockCount: 4 })
  assert.match(html, /Diagnosis unavailable/)
  assert.doesNotMatch(html, />RA \d+</)
  assert.doesNotMatch(html, />PPA \d+</)
})
