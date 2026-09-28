# Design

A common zero-indexed pagination component receives current page, total records and page size. It renders a bounded group of numbered page buttons, first and last pages with ellipses when needed, and invokes the caller's page setter. The list pages retain their existing server-side offset/limit requests and reset to page one when filters change. No backend or migration work is needed.
