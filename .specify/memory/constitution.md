# WCAGSimple Constitution

## Core Principles

### I. Accessibility-First

Every feature MUST prioritize WCAG 2.1 AA compliance from the start. The crawler must detect,
report, and help remediate accessibility issues across scanned websites. Accessibility is not
an afterthought—it is the product's core mission. All UI components and reports must be
accessible themselves.

### II. Test-First (NON-NEGOTIABLE)

Test-Driven Development (TDD) is mandatory: tests are written and approved before implementation
begins. The Red-Green-Refactor cycle is strictly enforced. Unit tests cover business logic
and crawler behavior; integration tests validate end-to-end accessibility scanning workflows.
Minimum threshold: 80% code coverage for core modules.

### III. Simplicity & MVP Focus

Start simple; follow YAGNI (You Aren't Gonna Need It). Every feature contribution must justify
its complexity and align with the MVP scope: crawling websites, detecting accessibility violations,
and generating clear, actionable reports. No speculative features. Scope is the crawler itself—
not a full SaaS platform.

### IV. Dependency Security & Maintenance

All dependencies (npm, pip, system) MUST remain up-to-date and security-audited. Monthly
audits are mandatory. Breaking changes in dependencies require explicit approval and a
migration plan before merging. Lock files are committed and reviewed. Vulnerable dependencies
trigger immediate remediation.

### V. Code Clarity & Naming Conventions

Consistent naming ensures readability and maintainability:
- **Components & Classes**: PascalCase (e.g., `CrawlerEngine`, `AccessibilityReport`)
- **Utilities & Functions**: camelCase (e.g., `scanUrl()`, `validateWCAG()`)
- **File Structure**: Organize by feature domain (e.g., `crawler/`, `reporter/`, `checks/`)
- **No acronyms in public APIs** unless universally recognized (WCAG, HTML, CSS are OK)

### VI. UX Guidelines: Simple & Clear

User interfaces and reports must be simple, intuitive, and free of jargon. Every report
must clearly explain what failed, why it matters for accessibility, and suggest concrete
remediation steps. Avoid overwhelming users with technical noise; prioritize clarity.

### VII. Observability & Debugging

Logs MUST be structured (JSON where applicable) and queryable. All significant operations
log their intent, inputs, and outcomes. Error messages include context (URL, rule ID, suggestion).
Text-based protocols enable local debugging without external dependencies.

## Code Organization Standards

- **src/**: Core application code organized by feature domain
- **tests/**: Unit and integration tests mirroring src/ structure
- **docs/**: User guides, API docs, WCAG rule explanations
- **.github/prompts/**: Development guidance (this repo uses spec-kit for planning)

## Development Workflow & Quality Gates

1. **Planning**: All features start with a spec.md and plan.md (spec-kit workflow)
2. **Implementation**: TDD—write failing tests first, implement to pass, refactor
3. **Review**: PRs must show test coverage reports; dependency changes flagged and audited
4. **Deployment**: Only when Constitution gates pass and all tests green

Complexity violations (scope creep, vague requirements, untested code) must be justified in PRs
and approved before merge.

## Governance

**Constitution Supremacy**: This constitution supersedes all other practices. All decisions,
code changes, and process updates are evaluated against these principles first.

**Amendment Process**:
1. Proposed amendment is documented with rationale and impact analysis
2. All core team members review and approve
3. Version number is bumped according to semantic versioning:
   - **MAJOR**: Backward-incompatible principle removals or redefinitions
   - **MINOR**: New principles or materially expanded guidance
   - **PATCH**: Clarifications, wording, non-semantic refinements
4. Amendment date is recorded; migration plan executed if needed

**Compliance Review**: All PRs/reviews must verify adherence to naming conventions,
test coverage, and accessibility standards. Use spec-kit templates and plans to guide
feature development (see `.specify/templates/`).

**Version**: 1.0.0 | **Ratified**: 2026-01-12 | **Last Amended**: 2026-01-12
