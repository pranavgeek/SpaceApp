import React from 'react';
import { motion } from 'framer-motion';
import { Layers, Code, Cpu, Lightbulb } from 'lucide-react';

const categories = [
  {
    icon: Code,
    title: 'Software',
    description: 'Cutting-edge applications and digital solutions',
    color: 'from-purple-500 to-indigo-600',
  },
  {
    icon: Cpu,
    title: 'Hardware',
    description: 'Innovative devices and technological components',
    color: 'from-rose-500 to-pink-600',
  },
  {
    icon: Lightbulb,
    title: 'Innovations',
    description: 'Groundbreaking ideas and revolutionary concepts',
    color: 'from-amber-500 to-orange-600',
  },
];

export function CategorySection() {
  return (
    <section className="py-24 bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-white mb-4"
          >
            Explore Categories
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-400 max-w-2xl mx-auto"
          >
            Discover innovative products across multiple technology domains
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="relative group">
                <div className={`absolute inset-0 bg-gradient-to-r ${category.color} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="relative bg-zinc-800 p-8 rounded-2xl group-hover:bg-opacity-90 transition-all">
                  <div className="h-12 w-12 mb-4">
                    <category.icon className="w-full h-full text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{category.title}</h3>
                  <p className="text-gray-400">{category.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}