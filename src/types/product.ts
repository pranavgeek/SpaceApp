export type ProductCategory = 'software' | 'hardware' | 'innovation';

export interface Product {
  id: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  sellerId: string;
  images: string[];
  tags: string[];
  createdAt: Date;
  featured: boolean;
  status: 'pending' | 'approved' | 'rejected';
  metrics: {
    views: number;
    sales: number;
    rating: number;
  };
}