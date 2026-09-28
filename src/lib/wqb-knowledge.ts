export type WqbKnowledgeSection = { key: string; title: string; markdown: string }
export type WqbStructuredContent = {
  schemaVersion: number
  summary: string
  sections: WqbKnowledgeSection[]
  unclassified: boolean
  sourceFormat: string
}

export type WqbKnowledge = {
  id: number
  batchNo: string
  state: 0 | 10
  region: string | null
  delay: number | null
  universe: string | null
  category: string | null
  dataset: string | null
  datafield: string | null
  topic: string | null
  content: string
  structuredContent?: WqbStructuredContent | null
  contentSummary?: string | null
  contentFormatVersion?: number | null
  contentLength: number
  contentOffset: number
  contentTruncated: boolean
}

export type WqbKnowledgePage = {
  items: WqbKnowledge[]
  total: number
  offset: number
  limit: number
}
