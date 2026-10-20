// High-fidelity cinematic SVG artwork generator for CinePilot catalog
// Guarantees zero 404s, zero unmatching images (no castles, no random galaxies, no earth from space)

export function generateCinematicPoster(options: {
  title: string;
  category: string;
  genres: string[];
  year: number;
  rating: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentSymbol?: string;
  subtitle?: string;
}): string {
  const {
    title,
    category,
    genres,
    year,
    rating,
    primaryColor = '#00A8E1',
    secondaryColor = '#0E1A2E',
    accentSymbol = '▶',
    subtitle = '',
  } = options;

  const genreText = genres.slice(0, 2).join(' • ');

  // Create clean SVG data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${secondaryColor}"/>
        <stop offset="50%" stop-color="#070D18"/>
        <stop offset="100%" stop-color="#020409"/>
      </linearGradient>
      <radialGradient id="glow" cx="70%" cy="30%" r="60%">
        <stop offset="0%" stop-color="${primaryColor}" stop-opacity="0.35"/>
        <stop offset="50%" stop-color="${primaryColor}" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#020409" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="scrim" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.1"/>
        <stop offset="60%" stop-color="#000000" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#020408" stop-opacity="0.95"/>
      </linearGradient>
    </defs>

    <!-- Background Base -->
    <rect width="1280" height="720" fill="url(#bg)"/>

    <!-- Subtle Grid / Texture Lines -->
    <g opacity="0.06" stroke="#FFFFFF" stroke-width="1">
      <line x1="0" y1="180" x2="1280" y2="180"/>
      <line x1="0" y1="360" x2="1280" y2="360"/>
      <line x1="0" y1="540" x2="1280" y2="540"/>
      <line x1="320" y1="0" x2="320" y2="720"/>
      <line x1="640" y1="0" x2="640" y2="720"/>
      <line x1="960" y1="0" x2="960" y2="720"/>
    </g>

    <!-- Glowing Atmosphere -->
    <rect width="1280" height="720" fill="url(#glow)"/>

    <!-- Focal Graphic Accent in Center/Right -->
    <g transform="translate(860, 320)" opacity="0.18">
      <circle r="180" fill="none" stroke="${primaryColor}" stroke-width="8"/>
      <circle r="130" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="10 8"/>
      <text x="0" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="140" font-weight="900" fill="${primaryColor}" text-anchor="middle">
        ${accentSymbol}
      </text>
    </g>

    <!-- Bottom Scrim -->
    <rect width="1280" height="720" fill="url(#scrim)"/>

    <!-- CinePilot Studio Tag (Top Right) -->
    <g transform="translate(1120, 50)">
      <rect x="-10" y="-24" width="130" height="34" rx="6" fill="rgba(0, 168, 225, 0.15)" stroke="${primaryColor}" stroke-width="1.5"/>
      <text x="55" y="-2" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="800" fill="${primaryColor}" text-anchor="middle" letter-spacing="1.5">
        CINEPILOT
      </text>
    </g>

    <!-- Category / Rating Badges (Top Left) -->
    <g transform="translate(60, 54)">
      <rect x="0" y="-24" width="76" height="30" rx="4" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.2)" stroke-width="1"/>
      <text x="38" y="-4" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" fill="#E2E8F0" text-anchor="middle">
        ${rating}
      </text>
      <text x="96" y="-4" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600" fill="${primaryColor}">
        ${category.toUpperCase()} • ${year}
      </text>
    </g>

    <!-- Title and Metadata in Lower Third -->
    <g transform="translate(60, 540)">
      ${subtitle ? `<text x="0" y="-30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="700" fill="${primaryColor}" letter-spacing="1">${subtitle.toUpperCase()}</text>` : ''}
      <text x="0" y="45" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="900" fill="#FFFFFF" letter-spacing="0.5">
        ${title.toUpperCase()}
      </text>
      <text x="0" y="95" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">
        ${genreText} • Ultra HD • HDR
      </text>
    </g>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Tailored Hero artwork for The Boys
export const THE_BOYS_HERO_IMAGE = generateCinematicPoster({
  title: 'The Boys',
  category: 'TV Shows',
  genres: ['Action', 'Science Fiction', 'Drama'],
  year: 2024,
  rating: 'TV-MA',
  primaryColor: '#00A8E1',
  secondaryColor: '#0D1E36',
  accentSymbol: '⚡',
  subtitle: 'New episode Thursday',
});

