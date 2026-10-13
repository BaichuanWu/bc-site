# Design

The deployed Next.js page supplies `batch%3A...%40...` in its dynamic `id`
parameter. The current detail component calls encodeURIComponent on that value,
requesting `batch%253A...%2540...`. The correct encoded API URL returns HTTP 200;
the twice-encoded URL returns HTTP 404 for the reported record.

Add a feature-owned route decoder in src/lib/wqb-knowledge.ts. Apply one
decodeURIComponent pass at the route boundary, catching URIError and retaining
the input for malformed escapes. Do not recursively decode: percent escapes in
authored identities must survive. Normalize a decoded numeric ID to the existing
db:<id> reference in the detail page. Keep API encoding in the existing request
and use knowledgeHref with the decoded segment for tab metadata.

Use Node regression tests with the installed TypeScript compiler to exercise the
reported encoded reference, file paths, literal percent sequences, Unicode,
malformed escapes and numeric compatibility. Validate the detail component's API
request and tab path using mocked hooks in a server-rendering test. Run focused
lint, TypeScript, frontend contracts, production build and strict OpenSpec validation.
