export type MarkdownTemplate = {
  id: string
  label: string
  description?: string
  content: string
}

export const knowledgeRawTemplates: MarkdownTemplate[] = [
  {
    id: "study-note",
    label: "Study Note",
    description: "For course notes, book excerpts, and concept clarification.",
    content: `# Topic

## Source
- Course:
- Chapter / video:
- Why this matters:

## Core idea
- 

## Key definitions
- 

## My understanding
- 

## Open questions
- 

## Follow-up actions
- [ ] 
`,
  },
  {
    id: "experiment-log",
    label: "Experiment Log",
    description: "For workflow trials, prompt tests, and small implementation experiments.",
    content: `# Experiment

## Goal
- 

## Setup
- Context:
- Inputs:
- Constraints:

## What I changed
- 

## Observations
- 

## Result
- What improved:
- What failed:

## Next move
- [ ] 
`,
  },
  {
    id: "backtest-analysis",
    label: "Backtest Analysis",
    description: "For alpha or strategy result review before curation.",
    content: `# Backtest Analysis

## Subject
- Alpha / strategy:
- Scope:

## Metrics snapshot
- Sharpe:
- Fitness:
- Margin:
- Turnover:
- Correlation:

## What the result seems to say
- 

## Potential causes
- 

## Risks / caveats
- 

## Candidate knowledge to retain
- Pattern:
- Failure mode:
- Follow-up:
`,
  },
  {
    id: "reference-extract",
    label: "Reference Extract",
    description: "For external article, blog, or documentation excerpts.",
    content: `# Reference Extract

## Source
- Title:
- Author:
- URL / ref:

## Summary
- 

## Important excerpt
> 

## Why I care
- 

## Reusable knowledge
- 
`,
  },
]

export const knowledgeDocumentTemplates: MarkdownTemplate[] = [
  {
    id: "concept-card",
    label: "Concept Card",
    description: "For durable concept definitions and reusable explanations.",
    content: `# Concept

## Summary

## Definition

## Why it matters

## When to use it

## Common mistakes

## Related concepts
`,
  },
  {
    id: "pattern-doc",
    label: "Pattern Doc",
    description: "For reusable patterns, heuristics, and playbooks.",
    content: `# Pattern

## Summary

## Situation

## Signal / pattern

## Why it works

## Constraints

## Failure modes

## Good follow-up directions
`,
  },
  {
    id: "failure-pattern",
    label: "Failure Pattern",
    description: "For stable anti-patterns and recurring failure summaries.",
    content: `# Failure Pattern

## Summary

## Symptom

## Common trigger

## Likely cause

## How to detect early

## What to try instead
`,
  },
  {
    id: "playbook",
    label: "Playbook",
    description: "For stepwise operating guidance and reusable workflows.",
    content: `# Playbook

## Purpose

## Preconditions

## Steps
1. 
2. 
3. 

## Decision points
- 

## Outputs
- 

## Notes
- 
`,
  },
]
