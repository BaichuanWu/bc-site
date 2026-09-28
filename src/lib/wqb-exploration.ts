export type Scope = { instrumentType: string; region: string; delay: number; universe: string; category: string; dataset: string }
export type BrowserPage<T> = { items: T[]; total: number; offset: number; limit: number }
export type ExplorationReceipt = Scope & {
  id: number; receiptKey: string; stage: string; directionIds: string[]; researchScore: number | null
  note: string; details: Record<string, unknown>; knowledgeIds: number[]; catalogFingerprint: string | null
  supersedesReceiptKey: string | null; directionPolicyVersion: string | null
}
export type DatasetCategory = { id: string; label: string; conceptIds: string[]; measurementObject: string; researchScore: number; note: string }
export type FieldDecision = { fieldId: string; status: string; explanation: string; mappings: Record<string, unknown>[] }
export type DatasetClassification = Scope & {
  id: number; classificationId: number; version: number; status: string; catalogFingerprint: string
  vocabularyVersion: string; inventoryTotal: number; decidedCount?: number
  categories: DatasetCategory[]; items?: FieldDecision[]; offset?: number; limit?: number
}