// Catalog artwork map for all titles
export const CINEPILOT_ARTWORK: Record<string, string> = {
  'the-boys': THE_BOYS_HERO_IMAGE,
  'reacher': generateCinematicPoster({
    title: 'Reacher',
    category: 'TV Shows',
    genres: ['Action', 'Crime'],
    year: 2023,
    rating: 'TV-MA',
    primaryColor: '#F59E0B',
    secondaryColor: '#1A1812',
    accentSymbol: '🎯',
    subtitle: 'Jack Reacher Returns',
  }),
  'summer-turned-pretty': generateCinematicPoster({
    title: 'The Summer I Turned Pretty',
    category: 'TV Shows',
    genres: ['Drama', 'Romance'],
    year: 2023,
    rating: 'TV-14',
    primaryColor: '#38BDF8',
    secondaryColor: '#0C1E32',
    accentSymbol: '🌊',
    subtitle: 'A New Summer Romance',
  }),
  'mr-mrs-smith': generateCinematicPoster({
    title: 'Mr. & Mrs. Smith',
    category: 'TV Shows',
    genres: ['Action', 'Thriller'],
    year: 2024,
    rating: 'TV-MA',
    primaryColor: '#EC4899',
    secondaryColor: '#20101C',
    accentSymbol: '🕶️',
    subtitle: 'Undercover Marriage',
  }),
  'idea-of-you': generateCinematicPoster({
    title: 'The Idea of You',
    category: 'Movies',
    genres: ['Romance', 'Comedy'],
    year: 2024,
    rating: 'R',
    primaryColor: '#A855F7',
    secondaryColor: '#180E28',
    accentSymbol: '🎸',
    subtitle: 'August Moon Tour',
  }),
  'sharmajee-ki-beti': generateCinematicPoster({
    title: 'Sharmajee Ki Beti',
    category: 'Movies',
    genres: ['Comedy', 'Drama'],
    year: 2024,
    rating: '13+',
    primaryColor: '#10B981',
    secondaryColor: '#0D221C',
    accentSymbol: '🌸',
    subtitle: 'Heartfelt Family Comedy',
  }),
  'my-fault': generateCinematicPoster({
    title: 'My Fault',
    category: 'Movies',
    genres: ['Drama', 'Romance'],
    year: 2023,
    rating: '16+',
    primaryColor: '#EF4444',
    secondaryColor: '#250C0C',
    accentSymbol: '🏎️',
    subtitle: 'Forbidden Attraction',
  }),
  'jackpot': generateCinematicPoster({
    title: 'Jackpot!',
    category: 'Movies',
    genres: ['Action', 'Comedy'],
    year: 2024,
    rating: 'R',
    primaryColor: '#EAB308',
    secondaryColor: '#241D08',
    accentSymbol: '🎰',
    subtitle: 'The Grand Lottery',
  }),
  'sausage-party': generateCinematicPoster({
    title: 'Sausage Party: Foodtopia',
    category: 'TV Shows',
    genres: ['Animation', 'Comedy'],
    year: 2024,
    rating: 'TV-MA',
    primaryColor: '#F97316',
    secondaryColor: '#261208',
    accentSymbol: '🌭',
    subtitle: 'Culinary Revolution',
  }),
  'family-man': generateCinematicPoster({
    title: 'The Family Man',
    category: 'TV Shows',
    genres: ['Action', 'Thriller'],
    year: 2021,
    rating: 'TV-MA',
    primaryColor: '#06B6D4',
    secondaryColor: '#0A1E26',
    accentSymbol: '🛡️',
    subtitle: 'NIA Special Operations',
  }),
  'panchayat': generateCinematicPoster({
    title: 'Panchayat',
    category: 'TV Shows',
    genres: ['Comedy', 'Drama'],
    year: 2024,
    rating: 'TV-14',
    primaryColor: '#84CC16',
    secondaryColor: '#16220A',
    accentSymbol: '🌾',
    subtitle: 'Phulera Village Stories',
  }),
  'interstellar': generateCinematicPoster({
    title: 'Interstellar',
    category: 'Movies',
    genres: ['Sci-Fi', 'Adventure'],
    year: 2014,
    rating: 'PG-13',
    primaryColor: '#6366F1',
    secondaryColor: '#10132E',
    accentSymbol: '🪐',
    subtitle: 'Mankind was not meant to die here',
  }),
  'live-news24': generateCinematicPoster({
    title: 'Prime 24/7 Live News',
    category: 'Live TV',
    genres: ['News', 'World Events'],
    year: 2026,
    rating: 'TV-G',
    primaryColor: '#EF4444',
    secondaryColor: '#220808',
    accentSymbol: '🔴',
    subtitle: 'Continuous Global Live Stream',
  }),
};
