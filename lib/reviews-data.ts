export type ReviewItem = {
  slug: string;
  author: string;
  city?: string;
  text: string;
  image?: string | null;
  instagramUrl?: string | null;
  directionSlugs?: string[];
  featured?: boolean;
};

// Старые статические отзывы удалены — теперь отзывы только из БД.
export const reviewsData: ReviewItem[] = [];