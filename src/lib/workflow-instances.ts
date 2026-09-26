export type WorkflowNodeState = {
  status: string
  autoAdvance: boolean
  attemptId: number | null
}

export type WorkflowAttempt = {
  id: number
  nodeKey: string
  ordinal: number
  status: string
  inputJson: Record<string, unknown>
  outputJson: Record<string, unknown>
  validationJson: Record<string, unknown>
  taskId: number
  agentExecutionId: number
  errorLog: string
}

export type WorkflowInstance = {
  id: number
  definitionId: number
  definitionJson: {
    name: string
    // api-casing-ignore-next-line: Workflow DSL JSON retains its canonical snake_case keys.
    nodes: Array<{ key: string; agent_id?: number; output_mapping?: Record<string, string> }>
    edges: Array<{ from: string; to: string; type?: string }>
  }
  inputJson: Record<string, unknown>
  stateJson: Record<string, unknown>
  nodesJson: Record<string, WorkflowNodeState>
  configJson: Record<string, unknown>
  status: string
  revision: number
  parentInstanceId: number
  attempts?: WorkflowAttempt[]
}

export function currentAttempt(instance: WorkflowInstance, key: string): WorkflowAttempt | undefined {
  const id = instance.nodesJson[key]?.attemptId
  return instance.attempts?.find((attempt) => attempt.id === id)
}
