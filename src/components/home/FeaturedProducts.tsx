import React from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Product } from '../../types/product';
import { AnimatedSection } from '../ui/AnimatedSection';

interface ProductCardProps {
  product: Product;
  index: number;
}

function ProductCard({ product, index }: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.2 }}
      className="group"
    >
      <div className="bg-zinc-900 rounded-2xl overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all duration-300">
        <div className="relative overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-purple-400 uppercase">
            {product.category}
          </span>
          <div className="flex items-center bg-zinc-800 px-2 py-1 rounded-full">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="ml-1 text-sm text-gray-300">{product.metrics.rating}</span>
          </div>
        </div>
        <h3 className="mt-2 text-lg font-semibold text-white">{product.title}</h3>
        <p className="mt-1 text-sm text-gray-400 line-clamp-2">{product.description}</p>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-lg font-bold text-white">${product.price}</span>
          <button className="flex items-center text-purple-400 hover:text-purple-300 group">
            View Details
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
    </motion.div>
  );
}

export function FeaturedProducts() {
  const featuredProducts: Product[] = [
    {
      id: '1',
      title: 'AI-Powered Analytics Suite',
      description: 'Enterprise-grade analytics platform with advanced AI capabilities for real-time data processing.',
      category: 'software',
      price: 299.99,
      sellerId: 'seller1',
      images: ['https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'],
      tags: ['AI', 'Analytics', 'Enterprise'],
      createdAt: new Date(),
      featured: true,
      status: 'approved',
      metrics: {
        views: 1200,
        sales: 45,
        rating: 4.8
      }
    },
    {
      id: '2',
      title: 'Smart Home Hub Controller',
      description: 'Next-generation IoT controller for seamless smart home automation and management.',
      category: 'hardware',
      price: 149.99,
      sellerId: 'seller2',
      images: ['https://images.unsplash.com/photo-1558002038-bb0d7e4e2a0f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80'],
      tags: ['IoT', 'Smart Home', 'Automation'],
      createdAt: new Date(),
      featured: true,
      status: 'approved',
      metrics: {
        views: 850,
        sales: 32,
        rating: 4.6
      }
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-black to-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection>
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">Featured Products</h2>
            <a href="#" className="text-purple-400 hover:text-purple-300 flex items-center group">
            View All
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </AnimatedSection>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}