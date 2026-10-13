export type WqbKnowledgeHit = {
  reference: string
  identity: string
  title: string
  origin: "DATABASE" | "FILE" | "NOTE"
  excerpt: string
  contentOffset: number
  metadata: Record<string, unknown>
  indexStatus: string
  sourceStatus: string
}

export type WqbKnowledge = {
  reference: string
  identity: string
  title: string
  fingerprint: string
  predecessor: string | null
  content: string
  contentLength: number
  contentOffset: number
  contentTruncated: boolean
  metadata: Record<string, unknown>
  revisions: { reference: string; fingerprint: string; title: string }[]
  revisionCount: number
  indexStatus: string
  sourceStatus: string
}

export type WqbKnowledgePage = {
  items: WqbKnowledgeHit[]
  total: number
  offset: number
  limit: number
}

export function knowledgeHref(reference: string) {
  return `/dashboard/wqb/knowledge/${encodeURIComponent(reference)}`
}

export function knowledgeKindLabel(kind: unknown) {
  if (kind === "KNOWLEDGE") return "可复用知识"
  if (kind === "DOCUMENT") return "文档"
  return typeof kind === "string" ? kind : "—"
}

export function knowledgeDocumentRoleLabel(role: unknown) {
  if (role === "ALPHA_EXPLORATION_REPORT") return "Alpha 探索报告"
  if (role === "USER_REQUESTED_DOCUMENT") return "用户指定文档"
  return typeof role === "string" && role ? role : "—"
}

export function knowledgeScope(metadata: Record<string, unknown>) {
  const scope = ["region", "delay", "universe", "category", "dataset", "datafield"]
    .filter((key) => metadata[key] !== undefined && metadata[key] !== null && metadata[key] !== "")
    .map((key) => `${key}: ${String(metadata[key])}`)
  return scope.length ? scope.join(" · ") : "未声明"
}

export function decodeKnowledgeRouteSegment(segment: string) {
  // App Router keeps this segment encoded; decode once to preserve literal escapes.
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}
