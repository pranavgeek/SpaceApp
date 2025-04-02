import React from 'react';
import { motion } from 'framer-motion';
import { Verified, TrendingUp, Heart } from 'lucide-react';
import useSound from 'use-sound';

interface Creator {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: number;
  likes: number;
  verified: boolean;
  featured: {
    title: string;
    image: string;
  };
}

const creators: Creator[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'AI & Machine Learning Expert',
    followers: 52000,
    likes: 128000,
    verified: true,
    featured: {
      title: 'AI Development Kit',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    }
  },
  {
    id: '2',
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80',
    bio: 'Hardware Innovation Specialist',
    followers: 38000,
    likes: 95000,
    verified: true,
    featured: {
      title: 'Smart Home System',
      image: 'https://images.unsplash.com/photo-1558002038-bb0d7e4e2a0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'
    }
  }
];

export function CreatorSpotlight() {
  const [playLike] = useSound('/sounds/tap.mp3', { volume: 0.5 });

  return (
    <section className="py-6">
      <div className="px-4">
        <h2 className="text-sm font-light tracking-widest text-white/60 mb-6">
          FEATURED CREATORS
        </h2>
        <div className="space-y-6">
          {creators.map((creator, index) => (
            <motion.div
              key={creator.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="modern-card overflow-hidden"
            >
              <div className="relative aspect-video">
                <img
                  src={creator.featured.image}
                  alt={creator.featured.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => playLike()}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center ios-button"
                >
                  <Heart className="w-5 h-5 text-white" />
                </motion.button>
              </div>
              <div className="p-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-white/10"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-white font-light">{creator.name}</h3>
                      {creator.verified && (
                        <Verified className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <p className="text-sm text-white/60 font-light">{creator.bio}</p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 text-xs font-light tracking-wider text-black bg-white rounded-full hover:bg-white/90 transition-colors ios-button"
                  >
                    Follow
                  </motion.button>
                </div>
                <div className="flex items-center mt-4 space-x-6">
                  <div className="flex items-center text-white/60">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-xs font-light">
                      {creator.followers.toLocaleString()} followers
                    </span>
                  </div>
                  <div className="flex items-center text-white/60">
                    <Heart className="w-4 h-4 mr-1" />
                    <span className="text-xs font-light">
                      {creator.likes.toLocaleString()} likes
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}