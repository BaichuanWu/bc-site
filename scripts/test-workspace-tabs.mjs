import assert from "node:assert/strict"
import fs from "node:fs"
import test from "node:test"
import ts from "typescript"

const source = fs.readFileSync(new URL("../src/lib/workspace-tabs.ts", import.meta.url), "utf8")
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { ensureWorkspaceDefaults, createDefaultWorkspaceState, buildWorkspaceTabKey } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`
)

function tab(pathname, title) {
  return { key: pathname, pathname, title, closable: true, lastVisitedAt: 1 }
}

test("retired Knowledge tabs are removed without losing WQB or Research tabs", () => {
  const state = ensureWorkspaceDefaults({
    tabs: [
      ...createDefaultWorkspaceState().tabs,
      tab("/dashboard/knowledge", "Knowledge"),
      tab("/dashboard/knowledge/42", "Old document"),
      tab("/dashboard/wqb/knowledge", "WQB Knowledge"),
      tab("/dashboard/research", "Research"),
    ],
    activeTabKey: "/dashboard/knowledge",
  })
  assert.deepEqual(state.tabs.map(({ pathname }) => pathname), [
    "/dashboard", "/dashboard/wqb/knowledge", "/dashboard/research",
  ])
  assert.equal(state.activeTabKey, "/dashboard")
})

test("an active WQB tab survives retirement and Overview is restored when absent", () => {
  const state = ensureWorkspaceDefaults({
    tabs: [tab("/dashboard/knowledge", "Knowledge"), tab("/dashboard/wqb/knowledge", "WQB Knowledge")],
    activeTabKey: "/dashboard/wqb/knowledge",
  })
  assert.equal(state.activeTabKey, "/dashboard/wqb/knowledge")
  assert.equal(state.tabs[0].pathname, "/dashboard")
  assert.equal(state.tabs[0].closable, false)
})

test("retired exploration list and normalized detail tabs cannot become active", () => {
  const retired = ["/dashboard/wqb/exploration-receipts", "/dashboard/wqb/exploration-receipts/42"]
  for (const active of retired) {
    const state = ensureWorkspaceDefaults({
      tabs: [
        ...retired.map((path) => ({ ...tab(path, "Retired"), key: buildWorkspaceTabKey(path) })),
        tab("/dashboard/wqb/knowledge", "WQB Knowledge"),
        tab("/dashboard/wqb/dataset-classifications", "Classifications"),
        tab("/dashboard/research", "Research"),
      ],
      activeTabKey: buildWorkspaceTabKey(active),
    })
    assert.deepEqual(state.tabs.map(({ pathname }) => pathname), [
      "/dashboard", "/dashboard/wqb/knowledge", "/dashboard/wqb/dataset-classifications", "/dashboard/research",
    ])
    assert.equal(state.activeTabKey, "/dashboard")
  }
})
