import type { User } from '../types/user';

export const demoAccounts: User[] = [
  {
    id: 'seller-demo',
    name: 'Sarah Chen',
    email: 'demo.seller@thespace.app',
    role: 'seller',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'AI & Machine Learning Expert',
    location: {
      country: 'United States',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles'
    },
    languages: ['English', 'Mandarin'],
    socialLinks: {
      twitter: '@sarahchen_ai',
      instagram: '@sarahchen.ai',
      tiktok: '@sarahchen_tech',
      linkedin: 'sarahchen',
    },
    preferences: {
      language: 'en',
      currency: 'USD',
      notifications: true
    },
    joinedAt: new Date('2024-01-01')
  },
  {
    id: 'buyer-demo',
    name: 'Alex Rivera',
    email: 'demo.buyer@thespace.app',
    role: 'customer',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'Tech Enthusiast & Early Adopter',
    location: {
      country: 'United Kingdom',
      city: 'London',
      timezone: 'Europe/London'
    },
    languages: ['English', 'Spanish'],
    preferences: {
      language: 'en',
      currency: 'GBP',
      notifications: true
    },
    joinedAt: new Date('2024-02-01')
  },
  {
    id: 'influencer-demo',
    name: 'Maya Johnson',
    email: 'demo.influencer@thespace.app',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'Tech Content Creator & Innovation Advocate',
    location: {
      country: 'Canada',
      city: 'Toronto',
      timezone: 'America/Toronto'
    },
    languages: ['English', 'French'],
    socialLinks: {
      twitter: '@mayatech',
      instagram: '@maya.tech',
      tiktok: '@maya_tech',
      linkedin: 'mayajohnson',
    },
    preferences: {
      language: 'en',
      currency: 'CAD',
      notifications: true
    },
    joinedAt: new Date('2024-01-15')
  }
];