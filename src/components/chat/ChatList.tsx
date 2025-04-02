import React from 'react';
import { motion } from 'framer-motion';
import { Verified, Star, Shield } from 'lucide-react';
import type { Chat } from '../../types/chat';

const chats: Chat[] = [
  {
    id: '1',
    participants: [{
      id: '1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
      role: 'influencer',
      verified: true,
      badges: {
        influencerTier: 'elite'
      }
    }],
    lastMessage: {
      id: '1',
      text: 'Would love to promote your AI Development Kit!',
      sender: 'influencer',
      timestamp: new Date(),
    },
    unreadCount: 1
  },
  {
    id: '2',
    participants: [{
      id: '2',
      name: 'Alex Rivera',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
      role: 'seller',
      verified: true
    }],
    lastMessage: {
      id: '2',
      text: 'The hardware specs look great. When can we discuss pricing?',
      sender: 'seller',
      timestamp: new Date(Date.now() - 3600000)
    },
    unreadCount: 0
  }
];

export function ChatList() {
  return (
    <div className="px-4 py-6 space-y-4">
      {chats.map((chat, index) => (
        <motion.button
          key={chat.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="w-full modern-card p-4 ios-button"
        >
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={chat.participants[0].avatar}
                alt={chat.participants[0].name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {chat.participants[0].verified && (
                <div className="absolute -bottom-1 -right-1 bg-black p-0.5 rounded-full">
                  <Verified className="w-4 h-4 text-white" />
                </div>
              )}
              {chat.participants[0].badges?.influencerTier && (
                <div className="absolute -top-1 -right-1 bg-black p-0.5 rounded-full">
                  <Star className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-white font-light">{chat.participants[0].name}</h3>
                  {chat.participants[0].badges?.influencerTier && (
                    <span className="text-xs text-white/60 capitalize">
                      {chat.participants[0].badges.influencerTier}
                    </span>
                  )}
                </div>
                <span className="text-xs text-white/40">
                  {new Date(chat.lastMessage.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-white/60 font-light truncate pr-4">
                  {chat.lastMessage.text}
                </p>
                {chat.unreadCount > 0 && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
            </div>
          </div>
        </motion.button>
      ))}
    </div>
  );
}