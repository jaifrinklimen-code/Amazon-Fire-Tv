export type RootStackParamList = {
  DrawerNavigator: undefined;
  Details: {
    title: string;
    description: string;
    headerImage: string;
    movie: string;
    id?: string | number;
    category?: string;
    genres?: string[];
    releaseYear?: number;
    rating?: number;
    ratingCount?: number;
    contentRating?: string;
    duration?: number;
  };
  Player: {
    movie: string;
    headerImage: string;
    title?: string;
    id?: string | number;
  };
};

export type DrawerParamList = {
  Home: undefined;
  Explore: undefined;
  LiveTV: undefined;
  MyList: undefined;
  WatchMate: undefined;
  Settings: undefined;
};
