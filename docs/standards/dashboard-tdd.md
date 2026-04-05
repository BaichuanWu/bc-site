# Dashboard TDD Standard

## Goal
用规范驱动开发，优先定义“什么行为必须成立”，再写实现。

这份文档覆盖 dashboard 最近暴露出的高频问题：
- 前后端返回结构不统一
- 前端为了兜底保留多种兼容解析
- 页面切换和组件挂载触发重复请求
- workspace tab 状态与真实路由不同步
- fullscreen / 页面状态在跳转后丢失
- 页面级间距被业务页面随意控制
- SSR / hydration 因客户端不稳定结构产生警告

## Core Rule
先写 contract，再写实现；先写 fail case，再写 happy path。

每个结构性改动都必须先回答：
- 输入输出 contract 是什么
- 首次加载行为是什么
- 二次进入行为是什么
- tab 切换行为是什么
- 返回上一个页面后的恢复行为是什么
- 哪些行为绝对不允许出现

## Contract-First Rules

### 1. List Response Contract
所有列表型接口只允许返回一种结构：

```json
{
  "dataSource": [],
  "total": 0
}
```

规则：
- 前端列表解析只认 `dataSource`
- 不允许返回原始数组
- 不允许返回 `data`
- 不允许保留兼容分支去同时解析 `dataSource` / `data` / raw array
- 后端自定义列表接口也必须使用和 CRUD 一致的 contract

开发前验收项：
- 列表接口 response shape 是否已写清楚
- 前端消费方是否只按 `dataSource` 读取
- 是否有任何“为了兼容旧结构”的 fallback

禁止：
- `Array.isArray(res) ? res : ...`
- `res.data ?? res.dataSource ?? []`
- 后端某些列表接口直接 `return []`

### 2. Detail Response Contract
详情接口默认返回单对象，不包装成列表。

规则：
- 详情页不要通过“列表接口 + q=id + limit=1”模拟详情
- 如果页面语义是 detail，就优先提供 detail endpoint
- 详情页加载态、未找到态必须分开

开发前验收项：
- 当前页面到底是 list contract 还是 detail contract
- 前端是否错误复用了 list parser

### 3. Options / Meta Contract
元数据和 options 接口属于稳定会话数据。

规则：
- `/meta`、`/options` 这类接口要么明确是 session-static，要么明确可刷新
- session-static 数据在一次页面会话中不应重复请求
- 前端要有明确缓存策略，而不是靠组件偶然不重渲染

开发前验收项：
- 这个接口在一次会话中允许请求几次
- tab 切换、组件 remount、返回页面时是否应重复请求

## State-First UI Rules

### 4. Page Shell Ownership
页面级 spacing 只能由 shell 控制。

规则：
- 页面根节点不写页面级 `p-*`
- 页面根节点不写页面级 `space-y-*`
- 页面结构必须先选择 shell，再填内容

开发前验收项：
- 当前页面的 page-level spacing 由谁拥有
- 这个页面是否复用了 `PageShell` / `ListPageShell` / `DetailPageLayout`

### 5. Workspace Tab Contract
tab 行为属于平台 contract，不属于单页自定义逻辑。

规则：
- `Overview` 是唯一默认不可关闭 tab
- 其他 tab 默认可关闭
- 关闭当前 tab 回到最近使用的上一个 tab
- 已打开 tab 的切换应优先使用缓存内容，避免等待整页重新取数
- 新 tab 的激活必须和真实路由切换一致，不能先展示错误页面

开发前验收项：
- 第一次打开 detail tab 会显示什么
- 切回已打开 tab 是否立即可见
- 关闭 tab 后回到哪个页面

禁止：
- 根据数组左右邻居决定 close fallback
- 新 tab 在路由未切换时先渲染旧 children

### 6. Route-Persistent UI State
fullscreen、筛选器、当前上下文这类状态必须先定义恢复规则。

规则：
- 如果用户从编辑态跳到附属详情页，再返回，关键页面状态必须恢复
- 恢复键必须和 route identity 绑定
- hydrate 之前不能抢先把默认状态写回 storage

