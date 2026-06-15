# Enhanced Refactor Skill (Consolidated from Community Best Practices)

**Sources synthesized (2026):**
- github/awesome-copilot/skills/refactor + review-and-refactor + refactor-plan
- citypaul dotfiles (TDD REFACTOR phase, mutation testing gate, commit-before)
- FlorianBruniaux claude-code-ultimate-guide (SOLID Refactoring Assistant)
- Community patterns (safe-refactor, refactoring-patterns, request-refactor-plan)

This is a **production-grade** refactor skill. Drop the content below (after the frontmatter) into:
- `~/.claude/skills/refactor/SKILL.md` (Claude Code)
- `.github/skills/refactor/SKILL.md` (GitHub Copilot / VS Code)
- Or any compatible agent skills directory.

---

```yaml
---
name: refactor
description: |
  Advanced surgical code refactoring. Plan-first for multi-file work. TDD-aware (only after strong tests + mutation kill). Behavior-preserving. Covers code smells catalog, SOLID violations, extract patterns, type safety, design patterns, safe legacy modernization, and commit safety nets. 
  Use when user says "refactor", "clean up", "improve structure", "reduce technical debt", or after mutation testing in TDD.
  For untested code use characterisation-tests first. For pure architecture overhaul consider larger workflow skills.
license: MIT (inspired by awesome-copilot)
---
```

# Refactor (Enhanced)

## Core Principles (Non-Negotiable)

1. **Behavior is sacred** — External behavior never changes. Tests (or characterisation tests) must prove it.
2. **Small, verifiable steps** — One smell / one extraction / one pattern at a time. Run tests after each.
3. **Safety net always** — `git commit` the working state *before* any refactoring.
4. **Plan before multi-file edits** — Never start touching files on anything spanning >1 logical unit without an explicit plan.
5. **Tests first, then refactor** (TDD REFACTOR phase) — Only enter this skill after GREEN + mutation testing has validated test strength.
6. **DRY = shared knowledge, not duplicated text** — Only abstract when the concepts would evolve together.

## When to Use This Skill

- User explicitly asks to refactor, clean up, simplify, improve maintainability, remove duplication, apply SOLID, etc.
- After you (or another skill) have completed the REFACTOR phase of TDD / mutation testing.
- Code smells are blocking feature work or readability.
- Legacy code that has characterisation tests or a good test suite.
- Preparing code for a feature addition (make the change easy, then make the easy change).

## When NOT to Refactor (Important)

- No tests / weak tests and you haven't written characterisation tests yet.
- Code works and will never be touched again ("if it ain't broke...").
- Under extreme time pressure (document the debt instead).
- Speculative refactoring ("might be useful later").
- The only reason is "to make it easier to unit test" — keep behavior coverage in the consuming function.
- Purely cosmetic changes with no maintainability win.

## Mandatory Workflow (Especially for Anything Non-Trivial)

### Phase 0: Safety & Context (Always)
1. **Commit current working state** (or stash + branch).
2. Run full test suite + type check + lint.
3. If no strong tests → stop and recommend `characterisation-tests` or `test-driven-development` skill first.

### Phase 1: Plan (for > single small function / file)
Use the **Refactor Plan** output format below. Investigate first. Output the plan. **Stop and ask for explicit confirmation** ("Shall I proceed with Phase 1?") before editing any files.

### Phase 2: Execute Incrementally
- One change category at a time (types → implementation → callers → tests → cleanup).
- Run relevant tests after every logical unit of change.
- Commit after each safe green state with clear `refactor:` message.
- Revert immediately on any breakage.

### Phase 3: Validate
- All tests still pass (ideally with mutation testing re-run on changed areas).
- No new public surface unless explicitly intended.
- Code is objectively more readable / maintainable (smaller functions, better names, lower complexity, fewer smells).
- Diff is reviewable.

## Refactor Plan Output Format (Use for Multi-File / Risky Work)

