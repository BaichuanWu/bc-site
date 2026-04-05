# Dashboard Development Check Template

Use this template before starting a new dashboard page or a structural dashboard refactor.

## 1. Page Type
- Is this page `Overview`, `List Page`, `Detail Page`, or `Special Page`?
- If it is a dashboard top-level page, why is it not a `List Page`?

## 2. Shell Choice
- Which shell owns page-level spacing?
- Which shell owns the page header?
- Can this page be built with:
  - `PageShell`
  - `ListPageShell`
  - `DetailPageLayout`

## 3. Layout Rules
- Does the page root avoid `p-*` and page-level `space-y-*`?
- If this is a list page, does it follow `header / filter / content`?
- If this is a detail page, are section paddings kept inside the detail layout instead of redefining page spacing?

## 4. Tab Rules
- Should this page open as a closable tab?
- Does this page rely on workspace default close behavior instead of custom local fallback logic?

## 5. Navigation / Mapping
- Does this page need a dashboard menu entry?
- Does this page need workspace title mapping or route label updates?
- Is this page a top-level page or only a child / attached page?

## 6. Shared Component Opportunity
- Is any page-level layout being repeated?
- Should the repeated structure be extracted into `src/components/common` before continuing?

## 7. Done Criteria
- Uses approved shells
- Keeps business page code thin
- Preserves tab rules
- Passes dashboard review checklist

