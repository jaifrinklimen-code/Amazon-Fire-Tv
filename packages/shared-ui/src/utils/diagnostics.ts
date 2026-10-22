/**
 * CinePilot AI - Centralized Structured Diagnostics and Observability
 * Replaces unstructured console messages with categorized, sensitive-data-scrubbed diagnostics.
 */

export type DiagnosticCategory =
  | 'Configuration'
  | 'InvalidInput'
  | 'AssetResolution'
  | 'StorageAccess'
  | 'SchemaMigration'
  | 'PlaybackInitialization'
  | 'PlaybackError'
  | 'NavigationFailure'
  | 'RemoteEventHandling'
  | 'Lifecycle';

export type DiagnosticSeverity = 'debug' | 'info' | 'warn' | 'error';

export interface DiagnosticEvent {
  timestamp: number;
  category: DiagnosticCategory;
  severity: DiagnosticSeverity;
  operation: string;
  message: string;
  contentId?: string;
  metadata?: Record<string, unknown>;
}

// Bounded in-memory ring buffer for recent diagnostics (no third-party telemetry dependency)
const MAX_BUFFER_SIZE = 100;
const eventBuffer: DiagnosticEvent[] = [];

/**
 * Scrubs sensitive patterns such as tokens, passwords, and sensitive query params from messages or metadata.
 */
export function scrubSensitiveData(input: string): string {
  if (!input) return input;
  return input
    .replace(/(api[_-]?key|token|auth|secret|password)=([^&]+)/gi, '$1=[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9_\-\.]+/gi, '$1[REDACTED]')
    .replace(/\/\/[^:@\/\s]+:[^@\/\s]+@/g, '//[REDACTED]@');
}

/**
 * Safely sanitizes arbitrary metadata object to ensure it is JSON-serializable
 * and does not expose sensitive keys.
 */
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata || typeof metadata !== 'object') return undefined;
  const result: Record<string, unknown> = {};

  const sensitiveKeyRegex = /token|auth|secret|pass|key|credential/i;

  for (const [k, v] of Object.entries(metadata)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;

    if (sensitiveKeyRegex.test(k)) {
      result[k] = '[REDACTED]';
    } else if (typeof v === 'string') {
      result[k] = scrubSensitiveData(v);
    } else if (typeof v === 'number' || typeof v === 'boolean' || v === null) {
      result[k] = v;
    } else if (typeof v === 'object') {
      try {
        result[k] = JSON.parse(JSON.stringify(v));
      } catch {
        result[k] = '[Complex Object]';
      }
    } else {
      result[k] = String(v);
    }
  }

  return result;
}

/**
 * Records a structured diagnostic event and safely outputs to standard console in development.
 */
export function logDiagnostic(
  category: DiagnosticCategory,
  severity: DiagnosticSeverity,
  operation: string,
  message: string,
  contentId?: string,
  metadata?: Record<string, unknown>,
): DiagnosticEvent {
  const sanitizedMessage = scrubSensitiveData(message);
  const sanitizedMeta = sanitizeMetadata(metadata);

  const event: DiagnosticEvent = {
    timestamp: Date.now(),
    category,
    severity,
    operation,
    message: sanitizedMessage,
    contentId: contentId ? scrubSensitiveData(contentId) : undefined,
    metadata: sanitizedMeta,
  };

  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    eventBuffer.shift();
  }
  eventBuffer.push(event);

  const prefix = `[CinePilot:${category}:${operation}]`;
  if (__DEV__) {
    switch (severity) {
      case 'error':
        console.error(prefix, sanitizedMessage, sanitizedMeta ?? '');
        break;
      case 'warn':
        console.warn(prefix, sanitizedMessage, sanitizedMeta ?? '');
        break;
      case 'info':
        console.info(prefix, sanitizedMessage, sanitizedMeta ?? '');
        break;
      case 'debug':
      default:
        console.log(prefix, sanitizedMessage, sanitizedMeta ?? '');
        break;
    }
  }

  return event;
}

/**
 * Returns recent diagnostic events for troubleshooting or in-app support view.
 */
export function getRecentDiagnostics(): DiagnosticEvent[] {
  return [...eventBuffer];
}

/**
 * Clears buffered diagnostic events (used in test cleanups).
 */
export function clearDiagnosticBuffer(): void {
  eventBuffer.length = 0;
}
