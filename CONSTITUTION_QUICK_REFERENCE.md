# WCAGSimple Constitution: Developer Quick Reference

**Version**: 1.0.0 | **Ratified**: 2026-01-12

---

## The 7 Principles (TL;DR)

| # | Principle | Key Rules |
|---|-----------|-----------|
| **I** | Accessibility-First | WCAG 2.1 AA compliance is the product mission, not optional |
| **II** | Test-First | TDD mandatory; 80% coverage minimum for core; Red-Green-Refactor |
| **III** | Simplicity & MVP | YAGNI; justify all complexity; scope = crawler + detection + reporting |
| **IV** | Security & Maintenance | Monthly audits; explicit approval for breaking changes |
| **V** | Code Clarity | PascalCase components, camelCase utilities, domain-based file structure |
| **VI** | UX Guidelines | Simple + clear reports with concrete remediation steps |
| **VII** | Observability | Structured logging; context-rich errors; JSON when applicable |

---

## Naming Conventions (Principle V)

### Classes & Components
```
✅ CrawlerEngine
✅ AccessibilityReport
✅ WCAGValidator
❌ crawler_engine
❌ A11yReport
```

### Functions & Utilities
```
✅ scanUrl()
✅ validateWCAG()
✅ generateReport()
❌ ScanUrl()
❌ generate_report()
```

### File Organization
```
src/
├── crawler/          # Web crawling logic
├── checks/           # WCAG violation detection
├── reporter/         # Report generation
├── models/           # Data structures
└── utils/            # Shared utilities

tests/
├── unit/
├── integration/
└── contract/
```

---

## Code Review Checklist

Before approving any PR, verify:

### ✅ Accessibility (Principle I)
- [ ] Feature addresses accessibility or doesn't break it
- [ ] WCAG 2.1 AA compliance documented
- [ ] UI components tested for accessibility

### ✅ Testing (Principle II)
- [ ] Tests written first (TDD)
- [ ] Coverage report shows ≥80% for core modules
- [ ] Integration tests validate end-to-end workflows
- [ ] Test names clearly describe behavior

### ✅ Scope (Principle III)
- [ ] Feature complexity justified
- [ ] Scope limited to MVP (crawler/detection/reporting)
- [ ] No speculative features
- [ ] Spec.md created before implementation

### ✅ Dependencies (Principle IV)
- [ ] No new dependencies without justification
- [ ] Lock files committed
- [ ] No vulnerable packages (run `npm audit` / `pip check`)
- [ ] Breaking changes have migration plan

### ✅ Code Quality (Principle V)
- [ ] Naming conventions followed (PascalCase/camelCase)
- [ ] File organization matches domain structure
- [ ] No cryptic abbreviations in public APIs
- [ ] Code is readable without comments

### ✅ UX Clarity (Principle VI)
- [ ] Error messages are clear and actionable
- [ ] Reports explain *why* a violation matters
- [ ] Remediation suggestions are concrete

### ✅ Observability (Principle VII)
- [ ] Significant operations are logged
- [ ] Error context includes URL, rule ID, suggestion
- [ ] Logs are structured (JSON or similar)

---

## Workflow: Feature Development

### Phase 1: Planning (Spec-Kit)
```bash
/speckit.plan --feature "Add new WCAG rule"
```
Output: `specs/[###]/plan.md` + `research.md`

✅ **Constitution Gate**: Verify against Principles I, III

### Phase 2: Specification
```bash
/speckit.specify --feature "Add new WCAG rule"
```
Output: `specs/[###]/spec.md` (User stories + requirements)

✅ **Constitution Gate**: Verify testability (Principle II)

### Phase 3: Task Breakdown
```bash
/speckit.tasks --feature "Add new WCAG rule"
```
Output: `specs/[###]/tasks.md` (TDD task list)

✅ **Constitution Gate**: Verify 80% coverage target

### Phase 4: Implementation (TDD)

1. Write failing test
2. Implement to pass test
3. Refactor for clarity
4. Verify naming conventions (Principle V)
5. Verify accessibility (Principle I)
6. Run security audit if dependencies change (Principle IV)

### Phase 5: Code Review
See **Code Review Checklist** above.

### Phase 6: Merge & Deploy
Only when:
- ✅ All tests pass
- ✅ Coverage ≥80%
- ✅ All principles verified
- ✅ No vulnerable dependencies

---

## Monthly Checklist

### First Week of Month
```bash
npm audit
pip check
# Review critical/high vulnerabilities
# Create issues for updates
```

### Every PR
- [ ] Constitution compliance verified in review
- [ ] Naming conventions checked
- [ ] Test coverage confirmed

### Every Feature Complete
- [ ] Accessibility double-checked
- [ ] Documentation updated
- [ ] New dependencies audited

---

## Questions? Escalation

1. **"Is this feature in scope?"** → Check Principle III. Does it fit crawler + detection + reporting MVP?
2. **"How much test coverage do we need?"** → Principle II: 80% minimum for core modules
3. **"Can we add a new dependency?"** → Principle IV: Justify need, verify no vulnerabilities, document migration plan
4. **"What should we name this component?"** → Principle V: PascalCase for classes, camelCase for functions
5. **"Is this accessible?"** → Principle I: WCAG 2.1 AA compliance required

**Consult**: `.specify/memory/constitution.md` (source of truth)

---

## Key Dates

- **Ratified**: 2026-01-12
- **Last Amended**: 2026-01-12
- **Next Dependency Audit**: February 12, 2026 (monthly)

---

## Further Reading

- **Constitution**: [.specify/memory/constitution.md](.specify/memory/constitution.md)
- **Sync Impact Report**: [.specify/memory/SYNC_IMPACT_REPORT.md](.specify/memory/SYNC_IMPACT_REPORT.md)
- **Spec-Kit Templates**: [.specify/templates/](.specify/templates/)
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
