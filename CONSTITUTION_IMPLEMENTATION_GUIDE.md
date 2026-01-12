# WCAGSimple Constitution: Implementation Guide

**Date**: 2026-01-12 | **Constitution Version**: 1.0.0 | **Status**: ✅ ACTIVE

---

## Overview

The WCAGSimple Constitution has been established and is now the **source of truth** for all development decisions. This guide walks through implementation and enforcement.

---

## What Changed?

### ✅ Constitution Ratified

A comprehensive governance document covering:
- **7 Core Principles**: Accessibility-first, test-first, simplicity, security, naming conventions, UX clarity, observability
- **Code Organization Standards**: Defined directory structure for src/, tests/, docs/
- **Development Workflow**: Spec-kit integration for planning, TDD implementation, PR review gates
- **Governance & Amendment Process**: How to update principles while maintaining consistency

### ✅ Quick Reference Created

[CONSTITUTION_QUICK_REFERENCE.md](CONSTITUTION_QUICK_REFERENCE.md) provides:
- 7-principle summary table
- Naming convention examples (PascalCase/camelCase)
- Code review checklist
- Monthly audit schedule
- Workflow diagrams

### ✅ Templates Validated

All spec-kit templates are **compatible** with the constitution:
- `plan-template.md` → Constitution Check gates enforced
- `spec-template.md` → User stories support MVP focus
- `tasks-template.md` → TDD task structure validated
- Guidance files reviewed for consistency

### ✅ Sync Impact Report Generated

[SYNC_IMPACT_REPORT.md](.specify/memory/SYNC_IMPACT_REPORT.md) documents:
- Version change (N/A → 1.0.0)
- All 7 principles with rationale
- Template compatibility matrix
- Follow-up actions (optional, recommended, immediate)

---

## How to Use (For Developers)

### Starting a New Feature

```bash
# 1. Plan the feature using spec-kit
/speckit.plan --feature "Add new WCAG check"

# 2. Verify Constitution Check passes
# → Check against Principle I (Accessibility-First) & III (MVP scope)

# 3. Write the spec
/speckit.specify --feature "Add new WCAG check"

# 4. Break into tasks (TDD)
/speckit.tasks --feature "Add new WCAG check"

# 5. Implement with TDD discipline
#    - Write failing test (Red)
#    - Implement to pass (Green)
#    - Refactor for clarity (Refactor)

# 6. Follow naming conventions (Principle V)
#    - PascalCase: CrawlerEngine, AccessibilityCheck
#    - camelCase: scanUrl(), validateWCAG()

# 7. Verify accessibility (Principle I)
#    - WCAG 2.1 AA compliance documented
#    - UI components tested

# 8. Check test coverage (Principle II)
#    - 80% minimum for core modules
#    - Integration tests validate workflows

# 9. Audit dependencies (Principle IV)
#    - Run: npm audit / pip check
#    - No vulnerabilities before merge

# 10. Create PR with checklist
#     - All constitution gates passed
#     - Code review checklist completed
#     - Ready to merge
```

### Code Review Checklist

Use this when reviewing PRs. Every check must pass before approval:

```
## Constitution Compliance

### Accessibility (Principle I)
- [ ] Feature addresses accessibility or doesn't break it
- [ ] WCAG 2.1 AA compliance documented
- [ ] UI components tested for accessibility

### Testing (Principle II)
- [ ] TDD: Tests written before implementation
- [ ] Coverage: ≥80% for core modules
- [ ] Integration tests validate workflows
- [ ] Test names describe behavior clearly

### Scope (Principle III)
- [ ] Feature complexity is justified
- [ ] Scope limited to MVP (crawler/detection/reporting)
- [ ] No speculative features
- [ ] Spec.md created before implementation

### Security (Principle IV)
- [ ] No new dependencies without justification
- [ ] Lock files committed
- [ ] No vulnerable packages (npm audit / pip check)
- [ ] Breaking changes have migration plan

### Code Quality (Principle V)
- [ ] Naming: PascalCase classes, camelCase functions
- [ ] File structure: Organized by domain
- [ ] No cryptic abbreviations (except WCAG, HTML, CSS)
- [ ] Code readable without comments

### UX (Principle VI)
- [ ] Error messages are clear and actionable
- [ ] Reports explain *why* violations matter
- [ ] Remediation suggestions are concrete

### Observability (Principle VII)
- [ ] Operations logged with context
- [ ] Error messages include URL, rule ID, suggestion
- [ ] Logs are structured (JSON or similar)
```

---

## Enforcement: What's Required

### Immediate (Day 1)

✅ All developers read [CONSTITUTION_QUICK_REFERENCE.md](CONSTITUTION_QUICK_REFERENCE.md)  
✅ All PRs now subject to Constitution compliance verification  
✅ Naming conventions enforced in code review  
✅ Test coverage ≥80% required for core modules  

### Monthly

✅ First week of month: Run dependency security audit  
✅ Document critical/high vulnerabilities  
✅ Create issues for updates (with migration plans if breaking changes)

### Per-PR

✅ Verify Constitution compliance  
✅ Check naming conventions  
✅ Confirm test coverage  
✅ Validate accessibility standards  

### Per-Feature

✅ Create spec.md before implementation  
✅ Use spec-kit workflow (plan → specify → tasks)  
✅ Verify accessibility compliance  
✅ Document new dependencies with justification

---

## Handling Non-Compliance

### Scenario 1: PR violates naming conventions (Principle V)

**Action**: Request changes in review  
**Resolution**: Rename following PascalCase (classes) / camelCase (functions) rules

### Scenario 2: PR has <80% test coverage (Principle II)

