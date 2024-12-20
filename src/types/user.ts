export type UserRole = 'seller' | 'customer' | 'creator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  location?: {
    country: string;
    city?: string;
    timezone: string;
  };
  languages: string[];
  socialLinks?: {
    twitter?: string;
    instagram?: string;
    tiktok?: string;
    linkedin?: string;
  };
  preferences: {
    language: string;
    currency: string;
    notifications: boolean;
  };
  joinedAt: Date;
}

export interface SellerProfile extends User {
  role: 'seller';
  products: string[];
  rating: number;
  verified: boolean;
}

export interface CreatorProfile extends User {
  role: 'creator';
  expertise: string[];
  portfolio: string[];
  availableForHire: boolean;
}