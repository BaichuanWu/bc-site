import assert from "node:assert/strict"
import fs from "node:fs"
import { createRequire } from "node:module"
import test from "node:test"
import { runInThisContext } from "node:vm"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import ts from "typescript"

const require = createRequire(import.meta.url)
let routeId
let request
let tabRoute
let knowledgeFixture

const container = ({ children }) => React.createElement("div", null, children)
const mocks = {
  "next/navigation": { useParams: () => ({ id: routeId }) },
  "next/link": { default: ({ children, href }) => React.createElement("a", { href }, children) },
  "swr": { default: (key) => { request = key; return { data: knowledgeFixture, isLoading: !knowledgeFixture } } },
  "react-markdown": { default: ReactMarkdown },
  "remark-gfm": { default: remarkGfm },
  "@/components/common/detail-page-layout": { DetailPageLayout: container },
  "@/components/ui/button": { Button: container },
  "@/components/ui/card": Object.fromEntries(["Card", "CardContent", "CardHeader", "CardTitle"].map((name) => [name, container])),
  "@/hooks/use-workspace-tab-title": { useWorkspaceTabTitle: (route) => { tabRoute = route } },
  "@/lib/api": { fetcher: () => {} },
}
for (const mockedModule of Object.values(mocks)) mockedModule.__esModule = true

function loadSource(relativePath) {
  const filename = new URL(`../src/${relativePath}`, import.meta.url)
  const loadedModule = { exports: {} }
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
    },
  }).outputText
  const evaluate = runInThisContext(`(function(exports, require, module) {\n${compiled}\n})`, { filename: filename.pathname })
  evaluate(loadedModule.exports, (specifier) => mocks[specifier] ?? require(specifier), loadedModule)
  return loadedModule.exports
}

mocks["@/lib/wqb-knowledge"] = loadSource("lib/wqb-knowledge.ts")
const KnowledgePage = loadSource("app/dashboard/wqb/knowledge/[id]/page.tsx").default

function renderRoute(segment) {
  routeId = segment
  knowledgeFixture = undefined
  request = tabRoute = undefined
  renderToStaticMarkup(React.createElement(KnowledgePage))
  assert.ok(request)
  const apiPath = new URL(request, "http://test").pathname
  return decodeURIComponent(apiPath.slice("/quants/wqb/knowledge/".length))
}

function renderContent(content) {
  routeId = "db%3A7"
  knowledgeFixture = {
    reference: "db:7@" + "a".repeat(64),
    identity: "db:7",
    title: "Saved Knowledge",
    fingerprint: "a".repeat(64),
    predecessor: null,
    content,
    contentLength: Array.from(content).length,
    contentOffset: 0,
    contentTruncated: false,
    metadata: {},
    revisions: [],
    revisionCount: 0,
    indexStatus: "READY",
    sourceStatus: "ACTIVE",
  }
  return renderToStaticMarkup(React.createElement(KnowledgePage))
}

const reportedReference = "batch:glb-d1-20261008-round-lessons:45aaf395cf21fcd1932f8d663c138256586a592f74458c44958b523fd92eac68@88d3a96b4d22e9266a1c8bc7285eff0af8ae788f2025b5e96a0cef7e7015ad54"

test("reported list link requests the original batch version and keeps the tab URL", () => {
  const href = mocks["@/lib/wqb-knowledge"].knowledgeHref(reportedReference)
  assert.equal(renderRoute(href.slice("/dashboard/wqb/knowledge/".length)), reportedReference)
  assert.equal(tabRoute, href)
})

test("file links preserve slashes, Unicode and authored percent sequences", () => {
  for (const reference of ["file:subdir/研究.md@" + "a".repeat(64), "file:100%25%20complete.md", "note:user@example.com@" + "b".repeat(64)]) {
    assert.equal(renderRoute(encodeURIComponent(reference)), reference)
    assert.equal(tabRoute, mocks["@/lib/wqb-knowledge"].knowledgeHref(reference))
  }
})

test("numeric and existing database version links retain compatibility", () => {
  assert.equal(renderRoute("0007"), "db:7")
  assert.equal(tabRoute, "/dashboard/wqb/knowledge/0007")
  const reference = "db:7@" + "c".repeat(64)
  assert.equal(renderRoute(encodeURIComponent(reference)), reference)
})

test("malformed percent escapes do not crash rendering", () => {
  for (const segment of ["note:100%", "file:bad%ZZ.md", "file:%E0%A4.md"]) {
    assert.equal(renderRoute(segment), segment)
  }
})

test("saved HTML cannot create executable frames, scripts or image handlers", () => {
  const markup = renderContent([
    '<iframe srcdoc="<script>parent.document.body.dataset.probe=1</script>"></iframe>',
    '<script>document.body.dataset.probe=1</script>',
    '<img src="missing" onerror="document.body.dataset.probe=1">',
  ].join("\n\n"))
  assert.doesNotMatch(markup, /<iframe\b/i)
  assert.doesNotMatch(markup, /<script\b/i)
  assert.doesNotMatch(markup, /<img\b[^>]*\bonerror\s*=/i)
})

test("unsafe link protocols stay inert while HTTPS links remain usable", () => {
  const markup = renderContent([
    "[unsafe](javascript:alert(1))",
    "[mixed case](JaVaScRiPt:alert(1))",
    "[reference](https://example.org/research)",
  ].join("\n\n"))
  assert.doesNotMatch(markup, /href=["'][^"']*javascript:/i)
  assert.match(markup, /<a href="https:\/\/example\.org\/research">reference<\/a>/)
})

test("saved Markdown retains headings, emphasis and GFM tables", () => {
  const markup = renderContent([
    "# Research finding",
    "A **verified** observation with *limits*.",
    "| Claim | Evidence |\n| --- | --- |\n| Timing | Disclosure |",
  ].join("\n\n"))
  assert.match(markup, /<h1>Research finding<\/h1>/)
  assert.match(markup, /<strong>verified<\/strong>/)
  assert.match(markup, /<em>limits<\/em>/)
  assert.match(markup, /<table>/)
  assert.match(markup, /<th>Evidence<\/th>/)
  assert.match(markup, /<td>Disclosure<\/td>/)
})
