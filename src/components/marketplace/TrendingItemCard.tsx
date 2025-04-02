import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import type { TrendingItem } from '../../types/marketplace';

interface TrendingItemCardProps {
  item: TrendingItem;
  index: number;
}

export function TrendingItemCard({ item, index }: TrendingItemCardProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="modern-card overflow-hidden group"
    >
      <div className="relative aspect-video">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        <div className="absolute top-4 right-4 flex space-x-2">
          {item.creator.badges?.map((badge) => (
            <div
              key={badge.type}
              className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md 
                        flex items-center space-x-1 text-xs font-medium text-white"
            >
              {badge.label}
            </div>
          ))}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center space-x-2 mb-2">
            <img
              src={item.creator.avatar}
              alt={item.creator.name}
              className="w-8 h-8 rounded-full ring-2 ring-white/10"
            />
            <div className="flex items-center">
              <span className="text-sm text-white font-light">
                {item.creator.name}
              </span>
              {item.creator.verified && (
                <Crown className="w-4 h-4 text-yellow-500 ml-1" />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-white/40 tracking-wider uppercase">
            {item.category}
          </span>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-white/60">
                {item.trending.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-white/60">
                {item.likes.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        
        <h3 className="text-lg text-white font-light mb-2 line-clamp-2">
          {item.title}
        </h3>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-white/40" />
            <span className="text-sm text-white/60">
              {item.views.toLocaleString()} views
            </span>
          </div>
          <button className="flex items-center space-x-1 text-white/60 
                           hover:text-white transition-colors ios-button group">
            <span className="text-sm font-light">Explore</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}