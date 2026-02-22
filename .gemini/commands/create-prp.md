# Create PRP (Product Requirement Prompt)

You are tasked with creating a comprehensive PRP for a new feature in JumpBoard v3.

## What is a PRP?

A PRP (Product Requirement Prompt) is a structured document that provides an AI coding agent with everything needed to deliver production-ready code on the first pass. It combines:
- **Product requirements** (what to build and why)
- **Codebase intelligence** (existing patterns, files to reference)
- **Implementation guidance** (how to build it)
- **Validation criteria** (how to verify it works)

## Research Process

Before creating the PRP, conduct thorough research:

### 1. Documentation Review
- Read `ai_docs/` directory for existing context
- Review `CLAUDE.md` for project conventions
- Check `docs/` for relevant documentation

### 2. Codebase Exploration
- Identify similar features in the codebase
- Find relevant files to reference
- Understand existing patterns and conventions
- Map out affected areas

### 3. Web Research (if needed)
- Search for library documentation
- Find best practices for the feature type
- Look for relevant examples

### 4. Template Reference
- Use `concept_library/cc_PRP_flow/PRPs/base_template_v1.md` as structural guide

## PRP Output Structure

Create a PRP file in `PRPs/` with this structure:

```markdown
# [Feature Name] PRP

## Goal
[One clear sentence describing what we're building]

## Why
[Business justification - who benefits and how]

## What
[Detailed description of the feature]
- Scope boundaries (what's included/excluded)
- User stories or use cases

## Technical Context

### Files to Reference (read-only)
- `path/to/file.ts` - [why this file is relevant]
- ...

### Files to Implement/Modify
- `path/to/new/file.ts` - [what this file will do]
- `path/to/existing/file.ts` - [what changes needed]
- ...

### Existing Patterns to Follow
[Code patterns from the codebase to replicate]

## Implementation Details

### API/Endpoints (if applicable)
[Endpoint specs with request/response formats]

### Database Changes (if applicable)
[Schema changes, migrations, RLS policies]

### Components (if applicable)
[UI components to create/modify]

## Validation Criteria

### Functional Requirements
- [ ] [Testable requirement 1]
- [ ] [Testable requirement 2]

### Technical Requirements
- [ ] TypeScript compiles without errors
- [ ] RLS policies enforce multi-tenancy
- [ ] No console errors in browser

### Testing Steps
1. [Step-by-step verification process]
```

## User Confirmation

Before finalizing the PRP, confirm with the user:
1. Scope is correct
2. Approach aligns with expectations
3. No missing requirements

If the user says "continue" or confirms, save the PRP to `PRPs/[feature-name].md`.

---

**Input:** $ARGUMENTS

Please describe the feature you want to implement. I'll research the codebase and create a comprehensive PRP for it.
