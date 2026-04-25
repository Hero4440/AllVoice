import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { BrowserState, ExecutionResult, Intent, EthicsDecision } from '../../src/pipeline/types';

// Mock all pipeline stage modules at the top level
vi.mock('../../src/pipeline/intentParser', () => ({
  parseIntent: (rawTranscript: string): Intent => ({
    action: 'add_to_cart',
    target: '#add-to-cart',
    parameters: {},
    rawTranscript,
  }),
}));

vi.mock('../../src/pipeline/auditLog', () => ({
  logEntry: vi.fn().mockResolvedValue(undefined),
}));

// Mock ethics gate with a controllable implementation
const mockEvaluateEthics = vi.fn<(intent: Intent, browserState: BrowserState) => EthicsDecision>();

vi.mock('../../src/pipeline/ethicsGate', () => ({
  evaluateEthics: (...args: [Intent, BrowserState]) => mockEvaluateEthics(...args),
}));

// Import after mocks are set up
import { runPipeline } from '../../src/pipeline/orchestrator';

const mockBrowserState: BrowserState = {
  url: 'https://example.com/product',
  title: 'Product Page',
  focusedElement: null,
  interactiveElements: [
    {
      tagName: 'BUTTON',
      role: 'button',
      ariaLabel: 'Add to Cart',
      textContent: 'Add to Cart',
      id: 'add-to-cart',
      selector: '#add-to-cart',
      hasAccessibleName: true,
    },
  ],
  contextFlags: [],
};

const mockObserveBrowser = vi.fn().mockResolvedValue(mockBrowserState);

const mockExecuteAction = vi.fn().mockResolvedValue({
  status: 'success',
  details: 'Clicked Add to Cart button',
} satisfies ExecutionResult);

describe('Pipeline Orchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: ethics gate allows everything
    mockEvaluateEthics.mockReturnValue({
      decision: 'allow',
      reason: null,
      ruleId: null,
      modifiedIntent: null,
      privacyViolation: false,
    });
  });

  it('should run all 6 stages and return a complete PipelineContext', async () => {
    const ctx = await runPipeline('add to cart', mockObserveBrowser, mockExecuteAction);

    expect(ctx.rawTranscript).toBe('add to cart');
    expect(ctx.intent).not.toBeNull();
    expect(ctx.intent?.action).toBe('add_to_cart');
    expect(ctx.browserState).not.toBeNull();
    expect(ctx.ethicsDecision).not.toBeNull();
    expect(ctx.executionResult).not.toBeNull();
    expect(ctx.response).not.toBeNull();
    expect(ctx.timestamp).toBeGreaterThan(0);
  });

  it('should call observeBrowser callback', async () => {
    await runPipeline('add to cart', mockObserveBrowser, mockExecuteAction);
    expect(mockObserveBrowser).toHaveBeenCalled();
  });

  it('should call executeAction when ethics allows', async () => {
    await runPipeline('add to cart', mockObserveBrowser, mockExecuteAction);
    expect(mockExecuteAction).toHaveBeenCalled();
  });

  it('should skip executeAction when ethics blocks', async () => {
    // Override ethics gate to block
    mockEvaluateEthics.mockReturnValue({
      decision: 'block',
      reason: 'Targets sensitive field',
      ruleId: 'PRIVACY_SENSITIVE_FIELD',
      modifiedIntent: null,
      privacyViolation: true,
    });

    const execAction = vi.fn();
    const ctx = await runPipeline('click password', mockObserveBrowser, execAction);

    expect(execAction).not.toHaveBeenCalled();
    expect(ctx.executionResult?.status).toBe('blocked');
    expect(ctx.response?.type).toBe('blocked');
  });

  it('should handle action execution errors gracefully', async () => {
    const failingExecute = vi.fn().mockRejectedValue(new Error('Element not found'));

    const ctx = await runPipeline('add to cart', mockObserveBrowser, failingExecute);

    expect(ctx.executionResult?.status).toBe('error');
    expect(ctx.executionResult?.details).toContain('Element not found');
    expect(ctx.response).not.toBeNull();
  });

  it('should handle action execution timeout', async () => {
    const slowExecute = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000))
    );

    const ctx = await runPipeline('add to cart', mockObserveBrowser, slowExecute);

    expect(ctx.executionResult?.status).toBe('timeout');
    expect(ctx.executionResult?.details).toContain('timed out');
  }, 10000);

  it('should populate timestamp on the context', async () => {
    const before = Date.now();
    const ctx = await runPipeline('add to cart', mockObserveBrowser, mockExecuteAction);
    const after = Date.now();

    expect(ctx.timestamp).toBeGreaterThanOrEqual(before);
    expect(ctx.timestamp).toBeLessThanOrEqual(after);
  });
});
