import { CINEPILOT_CATALOG } from './cinePilotCatalog';

// Catalog API types
export type CatalogItem = {
  id: string;
  type: string;
  title: string;
  category: string;
  genres: string[];
  trending: boolean;
  rating_count: number;
  rating_stars: number;
  content_rating: string;
  release_year: number;
  duration_sec: number;
  images: {
    poster_16x9: string;
  };
  sources: Array<{
    type: string;
    url: string;
  }>;
  description: string;
};

export type CatalogResponse = {
  catalog_version: string;
  updated_at: string;
  items: CatalogItem[];
};

// Simplified card data for UI components
export type CardData = {
  id: string | number;
  title: string;
  description: string;
  posterUrl: string;
  backdropUrl: string;
  headerImage: string; // for backwards compatibility
  movie: string;
  duration?: number;
  category?: string;
  genres?: string[];
  releaseYear?: number;
  rating?: number;
  ratingCount?: number;
  contentRating?: string;
  trending?: boolean;
  progress?: number;
  language?: string;
};

const CATALOG_URL = 'https://giolaq.github.io/scrap-tv-feed/catalog.json';

// Transform catalog item to CardData format
export const transformCatalogItem = (item: CatalogItem): CardData => {
  const videoSource = item.sources.find((s) => s.type === 'video/mp4') || item.sources[0];
  const imgUrl = item.images.poster_16x9;

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    posterUrl: imgUrl,
    backdropUrl: imgUrl,
    headerImage: imgUrl,
    movie: videoSource?.url || '',
    duration: item.duration_sec,
    category: item.category,
    genres: item.genres,
    releaseYear: item.release_year,
    rating: item.rating_stars,
    ratingCount: item.rating_count,
    contentRating: item.content_rating,
    trending: item.trending,
    language: 'English',
  };
};

// Fetch movies: Defaults immediately to curated CinePilot AI entertainment catalogue
export const fetchMoviesData = async (): Promise<CardData[]> => {
  return CINEPILOT_CATALOG;
};

export const moviesData: CardData[] = CINEPILOT_CATALOG;
