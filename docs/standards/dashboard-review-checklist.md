# Dashboard Review Checklist

## Page Type
- 新页面是否明确属于 `Overview`、`List Page`、`Detail Page` 或 `Special Page`
- 如果是一级功能页，是否默认实现为列表页
- 如果不是标准类型，是否说明了为什么必须走特殊结构

## Layout
- 页面级间距是否来自 shell，而不是页面根节点自定义
- 是否复用了 `PageShell`、`ListPageShell` 或 `DetailPageLayout`
- 是否避免重复实现 header/filter/content 结构
- 页面文件是否保持足够薄，只做组合而不是承载大段布局代码
- 公共组件是否保持通用语义，而不是被某个页面上下文绑死

## List Page
- 顶部是否只显示 `icon + title + actions`
- 页面级 actions 超过 2 个时是否折叠为统一入口
- filter 是否默认展开
- filter 与 content 间距是否紧凑
- 是否错误地把长描述重新加回标准列表页顶部
- 如果使用 `DataTable` sticky header，是否保证只有一个主滚动容器
- 是否保持“页面纵向滚动，table 自身横向滚动”的职责分离
- 是否在 table 外层又叠加了会破坏 sticky 的 `overflow-*` 祖先

## Detail Page
- 是否使用统一详情页壳层
- 是否把 section 级 spacing 和页面级 spacing 混在一起
- 创建页和编辑页是否共用同一个 detail component，而不是重复实现两套页面

## Tab Behavior
- 是否符合 `Overview` 不可关闭、其他页可关闭的规则
- 关闭当前 tab 后是否回到最近使用的上一个 tab
- 是否有页面通过局部逻辑破坏 workspace 统一行为

## Navigation
- dashboard 一级导航是否只包含批准的一组页面
- 是否误把附属页加入一级导航
- 新页面如果需要 title mapping、workspace label 或导航入口，是否同步更新

## WQB
- 是否只保留 `WQB Alpha` 作为一级入口
- 是否误恢复 `WQB AI Agent`

## Anti-Patterns
- 页面根节点新增 `p-6`、`px-6 py-*`
- 页面根节点新增页面级 `space-y-*`
- 业务页自行处理页面壳层 spacing
- 在 page 文件里重复手写 list page header
- 公共组件职责继续膨胀而没有抽层
- 在通用组件里出现资源名、来源页或固定路由语义耦合
