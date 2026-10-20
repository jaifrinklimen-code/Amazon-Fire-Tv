import { CardData } from './moviesData';

export type MoodType = 'all' | 'thrilling' | 'uplifting' | 'relaxed' | 'mind_bending';
export type ViewingTimeType = 'all' | 'quick' | 'standard' | 'extended';
export type LanguageFilterType = 'all' | 'english' | 'spanish' | 'international';

export interface WatchMateFilters {
  mood: MoodType;
  viewingTime: ViewingTimeType;
  language: LanguageFilterType;
  selectedGenre: string;
}

export interface WatchMateRecommendation {
  item: CardData;
  aiExplanation: string;
}

export function filterWatchMateCatalog(
  items: CardData[],
  filters: WatchMateFilters
): WatchMateRecommendation[] {
  if (!items || items.length === 0) return [];

  const results: WatchMateRecommendation[] = [];

  for (const item of items) {
    const genres = (item.genres || []).map((g) => g.toLowerCase());
    const durationMin = item.duration ? Math.round(item.duration / 60) : 100;
    const title = (item.title || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();

    // 1. Viewing time filter
    if (filters.viewingTime === 'quick' && durationMin > 45) continue;
    if (filters.viewingTime === 'standard' && (durationMin < 40 || durationMin > 110)) continue;
    if (filters.viewingTime === 'extended' && durationMin < 100) continue;

    // 2. Specific genre filter
    if (filters.selectedGenre !== 'all') {
      const gLower = filters.selectedGenre.toLowerCase();
      const hasGenre = genres.some((g) => g.includes(gLower));
      if (!hasGenre) continue;
    }

    // 3. Language filter heuristic
    if (filters.language === 'spanish') {
      const isSpanish =
        desc.includes('español') || desc.includes('spanish') || title.includes('el ') || title.includes('la ');
      if (!isSpanish) continue;
    } else if (filters.language === 'international') {
      const isIntl =
        desc.includes('foreign') ||
        desc.includes('world') ||
        desc.includes('international') ||
        (item.rating && item.rating > 4.5);
      if (!isIntl) continue;
    }

    // 4. Mood match and AI reason synthesis
    let fitsMood = true;
    let moodReason = '';

    switch (filters.mood) {
      case 'thrilling':
        fitsMood = genres.some(
          (g) =>
            g.includes('action') ||
            g.includes('thriller') ||
            g.includes('crime') ||
            g.includes('adventure') ||
            g.includes('sci-fi')
        );
        moodReason = 'High-octane pacing and suspense matching your thrilling mood';
        break;
      case 'uplifting':
        fitsMood = genres.some(
          (g) =>
            g.includes('comedy') ||
            g.includes('family') ||
            g.includes('animation') ||
            g.includes('music') ||
            g.includes('romance')
        );
        moodReason = 'Heartwarming and feel-good tone matching your uplifting mood';
        break;
      case 'relaxed':
        fitsMood = genres.some(
          (g) =>
            g.includes('documentary') ||
            g.includes('drama') ||
            g.includes('nature') ||
            g.includes('biography') ||
            g.includes('fantasy')
        );
        moodReason = 'Gentle cinematic flow and engaging storytelling perfect for relaxing';
        break;
      case 'mind_bending':
        fitsMood = genres.some(
          (g) =>
            g.includes('sci-fi') ||
            g.includes('mystery') ||
            g.includes('psychological') ||
            g.includes('thriller') ||
            g.includes('fantasy')
        );
        moodReason = 'Complex plot layers and twists matching your mind-bending request';
        break;
      default:
        moodReason = 'Highly matched to your viewing preferences';
        break;
    }

    if (filters.mood !== 'all' && !fitsMood) {
      continue;
    }

    const durationLabel = `${durationMin}m duration`;
    const genreLabel =
      item.genres && item.genres.length > 0 ? item.genres.slice(0, 2).join(' & ') : 'Curated';
    const explanation = `Matches: ${moodReason} • ${durationLabel} • ${genreLabel}`;

    results.push({
      item,
      aiExplanation: explanation,
    });
  }

  // If strict filtering returned nothing, provide top 3 fallback recommendations with AI insights
  if (results.length === 0 && items.length > 0) {
    return items.slice(0, 3).map((item) => ({
      item,
      aiExplanation: `Closest match: Available in ${
        item.duration ? Math.round(item.duration / 60) + 'm' : 'feature length'
      } • Curated selection`,
    }));
  }

  return results.slice(0, 8);
}