开发前验收项：
- 这个状态是否应该在返回页面时恢复
- 恢复范围是全局、tab 级还是 route 级
- hydrate 和 persist 谁先发生

禁止：
- mount 时“先写默认值，再读 storage”
- 多个路由共用一个模糊 storage key

### 7. Request Lifecycle Contract
一次进入页面，应该发哪些请求，必须是可枚举的。

规则：
- 首屏请求必须可数
- 不能出现“先打一枪空请求，再打一枪真实请求”的初始化模式
- filter 初始化必须在首次请求之前确定
- 已知静态数据不要因 callback identity 或 mount effect 反复请求

开发前验收项：
- 页面首屏会发哪些请求
- 哪些请求是由 route 变化触发
- 哪些请求是由 filter 变化触发
- 是否存在 mount effect 二次触发搜索

禁止：
- `useEffect` mount 后再从 storage 恢复 filters 并立刻 search
- 不稳定回调作为初始化 effect 依赖

### 8. SSR / Hydration Contract
首屏 DOM 结构必须稳定。

规则：
- SSR 首屏和 client 首次 render 必须结构一致
- 不稳定的 Radix id / aria 结构不要在未 mounted 时直接参与 SSR
- 涉及浏览器态的 interactive component，必要时先渲染稳定占位

开发前验收项：
- 这个组件 SSR 时和 mounted 后 DOM 是否一致
- 是否依赖 `window`、时间、随机数、浏览器环境

禁止：
- SSR 分支和 client 分支渲染不同 interactive tree
- 未 mounted 时直接渲染会生成不稳定 id 的复杂浮层组件

## TDD Workflow

### Step 1. Write Contracts
在开始写代码前，先写最小 contract：
- request shape
- response shape
- page shell
- tab behavior
- restore behavior
- forbidden regressions

### Step 2. Write Verification Notes
至少写出这 4 类检查：
- 首屏请求序列
- tab 切换序列
- 离开再返回的状态恢复
- 未找到 / 空数据 / loading 三种边界态

### Step 3. Implement Without Compatibility
如果 contract 已变化：
- 同步改前端消费
- 同步改后端返回
- 删除旧兼容逻辑

不要做：
- 先在前端兼容 3 种结构，等以后再收口
- 先 patch 单页，等以后再统一公共层

### Step 4. Validate
每个结构性改动至少验证：
- `eslint`
- `tsc --noEmit`
- 首屏请求数
- tab 切换
- 返回恢复
- 空态 / loading / not-found

## Standard Test Checklist

### API Contract
- 列表接口是否只返回 `dataSource`
- 自定义接口是否与 CRUD 接口使用同一 contract
- 是否移除了旧兼容解析

### Request Behavior
- 首屏是否只有预期请求
- tab 切换是否不会重复请求 session-static 数据
- 是否避免空请求 + 真实请求的双发

### Navigation And State
- 新 tab 是否不会先显示旧页面
- 已打开 tab 切换是否立即响应
- 返回页面后 fullscreen / filters / context 是否正确恢复

### Layout
- 页面级 spacing 是否来自 shell
- 业务组件是否只控制内部 spacing

### Hydration
- 是否存在 server/client 首屏树不一致
- 复杂 interactive 组件是否使用稳定首屏

## Review Prompts
做 code review 时，优先问这几个问题：
- 这次改动有没有改变 contract
- contract 是否同时更新了前后端
- 有没有留下“先兼容一下”的分支
- 首屏请求是否比预期多
- tab / fullscreen / filters 在离开再返回后是否稳定
- 页面级 spacing 是否被业务页重新接管

## Required Default
如果没有特别说明，dashboard 新功能默认遵守：
- 列表响应只用 `dataSource`
- 不做旧结构兼容
- 页面级 spacing 由 shell 控制
- tab 行为复用 workspace 公共逻辑
- session-static 数据按会话缓存
- 先定义 contract 和验收，再写实现
