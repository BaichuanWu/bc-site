import fs from "node:fs"
import path from "node:path"

const projectRoot = process.cwd()
const dashboardRoot = path.join(projectRoot, "src", "app", "dashboard")
const targetFiles = []

const ROOT_LEVEL_TAGS = ["div", "main", "section", "article"]
const FORBIDDEN_TOKEN_PATTERN = /\b(?:p-(?:4|5|6|8|10|12)|px-(?:4|5|6|8|10|12)|py-(?:4|5|6|8|10|12)|space-y-(?:4|5|6|8|10|12))\b/g
const IGNORE_NEXT_LINE = "dashboard-standards-ignore-next-line"
const IGNORE_FILE = "dashboard-standards-ignore-file"

function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) {
            walk(fullPath)
            continue
        }
        if (entry.name === "page.tsx") {
            targetFiles.push(fullPath)
        }
    }
}

function getLineIndent(line) {
    const match = line.match(/^(\s*)/)
    return match ? match[1].length : 0
}

function hasRootLevelTag(line) {
    return ROOT_LEVEL_TAGS.some((tag) => line.includes(`<${tag}`))
}

function formatRelative(filePath) {
    return path.relative(projectRoot, filePath)
}

walk(dashboardRoot)

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

        if (!line.includes("className=")) {
            continue
        }

        if (previousLine.includes(IGNORE_NEXT_LINE)) {
            continue
        }

        if (!hasRootLevelTag(line)) {
            continue
        }

        if (getLineIndent(line) > 12) {
            continue
        }

        const matches = line.match(FORBIDDEN_TOKEN_PATTERN)
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
    console.log("Dashboard standards check passed.")
    process.exit(0)
}

console.error("Dashboard standards check failed.")
console.error("")
console.error("Avoid page-level spacing in dashboard page roots. Move spacing to PageShell or an approved shell.")
console.error("If a page really needs an exception, add a nearby comment with `dashboard-standards-ignore-next-line` or `dashboard-standards-ignore-file` and explain why.")
console.error("")

for (const violation of violations) {
    console.error(`${formatRelative(violation.filePath)}:${violation.lineNumber}`)
    console.error(`  Suspicious tokens: ${violation.tokens}`)
    console.error(`  ${violation.source}`)
    console.error("")
}

process.exit(1)
