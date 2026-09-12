# WQB 知识与实际效果

入口 `/dashboard/wqb/knowledge`，每行是一项知识。列表沿用 WQB Alpha 页的公共搜索筛选、表格密度、排序和 offset 分页；支持八类知识筛选和词法搜索，重点展示经济学逻辑、模板和优化手段。列表包含当前版本、成熟度、实际采用/历史应用数量、证据及有限的同设置表现预览。

详情 `/dashboard/wqb/knowledge/{id}?version={version}` 展示知识正文、适用边界、按条件分组的实例表现、证据展开、关系、使用记录、导入映射和版本选择。实例中的原始结果与调整记录按需展开。表格或数字缺失明确标注，不把缺证据渲染成失败或零分。

效果范围限定 API 明示的实例页；历史背景实例不等于机制验证。归因、成熟度和指标口径完全使用 bc-wqb 返回结果，前端不重新评分。来源正文以文本/Markdown 展示，结构内容使用带标签的字段视图；大型原始迁移 payload 不在主列表传输。

列表使用公共 CrudLayout、SearchFilterGroup 和 DataTable，详情使用 DetailPageLayout 和 WorkspaceLink；feature 内容组件位于 components/wqb-knowledge。保留现有通用 knowledge 和 research 页面。

真实验收样本：模板 8 的版本 2（investment effect，关联历史实例）；知识 3990（Two-field alpha taxonomy and AST template）；知识 3991（CONCENTRATED_WEIGHT warning repair with ts_backfill，缺独立验证证据）。样本标识来自当前授权数据库，其他环境按导入映射定位。
