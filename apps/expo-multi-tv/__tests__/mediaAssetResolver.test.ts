import {
  resolveMediaAsset,
  resolvePosterUrl,
  resolveBackdropUrl,
  resolveStreamUrl,
} from '../../../packages/shared-ui/src/utils/mediaAssetResolver';
import {
  DEFAULT_POSTER_FALLBACK,
  DEFAULT_BACKDROP_FALLBACK,
} from '../../../packages/shared-ui/src/utils/sanitizeUrl';

describe('MediaAssetResolver & Trust Boundaries', () => {
  describe('Input Validation & Safe Category Handling', () => {
    it('handles null, undefined, and non-string inputs safely with fallbacks', () => {
      const nullPoster = resolveMediaAsset(null, 'poster');
      expect(nullPoster.isValid).toBe(false);
      expect(nullPoster.isFallback).toBe(true);
      expect(nullPoster.uri).toBe(DEFAULT_POSTER_FALLBACK);

      const undefBackdrop = resolveMediaAsset(undefined, 'backdrop');
      expect(undefBackdrop.isValid).toBe(false);
      expect(undefBackdrop.isFallback).toBe(true);
      expect(undefBackdrop.uri).toBe(DEFAULT_BACKDROP_FALLBACK);

      const numInput = resolveMediaAsset(12345, 'poster');
      expect(numInput.isValid).toBe(false);
      expect(numInput.isFallback).toBe(true);
    });

    it('rejects empty strings and whitespace strings safely', () => {
      const emptyStream = resolveMediaAsset('', 'stream');
      expect(emptyStream.isValid).toBe(false);
      expect(resolveStreamUrl('   ')).toBeNull();
    });

    it('rejects excessively long URLs (>4096 characters)', () => {
      const hugeUrl = 'https://example.com/' + 'a'.repeat(4500) + '.mp4';
      const result = resolveMediaAsset(hugeUrl, 'stream');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toContain('maximum length');
    });
  });

  describe('Protocol Enforcement & Malicious Scheme Rejection', () => {
    it('accepts standard HTTPS and HTTP URLs', () => {
      const httpsPoster = resolveMediaAsset('https://images.example.com/poster.jpg', 'poster');
      expect(httpsPoster.isValid).toBe(true);
      expect(httpsPoster.sourceType).toBe('https');
      expect(httpsPoster.uri).toBe('https://images.example.com/poster.jpg');

      const httpBackdrop = resolveMediaAsset('http://images.example.com/backdrop.png', 'backdrop');
      expect(httpBackdrop.isValid).toBe(true);
      expect(httpBackdrop.sourceType).toBe('http');
    });

    it('accepts relative local assets', () => {
      const local = resolveMediaAsset('./assets/images/poster.png', 'poster');
      expect(local.isValid).toBe(true);
      expect(local.sourceType).toBe('local');
      expect(local.uri).toBe('./assets/images/poster.png');
    });

    it('accepts offline-safe vector SVG data URIs for images', () => {
      const svg = 'data:image/svg+xml;utf8,<svg><rect/></svg>';
      const resolved = resolveMediaAsset(svg, 'poster');
      expect(resolved.isValid).toBe(true);
      expect(resolved.sourceType).toBe('svg_data');
    });

    it('rejects data URIs when requested for playable video streams', () => {
      const svg = 'data:image/svg+xml;utf8,<svg><rect/></svg>';
      const streamResult = resolveMediaAsset(svg, 'stream');
      expect(streamResult.isValid).toBe(false);
      expect(resolveStreamUrl(svg)).toBeNull();
    });

    it('strictly rejects javascript:, file:, blob:, and vbscript: URIs', () => {
      expect(resolveMediaAsset('javascript:alert(1)', 'poster').isValid).toBe(false);
      expect(resolveMediaAsset('file:///etc/passwd', 'stream').isValid).toBe(false);
      expect(resolveMediaAsset('blob:http://localhost/1234', 'stream').isValid).toBe(false);
      expect(resolveMediaAsset('vbscript:msgbox(1)', 'backdrop').isValid).toBe(false);

      expect(resolveStreamUrl('javascript:alert(1)')).toBeNull();
    });

    it('rejects URLs with embedded user credentials', () => {
      const credentialUrl = 'https://admin:secretpass@streaming.cdn.com/live.m3u8';
      const result = resolveMediaAsset(credentialUrl, 'stream');
      expect(result.isValid).toBe(false);
      expect(result.errorReason).toContain('embedded credentials');
      expect(resolveStreamUrl(credentialUrl)).toBeNull();
    });
  });

  describe('Convenience Helper Functions', () => {
    it('resolvePosterUrl guarantees non-empty poster URI', () => {
      expect(resolvePosterUrl(null)).toBe(DEFAULT_POSTER_FALLBACK);
      expect(resolvePosterUrl('invalid-url')).toBe(DEFAULT_POSTER_FALLBACK);
      expect(resolvePosterUrl('https://example.com/movie.jpg')).toBe('https://example.com/movie.jpg');
    });

    it('resolveBackdropUrl guarantees non-empty backdrop URI', () => {
      expect(resolveBackdropUrl(null)).toBe(DEFAULT_BACKDROP_FALLBACK);
      expect(resolveBackdropUrl('https://example.com/bg.jpg')).toBe('https://example.com/bg.jpg');
    });

    it('resolveStreamUrl returns valid stream URL or null', () => {
      expect(resolveStreamUrl('https://commondatastorage.googleapis.com/sample/TearsOfSteel.mp4')).toBe(
        'https://commondatastorage.googleapis.com/sample/TearsOfSteel.mp4',
      );
      expect(resolveStreamUrl('javascript:evil()')).toBeNull();
      expect(resolveStreamUrl('')).toBeNull();
    });
  });
});
