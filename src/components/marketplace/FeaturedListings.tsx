import React from 'react';
import { motion } from 'framer-motion';
import { Star, ArrowRight } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  rating: number;
  image: string;
  category: string;
}

const listings: Listing[] = [
  {
    id: '1',
    title: 'AI Image Generator Pro',
    description: 'Enterprise-grade AI image generation with custom training',
    price: 299,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-1.2.1&auto=format&fit=crop&w=2378&q=80',
    category: 'AI Tools'
  },
  {
    id: '2',
    title: 'Smart Home Hub',
    description: 'Complete IoT control center with advanced automation',
    price: 199,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1558002038-bb0d7e4e2a0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80',
    category: 'Hardware'
  }
];

export function FeaturedListings() {
  return (
    <section className="py-6">
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-light tracking-widest text-white/60">
            FEATURED LISTINGS
          </h2>
          <button className="text-xs text-white/60 font-light tracking-wide ios-button">
            View all
          </button>
        </div>
        <div className="space-y-4">
          {listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="modern-card overflow-hidden"
            >
              <div className="relative aspect-[16/9]">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center space-x-1">
                  <Star className="w-3 h-3 text-white" />
                  <span className="text-xs text-white font-light">{listing.rating}</span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-white/40 tracking-wider">
                    {listing.category}
                  </span>
                  <span className="text-sm font-light text-white">
                    ${listing.price}
                  </span>
                </div>
                <h3 className="text-white font-light mb-1">{listing.title}</h3>
                <p className="text-sm text-white/60 font-light mb-3">
                  {listing.description}
                </p>
                <button className="w-full py-2 text-xs font-light tracking-wider text-black bg-white rounded-full hover:bg-white/90 transition-colors flex items-center justify-center space-x-2">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}