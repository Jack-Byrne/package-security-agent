# Security Agent - Implementation Guide

## Overview

This guide explains how to implement the Security Agent incrementally using self-contained tickets that can be given to fresh LLM agents with no prior context.

## Quick Start

### For Project Managers

1. **Review Planning Documents**
   - [`README.md`](README.md) - Project overview
   - [`ARCHITECTURE.md`](ARCHITECTURE.md) - System design
   - [`PROJECT_SUMMARY.md`](PROJECT_SUMMARY.md) - Executive summary
   - [`tickets/README.md`](tickets/README.md) - Ticket overview

2. **Assign Tickets**
   - Start with TICKET-001 (no dependencies)
   - Follow dependency chain in tickets/README.md
   - Each ticket takes 4-8 hours

3. **Track Progress**
   - Use validation steps to verify completion
   - Check success metrics before moving forward
   - Update ticket status in tickets/README.md

### For Developers/LLM Agents

1. **Get Your Ticket**
   - Read the assigned ticket completely
   - Check prerequisites are met
   - Review reference documents

2. **Implement**
   - Follow tasks step-by-step
   - Copy code examples exactly
   - Run commands as specified

3. **Validate**
   - Complete all validation steps
   - Verify expected outputs
   - Check all checklist items
   - Confirm success metrics

4. **Report**
   - Document any issues encountered
   - Note any deviations from ticket
   - Update ticket status

## Document Structure

### Planning Documents (Read First)

```
├── README.md                    # Project overview and quick start
├── ARCHITECTURE.md              # System architecture and design
├── IMPLEMENTATION_PLAN.md       # Detailed 12-week roadmap
├── TECHNICAL_SPEC.md           # API contracts and data models
├── PROJECT_SUMMARY.md          # Executive summary
└── IMPLEMENTATION_GUIDE.md     # This file
```

### Implementation Tickets (Work From These)

```
tickets/
├── README.md                   # Ticket overview and workflow
├── TICKET-001-project-setup.md
├── TICKET-002-npm-package-manager.md
├── TICKET-003-osv-vulnerability-source.md
└── ... (more tickets to be created)
```

## Ticket Workflow

### Step 1: Select Ticket

Choose the next ticket based on:

- ✅ All dependencies completed
- 📋 Ticket status is "Ready"
- 🎯 Aligns with current phase

Example:

```bash
# Check ticket dependencies
cat tickets/README.md | grep "TICKET-002"
# Output: TICKET-002 | NPM Package Manager | TICKET-001 | 6 hours | 📋 Ready

# Verify TICKET-001 is complete
ls packages/shared/dist/
# Should show compiled files
```

### Step 2: Read Ticket

Open and read the entire ticket:

```bash
cat tickets/TICKET-002-npm-package-manager.md
```

Key sections to understand:

1. **Context** - What you're building and why
2. **Prerequisites** - What must be done first
3. **Objective** - Clear goals
4. **Tasks** - Step-by-step instructions

### Step 3: Set Up Environment

```bash
# Ensure you're in project root
cd /path/to/security-agent

# Verify prerequisites
npm run build  # Should work if dependencies are met
npm test       # Should pass existing tests
```

### Step 4: Implement Tasks

Follow each task in order:

```bash
# Example from TICKET-002
cd packages/package-managers
npm install semver axios @types/semver

# Create files as specified in ticket
# Copy code examples exactly
# Follow all instructions
```

**Important**:

- Copy code examples exactly as written
- Don't skip steps
- Don't make assumptions
- If something is unclear, refer to reference documents

### Step 5: Run Validation Steps

Each ticket has deterministic validation steps:

```bash
# Example validation from TICKET-002
npm run build
# Expected: Exit code 0, dist/ directory created

npm test
# Expected: All tests pass (at least 8 tests)

npm run lint
# Expected: No linting errors

# Functional validation
node -e "
const { NpmPackageManager } = require('./dist/npm');
const manager = new NpmPackageManager();
manager.detect('.').then(result => console.log('Detected:', result));
"
# Expected: Output "Detected: true"
```

**Validation Rules**:

- ✅ All commands must return expected results
- ✅ All tests must pass
- ✅ No compilation errors
- ✅ No linting errors
- ✅ Functional tests produce correct output

### Step 6: Complete Checklist

Go through the ticket checklist:

```markdown
### 📋 Checklist

- [x] Package dependencies installed
- [x] Base interface created
- [x] NpmPackageManager class implemented
- [x] Tests written and passing
- [x] Build completes successfully
- [x] Linting passes
```

**All items must be checked** before proceeding.

### Step 7: Verify Success Metrics

Confirm all success metrics are met:

```markdown
## Success Metrics

- ✅ All 8+ tests pass
- ✅ Can detect NPM projects correctly
- ✅ Extracts all dependencies with correct metadata
- ✅ Updates package.json correctly
- ✅ Fetches real package metadata from npm registry
```

### Step 8: Update Status

Update the ticket status in `tickets/README.md`:

```markdown
| TICKET-002 | NPM Package Manager | TICKET-001 | 6 hours | ✅ Complete |
```

## Working with Fresh LLM Agents

### Giving Tickets to LLMs

When assigning a ticket to a fresh LLM agent:

1. **Provide the ticket file**

   ```
   Here is your implementation ticket. Please complete all tasks,
   run all validation steps, and report results.

   [Paste entire ticket content]
   ```

2. **Include reference documents** (if needed)

   ```
   For additional context, here are the reference documents:
   - ARCHITECTURE.md (system design)
   - TECHNICAL_SPEC.md (API contracts)
   ```

