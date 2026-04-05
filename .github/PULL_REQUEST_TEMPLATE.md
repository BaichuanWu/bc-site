# Summary
- What changed?
- Why is this change needed?

# Scope
- [ ] Overview
- [ ] List page
- [ ] Detail page
- [ ] Workspace / tabs
- [ ] Shared component
- [ ] Other

# Dashboard Checks
- [ ] I read `docs/standards/dashboard-ui.md`
- [ ] I read `docs/standards/dashboard-architecture.md`
- [ ] I read `docs/standards/dashboard-review-checklist.md`
- [ ] Page-level spacing comes from `PageShell` or an approved shell, not from the page root
- [ ] I did not reimplement the list-page `header / filter / content` skeleton in a page file
- [ ] If this is a list page, it uses the approved list-page structure
- [ ] If this touches workspace tabs, `Overview` remains the only default non-closable tab
- [ ] If this touches workspace tabs, closing a tab still returns to the most recently used tab
- [ ] If this touches navigation or titles, I updated the related menu/tab mapping

# Validation
- [ ] `eslint`
- [ ] `tsc --noEmit`
- [ ] `npm run check:dashboard-standards`
- [ ] Manual UI check

# Manual Test Notes
- Tested pages:
- Tested interactions:
- Remaining risks:
