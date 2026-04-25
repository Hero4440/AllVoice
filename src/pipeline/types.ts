/**
 * Core TypeScript interfaces for the AllVoice six-stage pipeline.
 *
 * Pipeline flow: Intent_Parser → Browser_Observer → Ethics_Logic_Gate
 *                → Safe_Executor → Response_Generator → Audit_Log
 *
 * All pipeline stages share the PipelineContext object.
 */

// ---------------------------------------------------------------------------
// Action Types
// ---------------------------------------------------------------------------

/** All supported voice command action types */
export type ActionType =
  | 'describe_screen'
  | 'add_to_cart'
  | 'purchase'
  | 'draft_message'
  | 'send_message'
  | 'confirm_pending'
  | 'click_unlabeled'
  | 'navigate'
  | 'checkout'
  | 'go_back'
  | 'unrecognized';

// ---------------------------------------------------------------------------
// Intent (Stage 1 output)
// ---------------------------------------------------------------------------

/** Structured intent produced by the Intent Parser from a voice transcript */
export interface Intent {
  action: ActionType;
  target: string | null;
  parameters: Record<string, string>;
  rawTranscript: string;
}

// ---------------------------------------------------------------------------
// Browser State (Stage 2 output)
// ---------------------------------------------------------------------------

/** Summary of a single interactive DOM element */
export interface ElementSummary {
  tagName: string;
  role: string | null;
  ariaLabel: string | null;
  textContent: string;
  id: string | null;
  selector: string;
  hasAccessibleName: boolean;
  type?: string;
  autocomplete?: string;
}

/** Captured state of the active browser tab */
export interface BrowserState {
  url: string;
  title: string;
  focusedElement: ElementSummary | null;
  interactiveElements: ElementSummary[];
  contextFlags: ('restricted-context' | 'inaccessible')[];
}

// ---------------------------------------------------------------------------
// Ethics Decision (Stage 3 output)
// ---------------------------------------------------------------------------

/** Decision produced by the Ethics Logic Gate */
export interface EthicsDecision {
  decision: 'allow' | 'block' | 'modify';
  reason: string | null;
  ruleId: string | null;
  modifiedIntent: Intent | null;
  privacyViolation: boolean;
}

/** A declarative ethics rule evaluated by the Ethics Logic Gate */
export interface EthicsRule {
  id: string;
  name: string;
  description: string;
  evaluate: (intent: Intent, browserState: BrowserState) => EthicsDecision | null;
}

// ---------------------------------------------------------------------------
// Execution Result (Stage 4 output)
// ---------------------------------------------------------------------------

/** Result of executing an approved action on the page DOM */
export interface ExecutionResult {
  status: 'success' | 'error' | 'timeout' | 'blocked';
  details: string;
  elementsAffected?: string[];
}

// ---------------------------------------------------------------------------
// Response Message (Stage 5 output)
// ---------------------------------------------------------------------------

/** Accessible spoken and visual feedback message */
export interface ResponseMessage {
  text: string;
  type: 'success' | 'blocked' | 'error' | 'info';
}

// ---------------------------------------------------------------------------
// Pipeline Context (shared across all stages)
// ---------------------------------------------------------------------------

/** The shared context object passed through all six pipeline stages */
export interface PipelineContext {
  timestamp: number;
  rawTranscript: string;
  intent: Intent | null;
  browserState: BrowserState | null;
  ethicsDecision: EthicsDecision | null;
  executionResult: ExecutionResult | null;
  response: ResponseMessage | null;
}

// ---------------------------------------------------------------------------
// Audit Log (Stage 6 output)
// ---------------------------------------------------------------------------

/** A single audit log entry persisted to chrome.storage.local */
export interface AuditLogEntry {
  id: string;
  timestamp: number;
  rawTranscript: string;
  intent: Intent | null;
  browserStateSummary: {
    url: string;
    title: string;
    contextFlags: string[];
  } | null;
  ethicsDecision: {
    decision: string;
    reason: string | null;
    ruleId: string | null;
    privacyViolation: boolean;
  } | null;
  executionResult: {
    status: string;
    details: string;
  } | null;
  response: {
    text: string;
    type: string;
  } | null;
}

// ---------------------------------------------------------------------------
// User Preferences
// ---------------------------------------------------------------------------

/** User preferences synced via chrome.storage.sync */
export interface UserPreferences {
  highContrastMode: boolean;
  microphoneShortcut: string;
  auditLogRetentionDays: number;
}
