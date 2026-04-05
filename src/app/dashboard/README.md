# Dashboard Development Notes

Dashboard 页面开发默认遵循以下规则：

- `Overview` 是唯一特殊页，也是唯一默认不可关闭的 tab。
- 其他一级页面默认都是列表页。
- 页面级间距由外层 shell 控制，不要在页面根节点自行写 `p-*` 或页面级 `space-y-*`。
- 标准列表页优先使用：
  - `PageShell`
  - `ListPageShell`
  - `CrudLayout`
- 标准详情页优先使用：
  - `PageShell`
  - `DetailPageLayout`
- tab 关闭后默认回到最近使用的上一个 tab。

开始开发前请先阅读：

- `docs/standards/dashboard-ui.md`
- `docs/standards/dashboard-architecture.md`
- `docs/standards/dashboard-review-checklist.md`
- `docs/standards/dashboard-dev-check-template.md`

建议在两处使用这些规范：

- 开始开发前：先过一遍 `dashboard-dev-check-template.md`
- 提交 PR 前：按 `.github/PULL_REQUEST_TEMPLATE.md` 自查

可用自动检查：

- `npm run check:dashboard-standards`
  - 轻量扫描 `src/app/dashboard/**/page.tsx`
  - 检查疑似页面根级 `p-*` / `px-*` / `py-*` / `space-y-*`
  - 目标是避免把页面级 spacing 放回业务页面
