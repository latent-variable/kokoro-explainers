---
name: code-context
description: >
  Build a grounded understanding of any code base, this one or another: what it is for,
  its functional and non-functional requirements, how its code and APIs behave, and what
  is unknown, every statement traced to a file, test, config or observed run. Load before
  explaining, changing, reviewing or deciding about code you have not read, when asked "how
  does X work", "what does this API guarantee", "what are its requirements", or to produce
  the sources for a feature or decision video.
---

# Code context

The product is a context a person or another agent can rely on: what the code base is for,
what it must do, what it must be like, how it behaves, and where you do not know. Not a
tour of the files. Every statement is traceable, so a reader can check it and a critic can
fail it.

## The bar

Follow `evidence-standard`: it sets the tags, the pin, the safe way to run code and where the
result goes. In short:

1. **Every statement names its evidence and its kind**: `[stated]`, `[read]`, `[ran]` or
   `[inferred]`. A statement with neither is a guess, and is labelled as one.
2. **Disagreement is a finding.** Where docs and code differ, it goes in a Findings list; the
   code wins.
3. **Unknowns are listed, never filled**, under "Open questions" with where you looked.
4. **Scope is said.** Answer the question asked first. Name the pin and what you did not read.
   Sections with no evidence are omitted, not padded; aim for 40 to 80 lines.

## What a good context covers

**Purpose and users.** What problem it solves, for whom, and what it deliberately does not
do. Evidence: README, docs, package metadata, the shape of the public surface.

**Functional requirements**: what it must do. Look for them in the sources that act as
specs, strongest first: tests and fixtures (executable specs), API schemas (OpenAPI,
GraphQL, protobuf, route tables, CLI `--help`), types and validation rules, docs, then
issues and PRs. Write each as a testable sentence ("`POST /x` rejects an empty body with
400") with its evidence, and say whether a test covers it. Code that no test covers is
marked `untested`; issues and pull requests need the network, so say when you skipped them.

**Non-functional requirements**: how well it must do it. These are rarely written down, so
read for the traces they leave:

| Quality | Where it shows |
|---|---|
| Performance and capacity | Timeouts, limits, batch sizes, caches, pagination, benchmarks, queue depths |
| Reliability | Retries, backoff, idempotency keys, transactions, health checks, failure handling |
| Security and privacy | Auth and permission checks, input validation, secret handling, data it stores or sends out |
| Observability | Logging, metrics, tracing, error reporting |
| Portability and operations | Supported platforms and versions, install and deploy files, CI, config and environment variables |
| Maintainability | Test coverage and style, module boundaries, dependency choices and pins, documented traps |

Write these as "the code enforces X" (`[read]`), never "the requirement is X" unless a
source states it. Say which qualities the code enforces, which a source only claims, and which
are absent. "No stated non-functional requirements found" is a valid line.

**Behaviour of code and APIs.** For each entry point that matters: inputs and their
validation, outputs, errors and status codes, side effects (files, network, database,
other processes), ordering and concurrency assumptions, and what happens on failure.
Trace the real path from entry point to effect. Prefer to *run* it over reading and assuming, but only inside the safe envelope in
`evidence-standard`; otherwise mark the claim `[read]` and say it was not run. Check what
happens on malformed input for each entry point, and back every "all" and "never" with a run
or a search.

**Data and multimodal inputs** (omit if none). What kinds of data it accepts and produces (text, images,
audio, video, tables, documents), their formats, size limits, where they are stored, and
what transforms them. Say where a modality is handled by an external service, and list every
outbound call and what data leaves (this is also a security trace).

**Dependencies and boundaries.** External services, models and libraries it relies on, what
breaks without each, and which parts are generated, vendored or private.

**Decisions and traps.** Choices that look odd and why (`AGENTS.md`, ADRs, commit messages, comments; for
vendored code, the upstream history), and known sharp edges. If none exist, say "no decision
records found; looked at <where>".

## Form

`context.md` by default, or `sources.md` when the context feeds a video. A Scope header
(pin, not read, run or not), a purpose paragraph, then the requirements and behaviours as tagged
lines, then Findings and Open questions:

```
[read] <one testable claim>. <path>:<line>   untested
[read] absent: <thing>; searched: <command>; result: none
[ran]  $ <command> (<cwd>, <commit>, exit <n>) -> <first lines of output>
```

Where it goes: `evidence-standard`.

## Handing it on

- **To an explainer video**: the claims become `sources.md` (`explainer-video`, step 1);
  keep the tag and evidence on each line, since `critic-accuracy` and `critic-grounding` check
  against them.
- **To a developer**: pair it with `repo-context` when the code base is this one.
- **To another agent**: pass the file and the pin, not your conclusions alone. A fresh
  reader should be able to verify a line without asking you.
