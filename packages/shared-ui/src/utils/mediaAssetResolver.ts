/**
 * CinePilot AI - Systematic Media Asset Resolution Layer
 * Resolves, validates, and categorizes media assets (posters, backdrops, streams).
 * Enforces protocol safety, length bounds, credential scrubbing, and graceful fallbacks.
 */

import { logDiagnostic } from './diagnostics';
import { DEFAULT_POSTER_FALLBACK, DEFAULT_BACKDROP_FALLBACK } from './sanitizeUrl';

export type AssetCategory = 'poster' | 'backdrop' | 'thumbnail' | 'stream';

export type AssetSourceType =
  | 'local'
  | 'https'
  | 'http'
  | 'svg_data'
  | 'fallback'
  | 'invalid'
  | 'missing';

export interface ResolvedAsset {
  uri: string;
  category: AssetCategory;
  sourceType: AssetSourceType;
  isValid: boolean;
  isFallback: boolean;
  errorReason?: string;
}

const MAX_URL_LENGTH = 4096;

/**
 * Validates and resolves an image or video asset into a safe, typed ResolvedAsset descriptor.
 */
export function resolveMediaAsset(
  rawInput: unknown,
  category: AssetCategory,
  customFallback?: string,
): ResolvedAsset {
  const defaultFallbackUri =
    customFallback ||
    (category === 'poster' || category === 'thumbnail'
      ? DEFAULT_POSTER_FALLBACK
      : category === 'backdrop'
      ? DEFAULT_BACKDROP_FALLBACK
      : '');

  // 1. Check for missing or empty input
  if (rawInput === null || rawInput === undefined) {
    return {
      uri: defaultFallbackUri,
      category,
      sourceType: 'missing',
      isValid: false,
      isFallback: true,
      errorReason: 'Input is null or undefined',
    };
  }

  if (typeof rawInput !== 'string') {
    return {
      uri: defaultFallbackUri,
      category,
      sourceType: 'invalid',
      isValid: false,
      isFallback: true,
      errorReason: `Expected string, received ${typeof rawInput}`,
    };
  }

  const trimmed = rawInput.trim();
  if (trimmed.length === 0) {
    return {
      uri: defaultFallbackUri,
      category,
      sourceType: 'missing',
      isValid: false,
      isFallback: true,
      errorReason: 'Input is an empty string',
    };
  }

  if (trimmed.length > MAX_URL_LENGTH) {
    logDiagnostic('AssetResolution', 'warn', 'resolveMediaAsset', 'URL exceeds maximum allowed length', undefined, {
      length: trimmed.length,
      category,
    });
    return {
      uri: defaultFallbackUri,
      category,
      sourceType: 'invalid',
      isValid: false,
      isFallback: true,
      errorReason: 'URL exceeds maximum length limit',
    };
  }

  // 2. Local relative paths
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('assets/')
  ) {
    return {
      uri: trimmed,
      category,
      sourceType: 'local',
      isValid: true,
      isFallback: false,
    };
  }

  const lower = trimmed.toLowerCase();

  // 3. Reject dangerous protocols
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    logDiagnostic('AssetResolution', 'warn', 'resolveMediaAsset', 'Rejected dangerous URI scheme', undefined, {
      scheme: lower.slice(0, 15),
      category,
    });
    return {
      uri: defaultFallbackUri,
      category,
      sourceType: 'invalid',
      isValid: false,
      isFallback: true,
      errorReason: 'Prohibited protocol scheme',
    };
  }

  // 4. Safe vector SVG data URIs
  if (lower.startsWith('data:image/svg+xml')) {
    // Only permit safe image categories (not streams)
    if (category === 'stream') {
      return {
        uri: '',
        category,
        sourceType: 'invalid',
        isValid: false,
        isFallback: false,
        errorReason: 'Data URI cannot be used as a playable media stream',
      };
    }
    return {
      uri: trimmed,
      category,
      sourceType: 'svg_data',
      isValid: true,
      isFallback: false,
    };
  }

  // 5. Reject other data: URIs (e.g. large base64 strings)
  if (lower.startsWith('data:')) {
    return {
      uri: defaultFallbackUri,
      category,
      sourceType: 'invalid',
      isValid: false,
      isFallback: true,
      errorReason: 'Unsupported data URI format',
    };
  }

  // 6. Remote HTTP / HTTPS parsing
  try {
    const parsed = new URL(trimmed);

    // Reject embedded credentials (http://user:pass@host)
    if (parsed.username || parsed.password) {
      logDiagnostic('AssetResolution', 'warn', 'resolveMediaAsset', 'Rejected URL containing embedded credentials');
      return {
        uri: defaultFallbackUri,
        category,
        sourceType: 'invalid',
        isValid: false,
        isFallback: true,
        errorReason: 'URLs with embedded credentials are not permitted',
      };
    }

    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      // Validate stream specific formats if category is stream
      if (category === 'stream') {
        const pathLower = parsed.pathname.toLowerCase();
        const isPlayableExt =
          pathLower.endsWith('.mp4') ||
          pathLower.endsWith('.m3u8') ||
          pathLower.endsWith('.mpd') ||
          pathLower.endsWith('.webm') ||
          pathLower.includes('sample') ||
          pathLower.includes('video') ||
          pathLower.includes('stream');

        if (!isPlayableExt && !parsed.search) {
          logDiagnostic('AssetResolution', 'info', 'resolveMediaAsset', 'Stream URL may have non-standard extension', undefined, {
            pathname: parsed.pathname,
          });
        }
      }

      return {
        uri: parsed.href,
        category,
        sourceType: parsed.protocol === 'https:' ? 'https' : 'http',
        isValid: true,
        isFallback: false,
      };
    }
  } catch (err) {
    logDiagnostic('AssetResolution', 'debug', 'resolveMediaAsset', 'URL parsing failed', undefined, {
      error: String(err),
    });
  }

  return {
    uri: defaultFallbackUri,
    category,
    sourceType: 'invalid',
    isValid: false,
    isFallback: true,
    errorReason: 'Malformed or invalid URL',
  };
}

/**
 * Convenience helper to resolve poster image with guaranteed fallback.
 */
export function resolvePosterUrl(raw: unknown): string {
  return resolveMediaAsset(raw, 'poster').uri;
}

/**
 * Convenience helper to resolve backdrop image with guaranteed fallback.
 */
export function resolveBackdropUrl(raw: unknown): string {
  return resolveMediaAsset(raw, 'backdrop').uri;
}

/**
 * Convenience helper to resolve playable stream URL. Returns null if invalid.
 */
export function resolveStreamUrl(raw: unknown): string | null {
  const result = resolveMediaAsset(raw, 'stream');
  return result.isValid ? result.uri : null;
}
