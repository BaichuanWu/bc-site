# Dashboard UI Standard

## Goal
Dashboard 必须呈现统一、可预测的工作台体验。页面外层结构、间距、头部层级和 tab 规则都由公共规范约束，不能由单页自由发挥。

## Approved Page Types
- `Overview`
  - 唯一特殊页。
  - 用于总览信息。
  - 是唯一默认不可关闭的 tab。
- `List Page`
  - dashboard 一级功能页的默认类型。
  - 一级页应优先实现为列表页，而不是自定义壳层页面。
- `Detail Page`
  - 从列表页进入的创建、编辑、查看页面。
- `Special Page`
  - 仅在现有壳层无法表达页面需求时允许使用。
  - 例如全屏编辑器、复杂分析视图。

## Approved Top-Level Pages
- `Overview`
- `WQB Alpha`
- `Workflow`
- `Knowledge`
- `Agents`
- `LLM Config`
- `System Tasks`

## List Page Structure
标准列表页固定为三段结构：
1. Header
2. Filter
3. Content

### Header
- 只显示 `icon + 一级标题`。
- 右侧只承载页面级操作。
- 页面级操作超过 2 个时，折叠为统一的 `Actions` 入口。
- 标准列表页默认不显示长描述文案。
- 如确有必要显示说明，只允许使用短辅助文案，且不能破坏标题行的紧凑性。

### Filter
- 默认展开。
- 视觉上必须紧贴列表内容，不可形成松散的大块留白。
- 用于承载查询、筛选、模板保存/加载等列表控制项。
- filter 区必须是列表页结构的一部分，不应由页面单独拼装。

### Content
- 支持 table、card、custom renderer。
- 内容组件只负责内容展示，不负责页面级间距。
- 内容区允许有卡片级、section 级 spacing，但不得重新定义页面外边距。

## Detail Page Structure
- 使用统一详情页壳层。
- 顶部允许显示标题、副标题、状态徽标、返回/保存按钮。
- 表单区、附属信息区、版本区之间允许使用 section 级 padding。
- 详情页不得重新定义页面级外边距。

## Spacing Rules
- 页面级 spacing 只能由外层 shell 控制。
- 业务页面根节点不得自行定义页面外边距，例如 `p-6`、`px-6 py-4`、`space-y-6`。
- 内容组件可以定义内部 spacing，例如 card padding、section padding、form gap。
- 如需不同页面节奏，优先扩展 shell，而不是在页面根节点直接覆写。

## Tab Rules
- `Overview` 是唯一不可关闭 tab。
- 其他 dashboard 页面默认都可关闭。
- 关闭当前 tab 后，回到最近使用的上一个 tab。
- 附属页面可以打开为 tab，但不得因为特殊处理破坏上述关闭规则。

## WQB Rules
- `WQB Alpha` 是 WQB 模块当前唯一一级入口。
- `Alpha Analysis` 是附属页面，不作为一级导航页。
- 不再保留 `WQB AI Agent` 一级页面。