```
## Refactor Plan: [Short title]

### Current State
[How the code is structured today, key pain points]

### Target State
[Desired structure after, benefits]

### Affected Files
| File | Change Type (modify/create/delete) | Dependencies / Risks |
|------|------------------------------------|----------------------|
| src/services/user.ts | modify | blocks auth, needs UserService split |

### Execution Plan (Phased, Safe Order)

#### Phase 1: Types & Contracts (least risk)
- [ ] 1.1 Extract `UserProfile` interface from `UserService` in `src/services/user.ts`
- [ ] Verify: `tsc --noEmit` + grep for usages

#### Phase 2: Implementation
- [ ] 2.1 Split responsibilities (Auth vs Profile vs Notification)
...

#### Phase 3: Callers & Integration
...

#### Phase 4: Tests & Characterisation
- [ ] Update / add tests
- [ ] Verify: `npm test -- --grep "UserService"`

#### Phase 5: Cleanup
- [ ] Remove dead code, deprecated exports, old comments
- [ ] Update docs / JSDoc

### Rollback Plan
1. `git checkout -- <files>` or `git reset --hard <pre-refactor-commit>`
2. ...

### Risks & Mitigations
- Risk: ... | Mitigation: ...

### Verification Command (final)
`npm run typecheck && npm test && npm run lint`

After printing the plan: "Shall I proceed with Phase 1?"
```

## Code Smells Catalog + Concrete Fixes (High Value Targets)

(Include the excellent before/after examples from awesome-copilot for Long Method, Duplicated Code, Large Class, Long Parameter List, Feature Envy, Primitive Obsession, Magic Numbers, Nested Conditionals / Arrow Code, Dead Code, Inappropriate Intimacy.)

**Priority heuristic** (from TDD community):
- **Critical** (do now): Knowledge duplication, mutations surviving, >3 levels nesting, god objects.
- **High** (this session): Magic numbers/strings, unclear names, functions >30-50 lines.
- **Nice to have** (later): Minor naming, single-use helpers that are already clear.
- **Skip**: Already clean, or change would be speculative.

## SOLID-Focused Analysis (Use When Relevant)

Produce a quick scorecard:

| Principle | Status | Issues |
|-----------|--------|--------|
| S - Single Responsibility | 🟡 | 2 large services |
| O - Open/Closed | 🟢 | - |
| ... | ... | ... |

Then give **prioritized refactorings** with:
- Violation
- Current vs Suggested (small example)
- Risk level
- Tests needed
- Quick wins list

Common detection commands (run via terminal):
- Large files: `find . -name "*.ts" -exec wc -l {} + | sort -rn | head -10`
- Long parameter lists, deep nesting, duplication clusters, etc.

## Specific High-Impact Patterns

- Extract Method (with before/after examples)
- Guard Clauses / Early Return (replace arrow code)
- Introduce Parameter Object / Value Object
- Replace Conditional with Polymorphism (Strategy / State)
- Replace Magic Numbers with Named Constants / Enums
- Extract Class / Split Responsibilities
- Introduce Explaining Variable / Function for complex conditions
- Remove Dead Code (git history is the safety net)

## Commit Messages (Pure Refactoring)

```
refactor: extract membership discount rate calculation
refactor: replace switch on paymentType with PaymentProcessor strategy
refactor: introduce Email value object and tighten validation
refactor: split UserService into Auth + Profile + Notification services
```

Never mix with feature work in the same commit.

## Final Safety Checklist (Print This Before Applying Changes)

- [ ] Working state committed (or on a clean branch)
- [ ] Full test suite green + typecheck + lint before starting
- [ ] Plan produced and approved (if multi-file)
- [ ] One smell / one extraction at a time
- [ ] Tests re-run and green after each step
- [ ] No behavior change (tests + characterisation prove it)
- [ ] No new public API unless the goal explicitly includes it
- [ ] Diff is small and reviewable
- [ ] Separate commit(s) with `refactor:` prefix

## Quick Usage Examples

```bash
# Simple single-file cleanup
/refactor src/utils/price.ts

# Plan + execute a service split
/refactor src/services/user.ts --plan   # or just describe the goal

# Focus on SOLID
/refactor src/ --focus=srp,ocp

# After TDD mutation testing phase (this skill triggers naturally here)
```

**Remember**: The best refactor is often the one you *don't* do because the code was already good enough or the tests weren't strong enough yet.

---

**How to install in your agent environment**:
1. Create the directory `~/.claude/skills/refactor/` (or equivalent for Copilot).
2. Save the frontmatter + body above as `SKILL.md` inside it.
3. Restart / re-auth the agent.

This version is deliberately more comprehensive and opinionated than the basic bundled one — combining plan discipline, TDD safety, SOLID analysis, and rich pattern catalog while staying actionable.

If you want language-specific variants (e.g. heavy TypeScript value objects, Python dataclasses, Java records + sealed classes), I can generate those too.
