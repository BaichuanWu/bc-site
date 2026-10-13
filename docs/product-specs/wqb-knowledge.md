# WQB 知识与文档

入口 `/dashboard/wqb/knowledge` 使用公共列表壳、搜索筛选、表格和 offset 分页。普通浏览使用当前版本，可按“可复用知识 / 文档”、主题、文档用途和适用条件筛选。主列展示标题、身份、内容类型、主题、文档用途、适用范围与摘要；入库渠道、历史 state 和批次不作为主要分类。

`KNOWLEDGE` 保存可脱离会话理解的抽象方法、概念、经验和模板。`DOCUMENT` 保存受治理用途允许的正式探索报告或用户明确指定文档。用途不认证结论正确性；报告的个案成绩不能作为普适结论。适用范围为空明确显示“未声明”。

详情按稳定 reference 展示正文、主题、用途、适用范围、元数据和版本选择。保留记录的历史精确引用继续可读；清理删除的记录返回现有 404，可通过库外备份显式恢复。前端不重新评分。大型原始迁移 payload 不在主列表传输。

正文按 Markdown/GFM 文档渲染，支持表格、强调和安全链接。保存内容中的原始 HTML 保持惰性，不生成活动 iframe、脚本或脚本协议链接。恢复工作区时清除已删除的通用 Knowledge 与 exploration-receipts 页签，并保留 WQB Knowledge、分类和 Research 页签。

两类名称与用途由 bc-wqb 管理，bc-core 暴露筛选，bc-site 展示含义。旧 kind 新筛选和写入返回迁移提示；旧值只可能出现在保留历史版本。跨项目治理变更位于 workspace OpenSpec `govern-wqb-knowledge-content`。
