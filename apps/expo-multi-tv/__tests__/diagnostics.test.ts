import {
  logDiagnostic,
  scrubSensitiveData,
  getRecentDiagnostics,
  clearDiagnosticBuffer,
} from '../../../packages/shared-ui/src/utils/diagnostics';

describe('Diagnostics & Observability Hardening', () => {
  beforeEach(() => {
    clearDiagnosticBuffer();
  });

  describe('Sensitive Data Scrubbing', () => {
    it('redacts query parameter tokens and api keys', () => {
      const input = 'https://stream.example.com/play?token=abcdef123456&user=john';
      const scrubbed = scrubSensitiveData(input);
      expect(scrubbed).not.toContain('abcdef123456');
      expect(scrubbed).toContain('token=[REDACTED]');
      expect(scrubbed).toContain('user=john');
    });

    it('redacts Authorization Bearer tokens', () => {
      const input = 'Headers: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz';
      const scrubbed = scrubSensitiveData(input);
      expect(scrubbed).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(scrubbed).toContain('Bearer [REDACTED]');
    });

    it('redacts basic auth credentials in URLs', () => {
      const input = 'https://admin:mySecretPassword123@api.stream.com/v1';
      const scrubbed = scrubSensitiveData(input);
      expect(scrubbed).not.toContain('admin:mySecretPassword123');
      expect(scrubbed).toContain('https://[REDACTED]@api.stream.com/v1');
    });
  });

  describe('Structured Logging & Ring Buffer', () => {
    it('records categorized diagnostic events in ring buffer', () => {
      const event = logDiagnostic(
        'PlaybackInitialization',
        'info',
        'startStream',
        'Initializing video player',
        'the-boys',
        { resolution: '4K', bitrate: 15000 },
      );

      expect(event.category).toBe('PlaybackInitialization');
      expect(event.operation).toBe('startStream');
      expect(event.contentId).toBe('the-boys');
      expect(event.metadata?.resolution).toBe('4K');

      const buffer = getRecentDiagnostics();
      expect(buffer.length).toBe(1);
      expect(buffer[0].message).toBe('Initializing video player');
    });

    it('scrubs sensitive metadata fields automatically', () => {
      logDiagnostic(
        'Configuration',
        'warn',
        'loadConfig',
        'Failed with token=secretVal',
        undefined,
        { apiKey: 'super-secret-key-99', safeField: 'active' },
      );

      const buffer = getRecentDiagnostics();
      expect(buffer[0].metadata?.apiKey).toBe('[REDACTED]');
      expect(buffer[0].metadata?.safeField).toBe('active');
    });

    it('enforces maximum buffer capacity with FIFO eviction', () => {
      for (let i = 0; i < 110; i++) {
        logDiagnostic('StorageAccess', 'debug', 'read', `Event ${i}`);
      }

      const buffer = getRecentDiagnostics();
      expect(buffer.length).toBe(100);
      expect(buffer[0].message).toBe('Event 10');
      expect(buffer[99].message).toBe('Event 109');
    });
  });
});
