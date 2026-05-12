export type JsonValue = unknown

export type ResearchCounts = {
  knowledge?: number
  proposals?: number
  iterationCandidates?: number
  childResults?: number
  experiments?: number
  knowledgeRows?: number
}

export type ResearchRun = {
  id: number
  ref: string
  versionRef?: string
  title?: string
  displayName: string
  status: number
  statusName: string
  input?: JsonValue
  hypothesis?: JsonValue
  result?: JsonValue
  metrics?: Record<string, unknown>
  counts?: ResearchCounts
  trace?: ResearchTraceItem[]
  startedTime?: string
  finishedTime?: string
  errorLog?: string
  metadata?: Record<string, unknown>
}

export type ResearchExperiment = {
  id: number
  runId: number
  parentExperimentId?: number | null
  depth: number
  parentPath?: string
  ref: string
  versionRef?: string
  candidateRef?: string
  candidateVersionRef?: string
  displayName: string
  status: number
  statusName: string
  metrics?: Record<string, unknown>
  proposalCount?: number
  candidateCount?: number
  knowledgeCount?: number
  startedTime?: string
  finishedTime?: string
  errorLog?: string
  hypothesis?: JsonValue
  mutation?: JsonValue
  input?: JsonValue
  output?: JsonValue
  trace?: ResearchTraceItem[]
  feedback?: JsonValue
  attribution?: JsonValue
  artifacts?: JsonValue
  knowledge?: ResearchKnowledge[]
}

export type ResearchKnowledge = {
  id: number
  ref: string
  versionRef?: string
  experimentId: number
  status: number
  statusName: string
  content: string
  confidence: number
  sourceRefs?: string[]
  typ?: string
  knowledgeRef?: string
  applyScope?: string[]
  metadata?: Record<string, unknown>
  publishedTime?: string
}

export type ResearchTraceItem = {
  phase?: string
  title?: string
  time?: string
  summary?: string
  metadata?: Record<string, unknown>
}
