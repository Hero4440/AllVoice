# Testing the Ethics Logic Gate

The Ethics Logic Gate is the mandatory Kiro Spark Challenge constraint that stops the pipeline when privacy rules are violated.

## Quick Test Commands

```bash
# Run all Ethics Gate tests (unit + property)
npm test -- ethicsGate

# Run only unit tests (23 test cases)
npm test -- tests/unit/ethicsGate.test.ts

# Run only property tests (11 test cases, 100+ random inputs)
npm test -- tests/property/ethicsGate.property.test.ts

# Watch mode (re-runs on file changes)
npm test -- ethicsGate --watch

# Run interactive demo script
npx tsx scripts/test-ethics-gate.ts
```

## What Gets Tested

### Unit Tests (`tests/unit/ethicsGate.test.ts`)
- ✅ **PRIVACY_SENSITIVE_FIELD rule**: Blocks password, cc-number, cc-csc, new-password fields
- ✅ **PRIVACY_PII_SUBMISSION rule**: Blocks messages containing email, phone, SSN
- ✅ **SAFETY_UNLABELED_CONTROL rule**: Blocks clicks on unlabeled controls
- ✅ **CONTEXT_RESTRICTED rule**: Blocks execution on chrome:// pages
- ✅ **Full rule set integration**: First blocking rule wins
- ✅ **Determinism**: Same inputs → same outputs
- ✅ **Privacy violation strict halt**: Privacy violations always return "block", never "allow" or "modify"

### Property Tests (`tests/property/ethicsGate.property.test.ts`)
- ✅ **Determinism across 100+ random inputs**: Verifies pure function behavior
- ✅ **Strict halt for sensitive fields**: 50 random cases with password/cc fields
- ✅ **Strict halt for PII submission**: 50 random cases with PII patterns
- ✅ **Privacy violation flag correctness**: Ensures privacyViolation=true only for privacy rules

## Manual Testing Scenarios

### Scenario 1: Password Field (Privacy Violation)
```typescript
const intent = { action: 'draft_message', target: '#password', ... };
const browserState = { interactiveElements: [{ type: 'password', ... }], ... };
const decision = evaluateEthics(intent, browserState);
// Expected: decision='block', privacyViolation=true, ruleId='PRIVACY_SENSITIVE_FIELD'
```

### Scenario 2: PII in Message (Privacy Violation)
```typescript
const intent = { 
  action: 'send_message', 
  parameters: { messageContent: 'test@example.com' },
  ...
};
const decision = evaluateEthics(intent, browserState);
// Expected: decision='block', privacyViolation=true, ruleId='PRIVACY_PII_SUBMISSION'
```

### Scenario 3: Safe Action (Allowed)
```typescript
const intent = { action: 'add_to_cart', target: '#add-to-cart', ... };
const browserState = { interactiveElements: [{ textContent: 'Add to Cart', ... }], ... };
const decision = evaluateEthics(intent, browserState);
// Expected: decision='allow', privacyViolation=false
```

### Scenario 4: Unlabeled Control (Safety Block, Not Privacy)
```typescript
const intent = { action: 'click_unlabeled', ... };
const decision = evaluateEthics(intent, browserState);
// Expected: decision='block', privacyViolation=false, ruleId='SAFETY_UNLABELED_CONTROL'
```

### Scenario 5: Restricted Context (Safety Block, Not Privacy)
```typescript
const browserState = { url: 'chrome://settings', contextFlags: ['restricted-context'], ... };
const intent = { action: 'add_to_cart', ... };
const decision = evaluateEthics(intent, browserState);
// Expected: decision='block', privacyViolation=false, ruleId='CONTEXT_RESTRICTED'
```

## Testing for Judges (Demo Day)

When demonstrating the Ethics Logic Gate to Kiro Spark Challenge judges:

1. **Show the code** (`src/pipeline/ethicsGate.ts`):
   - Point out it's a synchronous pure function
   - Highlight the "first blocking rule wins" logic
   - Show the `privacyViolation` flag

2. **Run the interactive script**:
   ```bash
   npx tsx scripts/test-ethics-gate.ts
   ```
   This shows 6 real-world scenarios with clear output.

3. **Run the test suite**:
   ```bash
   npm test -- ethicsGate
   ```
   Shows 34 passing tests covering all requirements.

4. **Explain the privacy stop**:
   - When `decision='block'` and `privacyViolation=true`, the Safe_Executor is never called
   - The pipeline halts immediately
   - The user gets a spoken explanation via Chrome TTS
   - The violation is logged to the audit trail

## Integration Testing (Coming Soon)

Once the full pipeline is wired (Task 7 - orchestrator), you'll be able to test end-to-end:

```bash
# Load extension in Chrome
npm run build
# Chrome → Extensions → Load unpacked → select dist/

# Open demo/product.html
# Try voice command: "type my password"
# Expected: Ethics gate blocks, TTS announces reason, audit log records violation
```

## Key Properties Verified

✅ **Determinism** (Requirement 4.9): Same inputs always produce same outputs  
✅ **Privacy Strict Halt** (Requirement 14.5): Privacy violations always block, never allow/modify  
✅ **Human-Readable Reasons** (Requirement 4.2): Every block includes explanation  
✅ **Rule ID Tracking** (Requirement 4.10): Every decision includes which rule triggered  
✅ **Privacy Violation Flag** (Requirement 14.1): Correctly set for privacy rules only  

## Troubleshooting

**Tests fail with "Cannot find module"**:
```bash
npm install
```

**TypeScript errors**:
```bash
npm run build
```

**Want to add a new test case?**:
Edit `tests/unit/ethicsGate.test.ts` or `tests/property/ethicsGate.property.test.ts`

**Want to test a custom rule?**:
```typescript
import { evaluateEthics } from './src/pipeline/ethicsGate';
const customRule = { id: 'MY_RULE', evaluate: (intent, state) => { ... } };
const decision = evaluateEthics(intent, browserState, [customRule]);
```
