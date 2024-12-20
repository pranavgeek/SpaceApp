export interface TrendingItem {
  id: string;
  title: string;
  image: string;
  category: string;
  trending: number;
  likes: number;
  views: number;
  creator: {
    name: string;
    avatar: string;
    verified: boolean;
    badges?: {
      type: 'trending' | 'featured' | 'new';
      label: string;
    }[];
  };
}