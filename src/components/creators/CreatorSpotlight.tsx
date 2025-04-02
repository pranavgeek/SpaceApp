import React from 'react';
import { motion } from 'framer-motion';
import { Verified, TrendingUp } from 'lucide-react';
import type { Creator } from '../../types/creator';

const featuredCreators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'AI & Machine Learning Expert',
    followers: 52000,
    earnings: 125000,
    products: ['1', '2', '3'],
    expertise: ['AI', 'Software Development'],
    verified: true
  },
  {
    id: '2',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'Hardware Innovation Specialist',
    followers: 38000,
    earnings: 95000,
    products: ['4', '5'],
    expertise: ['Hardware', 'IoT'],
    verified: true
  }
];

export function CreatorSpotlight() {
  return (
    <section className="py-12">
      <div className="px-4">
        <h2 className="text-sm font-light tracking-widest text-white/60 mb-6">
          TOP CREATORS
        </h2>
        <div className="space-y-4">
          {featuredCreators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="modern-card p-4"
            >
              <div className="flex items-center space-x-4">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-white font-light">{creator.name}</h3>
                    {creator.verified && (
                      <Verified className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <p className="text-sm text-white/60 font-light">{creator.bio}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <div className="flex items-center text-white/60">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      <span className="text-xs font-light">
                        {creator.followers.toLocaleString()} followers
                      </span>
                    </div>
                  </div>
                </div>
                <button className="px-4 py-2 text-xs font-light tracking-wider text-black bg-white rounded-full hover:bg-white/90 transition-colors">
                  Follow
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}