import ReactMarkdown from "react-markdown"
const labels: Record<string, string> = { sourceDocument: "历史知识原文", sourceMetadata: "原始来源信息", minimum: "最小值", maximum: "最大值", count: "有值样本数",  prediction: "预期现象", observableRoles: "可观察变量", failureConditions: "失效条件", mechanism: "机制", fieldRoles: "字段角色", expressionSkeleton: "表达式模板", symptom: "症状", causeHypothesis: "原因假说", diagnostic: "诊断方法", action: "调整动作", control: "对照", sideEffects: "副作用", region: "市场", universe: "股票池", delay: "延迟", sharpe: "Sharpe", fitness: "Fitness", turnover: "换手率", returns: "收益", drawdown: "回撤", margin: "Margin" }
export function ValueView({ value }: { value: unknown }) {
  if (value == null || value === "") return <span className="text-muted-foreground">未记录</span>
  if (Array.isArray(value)) return value.length ? <ul className="list-inside list-disc space-y-1">{value.map((v, i) => <li key={i}><ValueView value={v} /></li>)}</ul> : <span className="text-muted-foreground">未记录</span>
  if (typeof value === "object") return <dl className="space-y-3">{Object.entries(value).map(([k, v]) => <div key={k}><dt className="text-sm font-medium text-muted-foreground">{labels[k] || k}</dt><dd className="mt-1 whitespace-pre-wrap break-words">{k === "sourceDocument" && typeof v === "string" ? <ReactMarkdown>{v}</ReactMarkdown> : <ValueView value={v} />}</dd></div>)}</dl>
  return <span>{String(value)}</span>
}
