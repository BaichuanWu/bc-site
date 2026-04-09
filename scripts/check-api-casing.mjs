import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const srcRoot = path.join(projectRoot, "src")
const targetFiles = []

const IGNORE_NEXT_LINE = "api-casing-ignore-next-line"
const IGNORE_FILE = "api-casing-ignore-file"

const BANNED_TOKENS = [
  "task_id",
  "session_id",
  "task_ids",
  "workflow_id",
  "definition_json",
  "agent_classes",
  "config_specs",
  "node_types",
  "edge_types",
  "today_submitted",
  "rate_limit",
  "last_fetch_time",
  "source_type",
  "content_type",
  "doc_type",
  "doc_key",
  "namespace_hint",
  "source_ref",
  "related_object_type",
  "related_object_id",
  "raw_status",
  "document_status",
  "agent_id",
  "agent_class",
  "version_description",
  "config_json",
  "is_active",
  "model_name",
  "api_key",
  "base_url",
]

const BANNED_TOKEN_PATTERN = new RegExp(`\\b(${BANNED_TOKENS.join("|")})\\b`, "g")

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
      continue
    }
    if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      targetFiles.push(fullPath)
    }
  }
}

function formatRelative(filePath) {
  return path.relative(projectRoot, filePath)
}

walk(srcRoot)

const violations = []

for (const filePath of targetFiles) {
  const content = fs.readFileSync(filePath, "utf8")

  if (content.includes(IGNORE_FILE)) {
    continue
  }

  const lines = content.split("\n")
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const previousLine = index > 0 ? lines[index - 1] : ""

    if (previousLine.includes(IGNORE_NEXT_LINE)) {
      continue
    }

    const matches = line.match(BANNED_TOKEN_PATTERN)
    if (!matches || matches.length === 0) {
      continue
    }

    violations.push({
      filePath,
      lineNumber: index + 1,
      tokens: [...new Set(matches)].join(", "),
      source: line.trim(),
    })
  }
}

if (violations.length === 0) {
  console.log("API casing check passed.")
  process.exit(0)
}

console.error("API casing check failed.")
console.error("")
console.error("Frontend API contract code should use camelCase.")
console.error("If a line is an intentional exception, add `api-casing-ignore-next-line` above it or `api-casing-ignore-file` near the top of the file with a short reason.")
console.error("")

for (const violation of violations) {
  console.error(`${formatRelative(violation.filePath)}:${violation.lineNumber}`)
  console.error(`  Suspicious tokens: ${violation.tokens}`)
  console.error(`  ${violation.source}`)
  console.error("")
}

process.exit(1)
