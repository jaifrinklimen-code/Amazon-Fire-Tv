import { CINEPILOT_ARTWORK, generateCinematicPoster } from './cinePilotArtwork';
import { DEFAULT_POSTER_FALLBACK, DEFAULT_BACKDROP_FALLBACK } from '../utils/sanitizeUrl';

// Streamlined 100% offline-safe cinematic title artwork map
// Binary bloat stripped into high-efficiency dynamic SVG asset references
export const TITLE_ARTWORK: Record<string, { posterUrl: string; backdropUrl: string }> = {
  "the-boys": {
    posterUrl: CINEPILOT_ARTWORK["the-boys"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["the-boys"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "reacher": {
    posterUrl: CINEPILOT_ARTWORK["reacher"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["reacher"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "summer-turned-pretty": {
    posterUrl: CINEPILOT_ARTWORK["summer-turned-pretty"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["summer-turned-pretty"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "mr-mrs-smith": {
    posterUrl: CINEPILOT_ARTWORK["mr-mrs-smith"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["mr-mrs-smith"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "fallout": {
    posterUrl: CINEPILOT_ARTWORK["fallout"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["fallout"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "rings-of-power": {
    posterUrl: CINEPILOT_ARTWORK["rings-of-power"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["rings-of-power"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "invincible": {
    posterUrl: CINEPILOT_ARTWORK["invincible"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["invincible"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "succession": {
    posterUrl: CINEPILOT_ARTWORK["succession"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["succession"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "last-of-us": {
    posterUrl: CINEPILOT_ARTWORK["last-of-us"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["last-of-us"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "breaking-bad": {
    posterUrl: CINEPILOT_ARTWORK["breaking-bad"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["breaking-bad"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "stranger-things": {
    posterUrl: CINEPILOT_ARTWORK["stranger-things"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["stranger-things"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "house-of-dragon": {
    posterUrl: CINEPILOT_ARTWORK["house-of-dragon"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["house-of-dragon"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "shogun": {
    posterUrl: CINEPILOT_ARTWORK["shogun"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["shogun"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "the-bear": {
    posterUrl: CINEPILOT_ARTWORK["the-bear"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["the-bear"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "severance": {
    posterUrl: CINEPILOT_ARTWORK["severance"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["severance"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "ted-lasso": {
    posterUrl: CINEPILOT_ARTWORK["ted-lasso"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["ted-lasso"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "sausage-party": {
    posterUrl: CINEPILOT_ARTWORK["sausage-party"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["sausage-party"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "family-man": {
    posterUrl: CINEPILOT_ARTWORK["family-man"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["family-man"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "panchayat": {
    posterUrl: CINEPILOT_ARTWORK["panchayat"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["panchayat"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "idea-of-you": {
    posterUrl: CINEPILOT_ARTWORK["idea-of-you"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["idea-of-you"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "sharmajee-ki-beti": {
    posterUrl: CINEPILOT_ARTWORK["sharmajee-ki-beti"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["sharmajee-ki-beti"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "my-fault": {
    posterUrl: CINEPILOT_ARTWORK["my-fault"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["my-fault"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "jackpot": {
    posterUrl: CINEPILOT_ARTWORK["jackpot"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["jackpot"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "interstellar": {
    posterUrl: CINEPILOT_ARTWORK["interstellar"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["interstellar"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "oppenheimer": {
    posterUrl: CINEPILOT_ARTWORK["oppenheimer"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["oppenheimer"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "top-gun-maverick": {
    posterUrl: CINEPILOT_ARTWORK["top-gun-maverick"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["top-gun-maverick"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "spider-verse": {
    posterUrl: CINEPILOT_ARTWORK["spider-verse"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["spider-verse"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "the-batman": {
    posterUrl: CINEPILOT_ARTWORK["the-batman"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["the-batman"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "gladiator": {
    posterUrl: CINEPILOT_ARTWORK["gladiator"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["gladiator"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "inception": {
    posterUrl: CINEPILOT_ARTWORK["inception"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["inception"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "dark-knight": {
    posterUrl: CINEPILOT_ARTWORK["dark-knight"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["dark-knight"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "avatar-2": {
    posterUrl: CINEPILOT_ARTWORK["avatar-2"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["avatar-2"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "everything-everywhere": {
    posterUrl: CINEPILOT_ARTWORK["everything-everywhere"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["everything-everywhere"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "knives-out": {
    posterUrl: CINEPILOT_ARTWORK["knives-out"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["knives-out"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "no-time-to-die": {
    posterUrl: CINEPILOT_ARTWORK["no-time-to-die"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["no-time-to-die"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "barbie": {
    posterUrl: CINEPILOT_ARTWORK["barbie"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["barbie"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "dune-2": {
    posterUrl: CINEPILOT_ARTWORK["dune-2"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["dune-2"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "john-wick-4": {
    posterUrl: CINEPILOT_ARTWORK["john-wick-4"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["john-wick-4"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "good-will-hunting": {
    posterUrl: CINEPILOT_ARTWORK["good-will-hunting"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["good-will-hunting"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "mirzapur": {
    posterUrl: CINEPILOT_ARTWORK["mirzapur"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["mirzapur"] || DEFAULT_BACKDROP_FALLBACK,
  },
  "citadel": {
    posterUrl: CINEPILOT_ARTWORK["citadel"] || DEFAULT_POSTER_FALLBACK,
    backdropUrl: CINEPILOT_ARTWORK["citadel"] || DEFAULT_BACKDROP_FALLBACK,
  },
};