**Action**: Block merge  
**Resolution**: Author adds tests to reach 80% threshold

### Scenario 3: Feature scope is unclear (Principle III)

**Action**: Block review until spec.md created  
**Resolution**: Author creates spec.md with justified complexity

### Scenario 4: New dependency with vulnerabilities (Principle IV)

**Action**: Block merge  
**Resolution**: Update to patched version OR choose different dependency OR justify exception (rare)

### Scenario 5: Accessibility impact not tested (Principle I)

**Action**: Request changes in review  
**Resolution**: Author adds accessibility test cases

---

## Questions & Escalation

| Question | Answer | Source |
|----------|--------|--------|
| Is this feature in scope? | Check Principle III: MVP = crawler + detection + reporting | constitution.md line 23 |
| How much test coverage? | Principle II: 80% minimum for core modules | constitution.md line 15 |
| What naming convention? | Principle V: PascalCase classes, camelCase functions | constitution.md line 35 |
| Can we add a dependency? | Principle IV: Justify, audit, document, no vulnerabilities | constitution.md line 28 |
| Is this accessible? | Principle I: WCAG 2.1 AA compliance required | constitution.md line 6 |
| Who approves exceptions? | Core team review of rationale + impact analysis | Governance section |

**Reference**: [WCAGSimple Constitution](.specify/memory/constitution.md)

---

## Amendment Process

To propose changes to the constitution:

1. **Document the amendment** with:
   - Current language (from constitution.md)
   - Proposed language (new text)
   - Rationale (why this change matters)
   - Impact analysis (affected principles, teams, workflows)

2. **Propose to core team** for review

3. **Get approval** from all core team members

4. **Bump version** per semantic versioning:
   - MAJOR: Backward-incompatible principle removals/redefinitions
   - MINOR: New principles or expanded guidance
   - PATCH: Clarifications, wording, non-semantic refinements

5. **Update dates**:
   - `Last Amended`: Today's date (YYYY-MM-DD)
   - Version line in constitution.md

6. **Execute migration plan** if needed

7. **Document in commit**: `docs: amend constitution to vX.Y.Z (description)`

Example:

```markdown
# Amendment Proposal: Strengthen dependency audit frequency

**Current (v1.0.0)**: "Monthly audits are mandatory"

**Proposed (v1.1.0)**: "Automated weekly dependency audits required; monthly manual review"

**Rationale**: Security landscape changes rapidly; waiting monthly risks missing zero-days

**Impact**: 
- Requires CI/CD integration (medium effort)
- Improves security posture (high value)
- Adds no burden to developers (automated)

**Migration**:
- Set up GitHub dependabot or similar
- Configure CI/CD gate for vulnerability scanning
- Document in .github/workflows/

**Approval**: [Team signatures]

**Version Bump**: 1.0.0 → 1.1.0 (MINOR: expanded guidance on audit frequency)
```

---

## Success Metrics

Once constitution is enforced, measure:

| Metric | Target | How to Track |
|--------|--------|-------------|
| Test Coverage | ≥80% for core modules | Run coverage report in CI |
| Naming Convention Compliance | 100% | Code review checklist |
| Accessibility Issues Found | TBD (baseline scan) | Run WCAG checker on core UI |
| Dependency Vulnerabilities | 0 critical/high | Monthly audit results |
| Feature Scope Clarity | 100% specs before code | Track: Does every PR link to spec.md? |
| Constitution Gate Failures | 0 merged non-compliant PRs | Code review discipline |

---

## Resources

- **Constitution** (source of truth): [.specify/memory/constitution.md](.specify/memory/constitution.md)
- **Quick Reference** (for developers): [CONSTITUTION_QUICK_REFERENCE.md](CONSTITUTION_QUICK_REFERENCE.md)
- **Sync Report** (governance tracking): [.specify/memory/SYNC_IMPACT_REPORT.md](.specify/memory/SYNC_IMPACT_REPORT.md)
- **Spec-Kit Templates**: [.specify/templates/](.specify/templates/)
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

## Next Steps

### Week 1: Onboarding
1. [ ] Share Constitution Quick Reference with team
2. [ ] Host 30-min orientation: The 7 Principles
3. [ ] Add constitution compliance to PR template
4. [ ] Set up GitHub branch protection with Constitution checks

### Week 2: Setup
1. [ ] Configure code coverage CI/CD gate (80% minimum)
2. [ ] Set up dependency audit automation (npm audit in CI)
3. [ ] Create accessibility testing framework
4. [ ] Add naming convention linter (ESLint, pylint, etc.)

### Week 3: First Feature
1. [ ] Identify first feature to implement
2. [ ] Run `/speckit.plan` and verify Constitution Check passes
3. [ ] Create spec.md with user stories and requirements
4. [ ] Break into TDD tasks
5. [ ] Implement with full discipline

### Ongoing
1. [ ] Monthly dependency audits (first: Feb 12, 2026)
2. [ ] Quarterly constitution review (any amendments needed?)
3. [ ] Track metrics (coverage, vulnerabilities, scope clarity)
4. [ ] Celebrate wins! 🎉

---

## Contact & Support

- **Questions about the constitution?** → Reference [.specify/memory/constitution.md](.specify/memory/constitution.md)
- **Need implementation clarification?** → Check [CONSTITUTION_QUICK_REFERENCE.md](CONSTITUTION_QUICK_REFERENCE.md)
- **Proposing an amendment?** → Follow Amendment Process above
- **Blocked on principle conflict?** → Escalate to core team with rationale

---

**Constitution Status**: ✅ ACTIVE  
**Ratification Date**: 2026-01-12  
**Version**: 1.0.0  
**Last Updated**: 2026-01-12
