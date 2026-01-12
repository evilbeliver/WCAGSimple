# Implementation Plan: Simple WCAG 2.1 AA Web Crawler

**Branch**: `[001-wcag-crawler]` | **Date**: 2026-01-12 | **Spec**: [specs/001-wcag-crawler/spec.md](specs/001-wcag-crawler/spec.md)
**Input**: Feature specification from `/specs/001-wcag-crawler/spec.md`

**Note**: This plan is generated per the constitution and spec-kit workflow.

## Summary

Build a simple, stand-alone web application that allows users to enter a URL (and optionally credentials) to scan a web page for WCAG 2.1 AA accessibility violations. The crawler will execute JavaScript to scan dynamic content, use Axe-Core for accessibility checks, and generate a clear HTML report. The UI will be simple, accessible, and responsive.

## Technical Context

**Language/Version**: JavaScript/TypeScript (Node.js 20+, Next.js 14+)
**Primary Dependencies**: Next.js (static site), Axe-Core, Playwright, Crawlee, testsprite
**Storage**: N/A (no database, no persistent storage)
**Testing**: testsprite (unit/integration), Playwright (E2E, accessibility), Axe-Core (accessibility)
**Target Platform**: Web (responsive, mobile-ready)
**Project Type**: Web application (stand-alone, static site)
**Performance Goals**: 95% of scans complete in <60s for typical pages; UI loads in <2s on mobile
**Constraints**: No user data or credentials stored; must pass automated WCAG 2.1 AA checks; no server-side state
**Scale/Scope**: Single-user, on-demand scans; MVP scope only (no multi-user, no SaaS features)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Accessibility-First: All UI and reports must meet WCAG 2.1 AA
- Test-First: TDD with testsprite, Playwright, Axe-Core; 80%+ coverage
- Simplicity & MVP: No extra features, no database, no user accounts
- Dependency Security: All dependencies must be up-to-date and audited
- Code Clarity: PascalCase for components, camelCase for utilities, domain-based file structure
- UX: Simple, clear, responsive UI; actionable reports
- Observability: Log scan actions and errors (in-memory, not persisted)

## Project Structure

### Documentation (this feature)

```text
specs/001-wcag-crawler/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── crawler/         # Crawlee/Playwright logic
├── checks/          # Axe-Core integration
├── reporter/        # HTML report generation
├── ui/              # Next.js pages/components
└── utils/           # Shared helpers

tests/
├── unit/
├── integration/
└── e2e/
```

**Structure Decision**: Web application, stand-alone, static site. All code in `src/` by domain. No backend or database. Tests in `tests/` by type.

## Complexity Tracking

No constitution violations. All complexity justified by MVP and accessibility requirements.
