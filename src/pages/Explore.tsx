import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Sparkles, Zap, Crown, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Diamond, Gift, Award } from 'lucide-react';
import { SearchBar } from '../components/marketplace/SearchBar';
import { CategoryBar } from '../components/marketplace/CategoryBar';
import { TrendingItemCard } from '../components/marketplace/TrendingItemCard';
import { Stories } from '../components/social/Stories';
import { CreatorSpotlight } from '../components/social/CreatorSpotlight';
import useSound from 'use-sound';
import type { TrendingItem } from '../types/marketplace';

export function Explore() {
  const [playLike] = useSound('/sounds/tap.mp3', { volume: 0.5 });
  const [likedItems, setLikedItems] = React.useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = React.useState<Set<string>>(new Set());

  const handleLike = (id: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (prev.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        playLike();
      }
      return newSet;
    });
  };

  const handleSave = (id: string) => {
    setSavedItems(prev => {
      const newSet = new Set(prev);
      if (prev.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        playLike();
      }
      return newSet;
    });
  };

  const trendingItems: TrendingItem[] = [
    {
      id: '1',
      title: 'AI Vision Processing Kit',
      image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?ixlib=rb-1.2.1&auto=format&fit=crop&w=2378&q=80',
      category: 'AI Tools',
      trending: 5420,
      likes: 1200,
      views: 15000,
      description: 'Advanced computer vision toolkit with real-time object detection and scene analysis.',
      price: 299,
      creator: {
        name: 'AI Labs',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
        verified: true,
        badges: [
          { type: 'trending', label: '🔥 Trending' },
          { type: 'featured', label: '⭐ Featured Creator' }
        ]
      }
    },
    {
      id: '2',
      title: 'Smart IoT Development Board',
      image: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
      category: 'Hardware',
      trending: 3250,
      likes: 850,
      views: 9800,
      description: 'Professional IoT development board with integrated sensors and wireless connectivity.',
      price: 499,
      creator: {
        name: 'Quantum Tech',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
        verified: true,
        badges: [
          { type: 'new', label: '✨ New' }
        ]
      }
    }
  ];

  return (
    <div className="min-h-screen bg-black">
      <div className="pt-[calc(env(safe-area-inset-top)+4rem)]">
        {/* Premium Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Diamond className="w-5 h-5 text-white" />
              <span className="text-sm text-white font-light">Unlock Premium Features</span>
            </div>
            <button className="px-3 py-1 bg-white/20 rounded-full text-xs text-white font-light backdrop-blur-sm">
              Upgrade Now
            </button>
          </div>
        </motion.div>

        <SearchBar />
        <CategoryBar />
        <Stories />

        {/* Featured Collections */}
        <section className="py-6 px-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-light tracking-widest text-white/80">
              PREMIUM COLLECTIONS
            </h2>
            <button className="text-xs text-white/60 font-light">View All</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                title: 'Enterprise AI',
                image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                items: 12
              },
              {
                title: 'Smart Hardware',
                image: 'https://images.unsplash.com/photo-1563770660941-20978e870e26?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
                items: 8
              }
            ].map((collection, index) => (
              <motion.div
                key={collection.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
              >
                <img
                  src={collection.image}
                  alt={collection.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-white font-light mb-1">{collection.title}</h3>
                  <p className="text-xs text-white/60">{collection.items} items</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Premium Picks */}
        <section className="py-6 px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-white" />
              <h2 className="text-sm font-light tracking-widest text-white/80">
                PREMIUM PICKS
              </h2>
            </div>
            <button className="text-xs text-white/60 font-light">View All</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              {
                title: 'Neural Processing Unit',
                image: 'https://images.unsplash.com/photo-1597733336794-12d05021d510?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
              },
              {
                title: 'Quantum Sensor Array',
                image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
              },
              {
                title: 'AI Development Suite',
                image: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?ixlib=rb-1.2.1&auto=format&fit=crop&w=400&q=80'
              }
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="aspect-square rounded-2xl overflow-hidden relative group"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-2 right-2 z-10">
                  <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full flex items-center space-x-1">
                    <Diamond className="w-3 h-3 text-white" />
                    <span className="text-xs text-white font-light">Premium</span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  <h3 className="text-sm text-white font-light">{item.title}</h3>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trending Items */}
        <section className="py-6">
          <div className="space-y-6">
            {trendingItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="modern-card"
              >
                {/* Creator Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={item.creator.avatar}
                      alt={item.creator.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-light">{item.creator.name}</span>
                        {item.creator.verified && (
                          <Crown className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <span className="text-xs text-white/60">{item.category}</span>
                    </div>
                  </div>
                  <button className="ios-button">
                    <MoreHorizontal className="w-5 h-5 text-white/60" />
                  </button>
                </div>

                {/* Product Image */}
                <div className="relative aspect-square">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl text-white font-light mb-2">{item.title}</h3>
                    <p className="text-sm text-white/80 font-light line-clamp-2">
                      {item.description}
                    </p>
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-white font-light">${item.price}</span>
                      {item.creator.badges?.map(badge => (
                        <span key={badge.type} className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => handleLike(item.id)}
                        className="ios-button group"
                      >
                        <Heart
                          className={`w-7 h-7 ${
                            likedItems.has(item.id)
                              ? 'text-red-500 fill-current'
                              : 'text-white/80 group-hover:text-red-500 transition-colors'
                          }`}
                        />
                      </button>
                      <button className="ios-button">
                        <MessageCircle className="w-7 h-7 text-white/80" />
                      </button>
                      <button className="ios-button">
                        <Share2 className="w-7 h-7 text-white/80" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleSave(item.id)}
                      className="ios-button"
                    >
                      <Bookmark
                        className={`w-7 h-7 ${
                          savedItems.has(item.id)
                            ? 'text-white fill-current'
                            : 'text-white/80'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center space-x-4 text-sm text-white/60">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{item.likes.toLocaleString()} likes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{item.trending.toLocaleString()} trending</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{item.views.toLocaleString()} views</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-8">
          <div className="px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="modern-card p-6 text-center relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 via-transparent to-blue-600/20" />
              <Sparkles className="w-8 h-8 text-white mx-auto mb-4" />
              <h2 className="text-xl text-white font-light mb-2">
                Ready to showcase your innovation?
              </h2>
              <p className="text-white/60 text-sm font-light mb-6">
                Join our community of creators and reach millions of potential customers
              </p>
              <button 
                onClick={() => window.location.href = '/create'}
                className="px-6 py-3 bg-white text-black rounded-full 
                          text-sm font-light hover:bg-white/90 transition-colors"
              >
                Start Creating
              </button>
            </motion.div>
          </div>

          {/* Premium Benefits */}
          <div className="mt-8 px-4 grid grid-cols-3 gap-4">
            {[
              { icon: Diamond, label: 'Premium Access' },
              { icon: Gift, label: 'Exclusive Deals' },
              { icon: Award, label: 'Priority Support' }
            ].map((benefit, index) => (
              <motion.div
                key={benefit.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="modern-card p-4 text-center"
              >
                <benefit.icon className="w-6 h-6 text-white mx-auto mb-2" />
                <span className="text-xs text-white/60 font-light">{benefit.label}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Featured Creators */}
        <section className="py-6">
          <div className="px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-sm font-light tracking-widest text-white/80 mb-6"
            >
              FEATURED CREATORS
            </motion.h2>
            <CreatorSpotlight />
          </div>
        </section>
      </div>
    </div>
  );
}