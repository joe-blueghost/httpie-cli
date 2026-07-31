The review is structured as two sequential passes with a hard gate between them. You MUST complete Pass 1 before entering Pass 2. Do not combine them, interleave them, or skip Pass 1.

#### Pass 1: Spec Compliance

Walk every acceptance criterion from the source issue against the PR diff. For each criterion, produce a verdict:

- **Met** — the diff clearly implements the criterion
- **Partially met** — the diff addresses it but with gaps (explain what is missing)
- **Not met** — the criterion is not addressed by the changes

Format the output as a checklist:

```
## Pass 1: Spec Compliance

- [x] <criterion 1> — Met. <brief evidence>
- [~] <criterion 2> — Partially met. <what's missing>
- [ ] <criterion 3> — Not met. <explanation>
```

**Gate rule:** If ANY criterion is "Not met", the review stops here. Stop the review — do not proceed to Pass 2. "Partially met" criteria are judgment calls: if the gap is trivial (e.g., a missing edge case comment), proceed; if the gap is functional (e.g., a required behavior is absent), treat it as "Not met".

After completing Pass 1, explicitly state one of:

- **"All acceptance criteria verified. Proceeding to code quality review."** — then continue to Pass 2.
- **"Acceptance criteria not met. Stopping review."** — skip Pass 2 and go to Step 3.

#### Pass 2: Documentation updates

Changes impacting usage via the CLI, such as flags or arguments, must have correct documentation in httpie/cli/definition.py.

#### Pass 3: Code Quality (cold only)

Only entered after all acceptance criteria are met. Review these dimensions, categorizing each finding as **Critical** (blocking), **Important** (should fix), or **Suggestion** (non-blocking):

- **Architecture & patterns** — Does the implementation follow established codebase patterns? Are abstractions appropriate?
- **Error handling** — Are failure cases handled? Are errors propagated correctly?
- **Type safety** — Are types used correctly? Any `any` casts or unsafe assertions?
- **Test coverage** — Are the right behaviors tested? Are edge cases covered? Are tests BDD-style with descriptive names?
- **Security** — Any injection risks, exposed secrets, unsafe inputs?
- **Performance** — Any obvious inefficiencies, unnecessary re-renders, O(n²) loops on large data?
- **Code style** — Consistent with the codebase? Readable? Well-named?

Format the output:

```
## Pass 2: Code Quality

### Critical
- [file:line] Description of blocking issue

### Important
- [file:line] Description of significant concern

### Suggestions
- [file:line] Description of improvement opportunity
```

If there are no items in a category, write "None" under that heading. **Critical** items are blocking — if any exist, proceed to Step 3.