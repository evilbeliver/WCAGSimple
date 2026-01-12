---
description: "Task list for Simple WCAG 2.1 AA Web Crawler"
---

# Tasks: Simple WCAG 2.1 AA Web Crawler

**Input**: Design documents from `/specs/001-wcag-crawler/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure per implementation plan
- [x] T002 Initialize Next.js static site with TypeScript in src/ui/
- [x] T003 [P] Configure linting and formatting (ESLint, Prettier)
- [x] T004 [P] Add and configure Axe-Core, Playwright, Crawlee, and testsprite dependencies

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [x] T005 Setup base domain folders: src/crawler/, src/checks/, src/reporter/, src/ui/, src/utils/
- [x] T006 [P] Create ScanRequest, ScanResult, and Violation types in src/utils/types.ts
- [x] T007 [P] Setup error handling and in-memory logging in src/utils/
- [x] T008 [P] Configure Playwright and Crawlee for JS execution in src/crawler/
- [x] T009 [P] Setup Axe-Core integration in src/checks/
- [x] T010 [P] Setup testsprite and Playwright test runners in tests/

**Checkpoint**: ✅ Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Scan Public Web Page (Priority: P1) 🎯 MVP

**Goal**: User can submit a public URL and receive a clear HTML report of WCAG 2.1 AA violations

**Independent Test**: Submit a public URL and verify a report is generated listing any detected violations

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement URL submission form in src/components/UrlForm.tsx
- [x] T012 [P] [US1] Implement scan trigger and result state in src/app/page.tsx
- [x] T013 [P] [US1] Implement crawler logic for public pages in src/crawler/CrawlerEngine.ts
- [x] T014 [P] [US1] Integrate Axe-Core checks in src/checks/AxeRunner.ts
- [x] T015 [P] [US1] Generate HTML report in src/reporter/HtmlReporter.ts
- [x] T016 [US1] Display report in UI (src/app/page.tsx)
- [x] T017 [US1] Add error handling for invalid/unreachable URLs in src/components/ErrorBanner.tsx
- [x] T018 [US1] Add logging for scan actions in src/utils/logger.ts

**Checkpoint**: ✅ User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Scan Behind Login (Priority: P2)

**Goal**: User can provide credentials to scan a page behind authentication

**Independent Test**: Provide credentials for a test site and verify the crawler can log in and scan the protected page

### Implementation for User Story 2

- [x] T019 [P] [US2] Extend URL form to accept credentials in src/components/UrlForm.tsx
- [x] T020 [P] [US2] Implement login/session logic in src/crawler/CrawlerEngine.ts
- [x] T021 [P] [US2] Handle authentication errors and display in src/components/ErrorBanner.tsx
- [x] T022 [US2] Ensure credentials are not stored after scan in src/crawler/CrawlerEngine.ts

**Checkpoint**: ✅ User Story 2 is fully functional and testable independently

---

## Phase 5: User Story 3 - Simple, Accessible UI (Priority: P3)

**Goal**: UI is simple, accessible, and usable for all users

**Independent Test**: Run accessibility checks and verify keyboard navigation, screen reader compatibility, and clear instructions

### Implementation for User Story 3

- [x] T023 [P] [US3] Audit all UI components for WCAG 2.1 AA compliance in src/components/
- [x] T024 [P] [US3] Add ARIA labels and keyboard navigation support in src/components/
- [x] T025 [P] [US3] Write accessibility tests with Axe-Core and Playwright in tests/e2e/
- [x] T026 [US3] Add user instructions and help text in src/app/page.tsx

**Checkpoint**: ✅ User Story 3 is fully functional and testable independently

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T027 [P] Add responsive design and mobile testing in src/app/
- [x] T028 [P] Audit and update all dependencies for security in package.json
- [x] T029 [P] Add CI workflow for linting, tests, and accessibility checks in .github/workflows/
- [x] T030 [P] Final code review for naming conventions and constitution compliance

---

## Dependencies

- User Story 1 (P1) must be completed before User Story 2 (P2) and User Story 3 (P3) can be fully validated
- Foundational setup must be complete before any user story work

---

## Parallel Execution Examples

- T003, T004, T006–T010 can be done in parallel after T002
- T011–T018 (US1) can be done in parallel after foundation
- T019–T022 (US2) can be done in parallel after US1
- T023–T026 (US3) can be done in parallel after US1
- T027–T030 (polish) can be done in parallel after all user stories

---

## Implementation Strategy

- MVP: Complete all tasks for User Story 1 (T011–T018)
- Incremental: Deliver User Story 2 and 3 in parallel after MVP
- Polish and cross-cutting tasks finalize the feature
