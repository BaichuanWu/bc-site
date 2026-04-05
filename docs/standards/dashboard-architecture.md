# Dashboard Architecture Standard

## Core Principle
页面结构由公共壳层驱动，业务页面只负责填充内容，不负责决定页面外层布局。页面级 spacing、头部结构和 tab 关闭规则都属于平台层职责。

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

### ListPageShell
- 建立 `icon + title + actions` 顶部结构。
- 承接列表页整体结构。
- 不负责数据获取。
- 不负责列表内部的业务行为。

### CrudLayout
- 负责列表页常规数据组织能力：
  - filters
  - data area
  - pagination
  - add action
- 当作为页面根使用时，应通过 shell 输出完整列表页。
- 当作为嵌入块使用时，应启用 `embedded` 模式，避免重复页面头部与外层 spacing。

### DetailPageLayout
- 承接详情页标题区、动作区、侧栏区。
- 内部 section 可以有自己的 padding，但页面根 spacing 仍由 `PageShell` 提供。

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
