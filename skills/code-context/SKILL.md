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

1. **Every statement names its evidence**: `path:line` at a commit, a test name, a config
   key, a doc link, or a command you ran and its output. A statement with none is a guess,
   and is labelled as one.
2. **Three kinds of knowing stay apart**:
   - *Stated*: a README, docs, a spec or a comment says so.
   - *Observed*: the code does it, or you ran it and saw it.
   - *Inferred*: you conclude it from the above.
   Where stated and observed disagree, that disagreement is a finding, and the code wins.
3. **Unknowns are listed, never filled.** What you could not find, run or verify goes under
   "Open questions" with where you looked.
4. **Scope is said.** Name the commit or branch you read and what you did not read.

## What a good context covers

**Purpose and users.** What problem it solves, for whom, and what it deliberately does not
do. Evidence: README, docs, package metadata, the shape of the public surface.

**Functional requirements**: what it must do. Look for them in the sources that act as
specs, strongest first: tests and fixtures (executable specs), API schemas (OpenAPI,
GraphQL, protobuf, route tables, CLI `--help`), types and validation rules, docs, then
issues and PRs. Write each as a testable sentence ("`POST /x` rejects an empty body with
400") with its evidence.

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

Say which qualities the code actually enforces, which are only claimed, and which are absent.

**Behaviour of code and APIs.** For each entry point that matters: inputs and their
validation, outputs, errors and status codes, side effects (files, network, database,
other processes), ordering and concurrency assumptions, and what happens on failure.
Trace the real path from entry point to effect. Prefer to *run* it (a test, a CLI call, a
local request) over reading and assuming, when that is safe. Never run anything that sends
data out, spends money or changes shared state without being told it may.

**Data and multimodal inputs.** What kinds of data it accepts and produces (text, images,
audio, video, tables, documents), their formats, size limits, where they are stored, and
what transforms them. Say where a modality is handled by an external service.

**Dependencies and boundaries.** External services, models and libraries it relies on, what
breaks without each, and which parts are generated, vendored or private.

**Decisions and traps.** Choices that look odd and why (look in `AGENTS.md`, ADRs, commit
messages, comments), and known sharp edges.

## Form

Write `context.md` (or `sources.md` when the context feeds a video), short enough to read
in one sitting: a purpose paragraph, then the requirements and behaviours as evidence-backed
lines, then open questions. Each line is one claim and its evidence:

```
- <one testable claim>. <path>:<line> (<commit>); test "<test name>"
```

Where it goes: for another person's code, in `local/` (this repo is public; a private code
base's details must not reach it). For a video about this repo, in the video's folder.

## Handing it on

- **To an explainer video**: the claims become `sources.md` (`explainer-video`, step 1);
  keep the evidence column, since `critic-accuracy` checks against it.
- **To a developer**: pair it with `repo-context` when the code base is this one.
- **To another agent**: pass the file and the commit, not your conclusions alone. A fresh
  reader should be able to verify a line without asking you.
