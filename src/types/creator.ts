export interface Creator {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  earnings: number;
  products: string[];
  expertise: string[];
  verified: boolean;
}

export interface CreatorProgram {
  benefits: string[];
  requirements: string[];
  commission: number;
  supportedCategories: string[];
}