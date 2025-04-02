export type ChatRole = 'buyer' | 'seller' | 'influencer';

export interface ChatMessage {
  id: string;
  text: string;
  sender: ChatRole;
  timestamp: Date;
  attachments?: string[];
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  role: ChatRole;
  verified?: boolean;
  badges?: {
    influencerTier?: 'rising' | 'established' | 'elite';
    creator?: boolean;
  };
}

export interface Chat {
  id: string;
  participants: ChatParticipant[];
  lastMessage: ChatMessage;
  unreadCount: number;
  productId?: string;
  campaignId?: string;
}