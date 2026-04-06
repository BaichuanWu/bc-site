# Dashboard Architecture Standard

## Core Principle
页面结构由公共壳层驱动，业务页面只负责填充内容，不负责决定页面外层布局。页面级 spacing、头部结构和 tab 关闭规则都属于平台层职责。

## Semantic Design Rule
公共组件表达的是“层级职责”和“通用能力”，不是某个具体页面当前长什么样。

规则：
- 壳层组件表达页面级结构，不表达具体资源语义。
- 组合组件表达列表、详情、筛选、分页这类通用工作流，不表达 `agent/workflow/wqb` 这类资源特例。
- 内容组件表达展示能力，不表达页面导航或返回来源。
- 如果一个组件的 prop 或内部判断开始依赖具体模块名、页面路径、来源页语义，通常说明层级设计已经偏了。

## Layering Model
- `Shell Layer`
  - 负责页面级 spacing、头部结构、整体节奏。
- `Page Composition Layer`
  - 负责组织页面所需的业务模块和数据流。
- `Content Layer`
  - 负责 table、card、form、filters、detail sections 等具体内容。

业务组件必须处于正确层级，不能跨层承担壳层职责。

## Approved Shells
- `PageShell`
  - 负责页面级 padding 和主内容纵向节奏。
- `ListPageShell`
  - 负责标准列表页头部结构。
- `DetailPageLayout`
  - 负责标准详情页头部与内容布局。

## Responsibilities

### PageShell
- 提供统一页面级 spacing。
- 是页面外边距的唯一来源。
- 不承载业务逻辑。
- 不感知页面属于哪个模块。

### ListPageShell
- 建立 `icon + title + actions` 顶部结构。
- 承接列表页整体结构。
- 不负责数据获取。
- 不负责列表内部的业务行为。
- 不感知当前列表是 `agent`、`workflow` 还是其他资源。

### CrudLayout
- 负责列表页常规数据组织能力：
  - filters
  - data area
  - pagination
  - add action
- 当作为页面根使用时，应通过 shell 输出完整列表页。
- 当作为嵌入块使用时，应启用 `embedded` 模式，避免重复页面头部与外层 spacing。
- 当内部使用 `DataTable` sticky header 时，`CrudLayout` 所在区域应保持单一主滚动容器。
- 如果某个页面需要大量 `if resource === ...` 的分支，应优先拆出上层组合组件，而不是继续污染 `CrudLayout`。

### DataTable
- sticky header 是可选能力，由 `stickyTop` 控制。
- `stickyTop=0` 表示直接贴住宿主滚动容器顶部。
- 如果宿主滚动容器内部还有固定工具条，可通过 `stickyTop` 提供偏移量。
- 页面主内容区负责纵向滚动，table 自身只负责横向滚动。
- 对于带显式列宽或固定列的复杂 table，优先使用分离式 header/body 结构来稳定 sticky header。
- 如果 table 被嵌入 modal、drawer、card body 等局部区域，外层必须显式保证只有一个有效滚动祖先。
- `DataTable` 只表达表格展示和交互能力，不负责页面导航、路由语义和资源上下文。

### DetailPageLayout
- 承接详情页标题区、动作区、侧栏区。
- 内部 section 可以有自己的 padding，但页面根 spacing 仍由 `PageShell` 提供。
- 标准编辑页动作区只承载当前页动作，不承载列表返回按钮。
- 不感知详情页来自哪个列表，也不感知返回目标。

### Create / Edit Detail Components
- `create` 和 `edit` 默认必须共用一个 detail component。
- route page 只负责传递 `mode`、`id` 或少量上下文参数。
- detail component 内部统一处理：
  - create default state
  - edit data fetch and hydrate
  - save branching (`POST` vs `PUT`)
- 只有在 create 和 edit 的页面结构本身完全不同，才允许拆分成两个组件。

### Workspace Tabs
- tab 可关闭策略和关闭回退策略属于 workspace 平台行为。
- 页面本身不应自定义“关闭后跳转到哪里”的局部逻辑。

## Forbidden Patterns
- 页面根节点直接写 `p-*` 作为页面外边距。
- 页面根节点直接写 `space-y-*` 作为页面主节奏。
- 每个列表页单独实现 header/filter/content 三段结构。
- 在业务页面中重复实现页面级 actions 折叠逻辑。
- 用内容组件承担页面壳层职责。
- 在页面内部绕过 workspace 标准 tab 行为。
- 为同一类资源分别维护一套 `CreatePage` 和一套 `EditPage` UI，而它们只是在参数和加载行为上不同。
- 在 `DataTable` 外层继续叠加多个 `overflow-auto/hidden/scroll` 容器，并期望 sticky header 仍然稳定工作。
- 在公共组件内部写死某个资源模块、来源页或固定路由语义。
- 通过 prop 命名把通用组件绑死到当前业务，例如 `agentActions`、`workflowBackTo` 这类上下文泄漏。

## File Organization Guidance
- 公共壳层放在 `src/components/common`
- workspace/tab 状态规则放在 `src/lib/workspace-tabs.ts`
- dashboard 页面优先做薄页面，只组合公共层与业务内容
- 若某个列表页仍有大量页面级布局逻辑，应优先抽回公共层而不是继续堆在 page 文件中

## When To Create A New Shell
只有满足下列任一条件时才应新增壳层：
- 现有 `PageShell / ListPageShell / DetailPageLayout` 无法表达页面类型
- 多个页面共享新的稳定结构
- 该结构属于页面级抽象，而不是单页定制

否则，优先扩展现有公共壳层。

## Default Build Path
新增 dashboard 页面时，默认按以下路径实现：
1. 判断页面类型是 `Overview`、`List Page`、`Detail Page` 还是 `Special Page`
2. 先选择壳层，再实现业务内容
3. 业务内容优先嵌入现有公共组件
4. 如果发现需要重复复制页面级布局，先回头补公共层再继续开发
