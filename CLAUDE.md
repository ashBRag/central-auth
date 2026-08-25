# CLAUDE.md

## Rules

### 1. Shared Infrastructure

- Do **not** create PostgreSQL, Redis, or other shared infrastructure containers locally.
- Use the existing Docker infrastructure and the `backend-internal` Docker network.
- Do **not** add duplicate Docker Compose services for infrastructure that already exists.
- Before adding infrastructure, verify whether an existing shared service can be used.

### 2. Tests

- **Do not create, modify, or add tests without explicit user approval first.**
- Do not add test frameworks, test utilities, fixtures, mocks, or test infrastructure without approval.

### 3. `/libs`

- Put reusable code in `/libs`.
- Put generic reusable helpers in `/libs/utils`.
- Do **not** put domain-specific business logic in `/libs`.
- Do **not** create a `/libs` abstraction unless it is actually reusable.
- Register every new `/libs` package/path in the project's TypeScript aliases.
- Use aliases for `/libs` imports; do not use deep relative imports.

### 4. No Over-Engineering

- Implement the simplest solution that satisfies the requirement.
- Do **not** introduce abstractions, patterns, services, dependencies, or infrastructure without a concrete requirement.
- Do **not** create generic abstractions for single-use logic.
- Do **not** refactor unrelated code.
- Do **not** add "future-proofing" without an explicit requirement.

### 5. Design Before Implementation

For every non-trivial change, **before modifying files**, provide:

```text
Approach:
<implementation approach>

Files affected:
<files to create or modify>

Core logic:
<domain-specific logic>

Reusable logic:
<logic that belongs in /libs, if any>
```

- Do **not** implement a non-trivial change before presenting the approach.
- Do **not** add files that were not part of the agreed approach without discussing them first.

### 6. Core vs Reusable Logic

- Keep business/domain-specific logic inside its owning NestJS module.
- Move logic to `/libs` only when it represents a genuinely reusable concept.
- Do **not** extract code into `/libs` solely to make a file smaller.
- Do **not** duplicate generic logic across modules when an existing `/libs` utility can be reused.

### 7. Existing Code First

Before creating new code:

- Search for existing implementations.

- Check `/libs`.

- Check existing modules and services.

- Check existing aliases.

- Check existing infrastructure.

- Do **not** duplicate existing functionality.

### 8. Scope

- Only change code required for the requested task.
- Do **not** refactor unrelated code.
- Do **not** introduce unrelated dependencies or infrastructure.
- If the requested change requires a broader architectural change, stop and discuss it before implementation.

### 9. Dependencies

- Do **not** add a new npm dependency without explicit approval.
- Do **not** add new infrastructure without explicit approval.
- Do **not** replace an existing dependency or implementation without discussing it first.

### 10. Review Gate

When a task requires any of the following:

- New infrastructure
- New dependency
- New test
- New architectural abstraction
- Significant refactoring

**Stop and ask for review before implementing it.**

11. Linting

- Do not run lint commands.
- Do not fix lint issues unless explicitly requested.
- The user will run linting manually.
