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
   Sections with no evidence are omitted, not padded. The prose is short (a purpose paragraph and
   a few summary lines); tagged evidence lines are not capped, so cut breadth before you cut a
   malformed-input check or the backing of a universal claim.

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

Write these as "enforced at <layer>" (`[read]`), with the path that bypasses it if one exists
(a rule in a form but not in the model), never "the requirement is X" unless a source states it. Say which qualities the code enforces, which a source only claims, and which
are absent. "No stated non-functional requirements found" is a valid line.

**Behaviour of code and APIs.** For each entry point that matters: inputs and their
validation, outputs, errors and status codes, side effects (files, network, database,
other processes), ordering and concurrency assumptions, and what happens on failure.
Trace the real path from entry point to effect. Prefer to *run* it over reading and assuming, but only inside the safe envelope in
`evidence-standard`; otherwise mark the claim `[read]` and say it was not run. For each entry point, list the
malformed inputs to check (`evidence-standard`) and mark each outcome `[ran]` or `[read]` with
"not run". Trace which layer an error handler or a check lives in before you claim it applies
everywhere: a blueprint handler does not see routing errors; a form check does not guard an API.
Also list what does **not** happen (a push, a notification, a cache, a fan-out), each as an
`absent:` line, and say which test covers each traced path or that none does.

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

`context.md`, or the video's `sources.md` when it feeds a video (where it goes: `evidence-standard`).
A Scope header (pin, what was not read, whether anything was run), a purpose paragraph, then
tagged lines in the formats `evidence-standard` defines, then Findings and Open questions. A
brief or other handed-in claims go in Findings with their result.

## Handing it on

- **To an explainer video**: the claims become `sources.md` (`explainer-video`, step 1);
  keep the tag and evidence on each line, since `critic-accuracy` and `critic-grounding` check
  against them.
- **To a developer**: pair it with `repo-context` when the code base is this one.
- **To another agent**: pass the file and the pin, not your conclusions alone. A fresh
  reader should be able to verify a line without asking you.
