# TICKET-009: LLM Fix Generator (Anthropic)

## Context

Implement LLM-powered fix generation using Anthropic's Claude API for complex scenarios that rule-based strategies can't handle, such as API migrations and code refactoring.

## Prerequisites

- TICKET-001 (project setup)
- TICKET-005 (rule-based strategies)

## Objective

Create LLM fix generator that:

1. Integrates with Anthropic Claude API
2. Builds context-rich prompts with vulnerability details
3. Parses LLM responses into Fix objects
4. Handles API errors and rate limits
5. Tracks costs and token usage
6. Falls back to rule-based on failure

## Key Components

### `packages/fix-generator/src/llm-powered/anthropic.ts`

- `AnthropicFixGenerator` class
- Methods: `generateFix()`, `buildPrompt()`, `parseResponse()`
- Prompt templates for different vulnerability types
- Cost tracking

### `packages/fix-generator/src/llm-powered/prompt-templates.ts`

- Prompt templates for various scenarios
- Context building (vulnerability details, affected code, dependencies)
- Response format specifications

### `packages/fix-generator/src/strategy-selector.ts` (update)

- Add LLM strategy to selection logic
- Hybrid mode: try rule-based first, fall back to LLM
- Cost-based decision making

## Acceptance Criteria

### ✅ Validation Steps

1. Build succeeds: `npm run build`
2. Tests pass (8+ tests, can mock API): `npm test`
3. Can call Anthropic API successfully
4. Generates valid Fix objects from responses
5. Tracks token usage and costs
6. Handles API errors gracefully
7. Respects cost limits

### 📋 Checklist

- [ ] Anthropic API client
- [ ] Prompt template system
- [ ] Context building from vulnerability
- [ ] Response parsing to Fix objects
- [ ] Cost tracking
- [ ] Token usage monitoring
- [ ] Error handling and retries
- [ ] Rate limit handling
- [ ] Integration with StrategySelector
- [ ] Tests with mocked API responses

## Success Metrics

- ✅ Generates valid fixes for complex scenarios
- ✅ Stays within cost limits
- ✅ Handles API failures gracefully
- ✅ Response parsing is robust
- ✅ Test coverage > 80%

## Reference

- `TECHNICAL_SPEC.md` - FixStrategy interface
- `ARCHITECTURE.md` - LLM fix generation design
- Anthropic API docs: https://docs.anthropic.com/
