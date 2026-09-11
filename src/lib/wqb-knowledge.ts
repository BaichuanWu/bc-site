export const knowledgeKinds: Record<string, string> = {
  MECHANISM: "经济学逻辑", TEMPLATE: "Alpha 模板", REPAIR: "优化手段", DATA_PROFILE: "数据画像",
  IMPLEMENTATION: "实现方法", EXPERIMENT_METHOD: "实验方法", BOUNDARY: "适用边界", EFFICIENCY: "研究效率",
}
export const maturityNames: Record<string, string> = { UNVALIDATED: "待验证", SUPPORTED: "有支持证据", VALIDATED: "已独立验证", CONTESTED: "存在争议", RETIRED: "已停用" }
export type Knowledge = {
  id: number; kind: string; status: string; currentVersion?: number; sourceContextAvailable?: boolean;
  revision: { id: number; version: number; title: string; statement: string; maturity: string; content?: Record<string, unknown>; applicability: Record<string, unknown>; boundaries: string[] };
  effects: { performancePreview: { scopeComplete: boolean; settings: Record<string, unknown>; sampleCount: number; sharpeMin: number | string | null; sharpeMax: number | string | null }[]; performancePreviewTruncated: boolean; applicationCount: number; evidence: { effect: string; count: number; clusterCount: number }[]; usage: Record<string, number>; gaps: string[]; asOf: string };
}
export type CursorPage<T> = { items: T[]; nextCursor: number | null }
export type Evidence = { id: number; evidenceType: string; evidenceId: number; effect: string; clusterKey: string }
export function evidenceSummary(item: Knowledge) {
  const labels: Record<string, string> = { SUPPORTS: "支持", CONTRADICTS: "反证", CONTEXT: "背景实例" }
  return item.effects.evidence.map(e => `${labels[e.effect] || e.effect} ${e.count}`).join(" · ") || "尚无关联证据"
}