3. **Set expectations**
   ```
   - Follow all steps exactly
   - Run all validation commands
   - Report any issues or blockers
   - Confirm all checklist items
   - Verify success metrics
   ```

### Example Prompt

```
You are implementing TICKET-002 for the Security Agent project.

TICKET CONTENT:
[paste TICKET-002-npm-package-manager.md]

INSTRUCTIONS:
1. Read the entire ticket
2. Complete all tasks in order
3. Run all validation steps
4. Report results for each validation step
5. Confirm all checklist items are complete
6. Verify all success metrics are met

REFERENCE DOCUMENTS (if needed):
- TECHNICAL_SPEC.md contains the PackageManager interface
- ARCHITECTURE.md contains the system design

Please begin implementation and report your progress.
```

## Validation Philosophy

### Deterministic Validation

Every validation step must be:

- **Specific**: Exact command to run
- **Verifiable**: Clear expected output
- **Reproducible**: Same result every time

✅ **Good Example**:

```bash
npm test
# Expected: All tests pass (at least 8 tests)
# Expected output: "Tests: 8 passed, 8 total"
```

❌ **Bad Example**:

```bash
# Make sure it works
# Expected: Should be good
```

### Validation Levels

1. **Build Validation**

   ```bash
   npm run build
   # Expected: Exit code 0, no errors
   ```

2. **Test Validation**

   ```bash
   npm test
   # Expected: All tests pass, coverage > 80%
   ```

3. **Lint Validation**

   ```bash
   npm run lint
   # Expected: No errors, no warnings
   ```

4. **Functional Validation**

   ```bash
   node -e "const x = require('./dist'); console.log(typeof x.MyClass)"
   # Expected: Output "function"
   ```

5. **Integration Validation**
   ```bash
   # Test with real data
   node -e "const m = new Manager(); m.scan('./test').then(r => console.log(r.length))"
   # Expected: Output number > 0
   ```

## Common Issues and Solutions

### Issue: Dependencies Not Met

**Symptom**: Validation fails with "module not found"

**Solution**:

```bash
# Check if dependency tickets are complete
ls packages/shared/dist/
# Should show compiled files

# Rebuild dependencies
npm run build
```

### Issue: Tests Fail

**Symptom**: `npm test` returns errors

**Solution**:

1. Read error messages carefully
2. Check if code matches ticket exactly
3. Verify test files are created
4. Check imports and exports

### Issue: Unclear Instructions

**Symptom**: Don't understand what to do

**Solution**:

1. Re-read the Context section
2. Check reference documents (ARCHITECTURE.md, TECHNICAL_SPEC.md)
3. Look at similar completed tickets
4. Review the Objective section

### Issue: Validation Step Fails

**Symptom**: Command doesn't produce expected output

**Solution**:

1. Verify all previous steps completed
2. Check for typos in code
3. Ensure files are in correct locations
4. Review error messages
5. Check if dependencies are installed

## Best Practices

### For Ticket Creators

1. **Be Explicit**: Include complete code, not snippets
2. **Be Specific**: Exact commands and expected outputs
3. **Be Complete**: All information needed in one place
4. **Be Testable**: Every deliverable must be verifiable

### For Implementers

1. **Read Completely**: Don't skip sections
2. **Follow Exactly**: Don't improvise or "improve"
3. **Validate Thoroughly**: Run all validation steps
4. **Report Accurately**: Document what you did

### For Reviewers

1. **Check Validation**: Verify all steps were run
2. **Check Checklist**: Ensure all items completed
3. **Check Metrics**: Confirm success criteria met
4. **Check Quality**: Review code matches ticket

## Progress Tracking

### Daily Standup Template

```markdown
## Yesterday

- Completed: TICKET-002 (NPM Package Manager)
- Validated: All 8 tests passing
- Blocked: None

## Today

- Starting: TICKET-003 (OSV.dev Integration)
- Goal: Complete implementation and validation

## Blockers

- None
```

### Weekly Review Template

```markdown
## Week X Progress

### Completed Tickets

- ✅ TICKET-001: Project Setup (4h)
- ✅ TICKET-002: NPM Package Manager (6h)
- ✅ TICKET-003: OSV.dev Integration (6h)

### In Progress

- 🚧 TICKET-004: Package Age Validator (50% complete)

### Metrics

- Total tickets: 3 complete, 1 in progress
- Total time: 16 hours
- Test coverage: 85%
- All validations passing: Yes

### Next Week

- Complete TICKET-004
- Start TICKET-005 (Fix Strategies)
```

## Quality Gates

Before marking a ticket complete:

- [ ] All tasks completed
- [ ] All validation steps pass
- [ ] All checklist items checked
- [ ] All success metrics met
- [ ] Code committed to git
- [ ] Documentation updated
- [ ] No known issues

## Getting Help

### Resources

1. **Planning Documents**: Architecture and design decisions
2. **Technical Spec**: API contracts and interfaces
3. **Completed Tickets**: Examples and patterns
4. **Reference Code**: Similar implementations

### Escalation Path

1. **Level 1**: Review ticket and reference documents
2. **Level 2**: Check similar completed tickets
3. **Level 3**: Review planning documents
4. **Level 4**: Consult with team/project lead

## Summary

The ticket-based approach enables:

- ✅ **Incremental progress**: Small, manageable chunks
- ✅ **Parallel work**: Multiple tickets simultaneously
- ✅ **Fresh context**: Each ticket is self-contained
- ✅ **Quality assurance**: Deterministic validation
- ✅ **Clear tracking**: Explicit success criteria

Follow this guide to ensure smooth, predictable implementation of the Security Agent system.
